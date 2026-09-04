import test from "node:test";
import assert from "node:assert/strict";
import { clearAuthCookie, setAuthCookie } from "./authCookie.js";

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
