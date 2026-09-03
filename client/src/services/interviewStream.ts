import type { InterviewResult } from "@/types";

export class StreamRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "StreamRequestError";
    this.status = status;
  }
}

const readFailure = async (response: Response) => {
  try {
    const data = await response.json() as { error?: string; message?: string };
    return data.error || data.message || `服务器错误: ${response.status}`;
  } catch {
    return `服务器错误: ${response.status}`;
  }
};

const postStream = async (path: string, payload: unknown, onChunk: (chunk: string) => void) => {
  const response = await fetch(`/api${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new StreamRequestError(await readFailure(response), response.status);
  if (!response.body) throw new StreamRequestError("无法读取响应流", response.status);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let output = "";
  while (true) {
    const { value, done } = await reader.read();
    if (value) {
      const chunk = decoder.decode(value, { stream: !done });
      output += chunk;
      onChunk(chunk);
    }
    if (done) break;
  }
  return output;
};

export const respondInterviewStream = (payload: unknown, onChunk: (text: string) => void) =>
  postStream("/interview/respond-stream", payload, onChunk);

type ConclusionProgress = {
  onChunkStart?: (index: number) => void;
  onFinalStart?: () => void;
  onText?: (text: string, phase: "chunk" | "final") => void;
};

export type StreamedConclusion = {
  interviewId: string;
  result: InterviewResult;
  feedbacks: string[];
  finalFeedback: string;
};

/** 统一解析后端结束面试流的控制标记，页面只处理 UI 状态。 */
export const concludeInterviewStream = async (payload: unknown, progress: ConclusionProgress = {}): Promise<StreamedConclusion> => {
  const feedbacks: string[] = [];
  let finalFeedback = "";
  let interviewId = "";
  let result: InterviewResult | null = null;
  let chunkIndex = -1;
  let phase: "idle" | "chunk" | "final" = "idle";
  let endedInFinalPhase = false;
  let buffer = "";

  await postStream("/interview/conclude-stream", payload, (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const value = line.trim();
      if (!value) continue;
      if (value.startsWith("[CHUNK_START:")) {
        const match = value.match(/\[CHUNK_START:(\d+)\]/);
        if (match) {
          chunkIndex = Number(match[1]);
          feedbacks[chunkIndex] = "";
          phase = "chunk";
          endedInFinalPhase = false;
          progress.onChunkStart?.(chunkIndex);
        }
      } else if (value === "[FINAL_START]") {
        phase = "final";
        endedInFinalPhase = true;
        progress.onFinalStart?.();
      } else if (value.startsWith("[CHUNK_END:")) {
        phase = "idle";
      } else if (value.startsWith("[DONE:")) {
        const match = value.match(/\[DONE:([^:]+):([^\]]+)\]/);
        if (match) {
          interviewId = match[1];
          result = match[2] as InterviewResult;
        }
      } else if (phase === "chunk" && chunkIndex >= 0) {
        feedbacks[chunkIndex] += `${value}\n`;
        progress.onText?.(`${value}\n`, "chunk");
      } else if (phase === "final") {
        finalFeedback += `${value}\n`;
        progress.onText?.(`${value}\n`, "final");
      }
    }
  });

  // 流末尾没有换行时，保留最终反馈的最后一个片段。
  if (buffer.trim() && endedInFinalPhase && !buffer.trim().startsWith("[")) {
    finalFeedback += buffer.trim();
  }
  if (!interviewId || !result) throw new StreamRequestError("生成反馈失败：未收到完整结果", 502);
  return { interviewId, result, feedbacks: feedbacks.map((item) => item.trim()), finalFeedback: finalFeedback.trim() };
};
