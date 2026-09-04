import test from "node:test";
import assert from "node:assert/strict";
import {
  clearAuthCookie,
  clearGithubOAuthStateCookie,
  createGithubOAuthState,
  isValidGithubOAuthState,
  setAuthCookie,
  setGithubOAuthStateCookie,
} from "./authCookie.js";

test("会话 Cookie 设置为 HttpOnly 与 SameSite=Lax", () => {
  const calls = [];
  const response = {
    cookie: (...args) => calls.push(["cookie", ...args]),
    clearCookie: (...args) => calls.push(["clear", ...args]),
  };
  setAuthCookie(response, "token");
  clearAuthCookie(response);
  assert.equal(calls[0][1], "access_token");
  assert.equal(calls[0][3].httpOnly, true);
  assert.equal(calls[0][3].sameSite, "lax");
  assert.equal(calls[1][0], "clear");
});

test("GitHub OAuth state 使用短期 HttpOnly Cookie 且只能匹配原始值", () => {
  const calls = [];
  const response = {
    cookie: (...args) => calls.push(["cookie", ...args]),
    clearCookie: (...args) => calls.push(["clear", ...args]),
  };
  const state = createGithubOAuthState();
  setGithubOAuthStateCookie(response, state);
  clearGithubOAuthStateCookie(response);

  assert.match(state, /^[a-f0-9]{64}$/);
  assert.equal(calls[0][1], "github_oauth_state");
  assert.equal(calls[0][3].httpOnly, true);
  assert.equal(calls[0][3].maxAge, 10 * 60 * 1000);
  assert.equal(calls[0][3].path, "/api/auth/github/callback");
  assert.equal(calls[1][1], "github_oauth_state");
  assert.equal(isValidGithubOAuthState(state, state), true);
  assert.equal(isValidGithubOAuthState(state, `${state}0`), false);
  assert.equal(isValidGithubOAuthState(state, undefined), false);
});
