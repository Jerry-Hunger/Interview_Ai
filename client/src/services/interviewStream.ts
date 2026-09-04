import { handleTokenExpiration } from "@/utils/axiosInstance";
import type { ChatMessage, Interview, InterviewResult, InterviewType } from "@/types";

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

type SseMessage = {
  type: string;
  content?: string;
  text?: string;
  index?: number;
  interviewId?: string;
  result?: InterviewResult;
  feedbacks?: string[];
  finalFeedback?: string;
  error?: string;
};

/** 解析完整 SSE 事件帧，避免网络分包截断 JSON 或文本内容。 */
const postSse = async (path: string, payload: unknown, onMessage: (message: SseMessage) => void) => {
  const response = await fetch(`/api${path}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    // fetch 不经过 Axios 响应拦截器，流式请求需在此处复用相同的会话过期处理。
    if (response.status === 401) handleTokenExpiration();
    throw new StreamRequestError(await readFailure(response), response.status);
  }
  if (!response.body) throw new StreamRequestError("无法读取响应流", response.status);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const processEvent = async (event: string) => {
    const data = event
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return;

    let message: SseMessage;
    try {
      message = JSON.parse(data) as SseMessage;
    } catch {
      throw new StreamRequestError("服务器返回了无效的 SSE 数据", 502);
    }
    if (message.type === "error") {
      throw new StreamRequestError(message.error || "AI 响应失败，请稍后重试。", response.status);
    }
    onMessage(message);
  };

  while (true) {
    const { value, done } = await reader.read();
    if (value) {
      buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";
      for (const event of events) await processEvent(event);
    }
    if (done) break;
  }
  if (buffer.trim()) await processEvent(buffer);
};

export const startInterviewStream = async (payload: unknown) => {
  let output = "";
  await postSse("/interview/start-stream", payload, (message) => {
    if (message.type === "content") output += message.content || "";
  });
  return output.trim();
};

export const respondInterviewStream = async (payload: unknown, onChunk: (text: string) => void) => {
  let output = "";
  await postSse("/interview/respond-stream", payload, (message) => {
    if (message.type !== "content") return;
    const content = message.content || "";
    output += content;
    onChunk(content);
  });
  return output;
};

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

type InterviewFromConclusionInput = {
  type: InterviewType;
  role: string;
  difficulty: string;
  roundType: string;
  rounds: number;
  currentRound?: number;
  chatHistory: ChatMessage[];
  resumeText?: string;
};

/** 练习和企业面试共用结束流的结果映射，页面只处理各自的后续跳转。 */
export const createInterviewFromConclusion = (
  conclusion: StreamedConclusion,
  input: InterviewFromConclusionInput
): Interview => ({
  _id: conclusion.interviewId,
  type: input.type,
  role: input.role,
  difficulty: input.difficulty,
  roundType: input.roundType,
  rounds: input.rounds,
  currentRound: input.currentRound,
  result: conclusion.result,
  feedback: "",
  transcript: [],
  createdAt: new Date().toISOString(),
  finalFeedback: conclusion.finalFeedback,
  chatHistory: input.chatHistory,
  feedbacks: conclusion.feedbacks,
  resumeText: input.resumeText,
});

export const isRateLimitedInterviewError = (error: unknown) =>
  error instanceof StreamRequestError
    ? error.status === 429
    : typeof error === "object" && error !== null && "response" in error
      && (error as { response?: { status?: number } }).response?.status === 429;

export const getInterviewErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;

/** 统一解析后端结束面试的 SSE 事件，页面只处理 UI 状态。 */
export const concludeInterviewStream = async (payload: unknown, progress: ConclusionProgress = {}): Promise<StreamedConclusion> => {
  const feedbacks: string[] = [];
  let finalFeedback = "";
  let interviewId = "";
  let result: InterviewResult | null = null;
  let chunkIndex = -1;
  await postSse("/interview/conclude-stream", payload, (message) => {
    if (message.type === "chunk-start" && typeof message.index === "number") {
      chunkIndex = message.index;
      feedbacks[chunkIndex] = "";
      progress.onChunkStart?.(chunkIndex);
    } else if (message.type === "chunk" && chunkIndex >= 0) {
      const text = message.text || "";
      feedbacks[chunkIndex] += text;
      progress.onText?.(text, "chunk");
    } else if (message.type === "final-start") {
      progress.onFinalStart?.();
    } else if (message.type === "final") {
      const text = message.text || "";
      finalFeedback += text;
      progress.onText?.(text, "final");
    } else if (message.type === "done") {
      interviewId = message.interviewId || "";
      result = message.result || null;
      if (message.feedbacks) feedbacks.splice(0, feedbacks.length, ...message.feedbacks);
      if (message.finalFeedback !== undefined) finalFeedback = message.finalFeedback;
    }
  });

  if (!interviewId || !result) throw new StreamRequestError("生成反馈失败：未收到完整结果", 502);
  return { interviewId, result, feedbacks: feedbacks.map((item) => item.trim()), finalFeedback: finalFeedback.trim() };
};
