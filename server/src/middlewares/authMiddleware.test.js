import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import authMiddleware from "./authMiddleware.js";

process.env.JWT_SECRET = "test-secret";

const runMiddleware = (middleware, req) => new Promise((resolve) => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; resolve({ req, response: this, nextCalled: false }); },
  };
  middleware(req, response, () => resolve({ req, response, nextCalled: true }));
});

test("鉴权中间件从 HttpOnly Cookie 读取 JWT", async () => {
  const token = jwt.sign({ id: "user-1", role: "student" }, process.env.JWT_SECRET);
  const result = await runMiddleware(authMiddleware("student"), { cookies: { access_token: token }, header: () => undefined });
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.user.id, "user-1");
});

test("鉴权中间件拒绝缺失令牌和错误角色", async () => {
  const missing = await runMiddleware(authMiddleware(), { cookies: {}, header: () => undefined });
  assert.equal(missing.response.statusCode, 401);
  assert.equal(missing.response.body.success, false);

  const token = jwt.sign({ id: "user-1", role: "student" }, process.env.JWT_SECRET);
  const forbidden = await runMiddleware(authMiddleware("company"), { cookies: { access_token: token }, header: () => undefined });
  assert.equal(forbidden.response.statusCode, 403);
  assert.equal(forbidden.response.body.error, "无权限访问");
});
