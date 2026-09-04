import test from "node:test";
import assert from "node:assert/strict";
import { error, success } from "./apiResponse.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("统一响应工具固定成功与失败结构", () => {
  const ok = createResponse();
  success(ok, { resumes: [] }, 201);
  assert.equal(ok.statusCode, 201);
  assert.deepEqual(ok.body, { success: true, resumes: [] });

  const failed = createResponse();
  error(failed, "无权限访问", 403, [{ field: "role" }]);
  assert.deepEqual(failed.body, { success: false, error: "无权限访问", details: [{ field: "role" }] });
});
