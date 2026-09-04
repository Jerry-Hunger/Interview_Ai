/** 统一 SSE 响应头，确保代理层不会缓存或缓冲 AI 流。 */
export const beginSse = (res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
};

/** 每条 AI 输出均使用 JSON SSE 帧，避免分块传输破坏客户端协议解析。 */
export const sendSseEvent = (res, payload) => {
  if (res.writableEnded) return;
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

/** SSE 建连后不能切换为 JSON 响应，因此按 SSE 帧传递通用错误。 */
export const sendSseError = (res, message) => {
  if (res.writableEnded) return;
  sendSseEvent(res, { type: "error", success: false, error: message });
  res.end();
};
