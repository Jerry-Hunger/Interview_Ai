import test from "node:test";
import assert from "node:assert/strict";
import { beginSse, sendSseError, sendSseEvent } from "./sseResponse.js";

test("SSE 响应统一设置流式协议头并在流内返回错误", () => {
  const headers = new Map();
  const writes = [];
  const response = {
    writableEnded: false,
    setHeader: (key, value) => headers.set(key, value),
    flushHeaders: () => writes.push("flushed"),
    write: (value) => writes.push(value),
    end: () => { response.writableEnded = true; },
  };
  beginSse(response);
  sendSseEvent(response, { type: "content", content: "第一段" });
  sendSseError(response, "AI 暂不可用");
  assert.equal(headers.get("Content-Type"), "text/event-stream");
  assert.equal(headers.get("X-Accel-Buffering"), "no");
  assert.match(writes[1], /"type":"content"/);
  assert.match(writes[2], /"type":"error"/);
  assert.equal(response.writableEnded, true);
});
