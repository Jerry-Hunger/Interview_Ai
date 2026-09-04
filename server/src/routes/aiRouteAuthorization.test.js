import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import interviewRoutes from "./interviewRoutes.js";
import resumeRoutes from "./resumeRoutes.js";

process.env.JWT_SECRET = "test-secret";

const runMiddleware = (middleware) => new Promise((resolve) => {
  const token = jwt.sign({ id: "company-1", role: "company" }, process.env.JWT_SECRET);
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; resolve(this); },
  };
  middleware({ cookies: { access_token: token }, header: () => undefined }, response, () => resolve(response));
});

const getFirstMiddleware = (router, path) => {
  const route = router.stack.find((layer) => layer.route?.path === path)?.route;
  assert.ok(route, `未找到路由 ${path}`);
  return route.stack[0].handle;
};

test("企业账号不能调用仅面向学生的 AI 接口", async () => {
  const routes = [
    [interviewRoutes, "/start-stream"],
    [interviewRoutes, "/respond-stream"],
    [interviewRoutes, "/conclude-stream"],
    [resumeRoutes, "/format-resume-stream"],
  ];

  for (const [router, path] of routes) {
    const response = await runMiddleware(getFirstMiddleware(router, path));
    assert.equal(response.statusCode, 403, path);
    assert.equal(response.body.error, "无权限访问", path);
  }
});
