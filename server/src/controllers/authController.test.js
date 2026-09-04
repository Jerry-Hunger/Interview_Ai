import test from "node:test";
import assert from "node:assert/strict";
import { githubCallback, githubLogin } from "./authController.js";

const createResponse = () => ({
  statusCode: 200,
  body: null,
  cookies: [],
  clearedCookies: [],
  cookie(...args) { this.cookies.push(args); },
  clearCookie(...args) { this.clearedCookies.push(args); },
  redirect(url) { this.redirectUrl = url; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
});

test("GitHub 登录创建 state，并拒绝不匹配的回调", async () => {
  const loginResponse = createResponse();
  githubLogin({}, loginResponse);
  const state = loginResponse.cookies[0][1];
  const authorizationUrl = new URL(loginResponse.redirectUrl);

  assert.equal(authorizationUrl.searchParams.get("state"), state);
  assert.equal(loginResponse.cookies[0][0], "github_oauth_state");

  const callbackResponse = createResponse();
  await githubCallback({
    query: { code: "untrusted-code", state: "wrong-state" },
    cookies: { github_oauth_state: state },
  }, callbackResponse);

  assert.equal(callbackResponse.statusCode, 400);
  assert.equal(callbackResponse.body.error, "GitHub 授权请求无效或已过期");
  assert.equal(callbackResponse.clearedCookies[0][0], "github_oauth_state");
});
