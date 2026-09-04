import crypto from "crypto";

const ONE_DAY = 24 * 60 * 60 * 1000;
const OAUTH_STATE_TTL = 10 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";
const GITHUB_OAUTH_STATE_COOKIE = "github_oauth_state";

/** 将 JWT 放入不可被脚本读取的 Cookie，降低 XSS 窃取令牌的风险。 */
export const setAuthCookie = (res, token) => {
  res.cookie("access_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: ONE_DAY,
    path: "/",
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
};

/** GitHub 回调必须验证由本站发起，避免授权码被用于登录 CSRF。 */
export const createGithubOAuthState = () => crypto.randomBytes(32).toString("hex");

export const setGithubOAuthStateCookie = (res, state) => {
  res.cookie(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: OAUTH_STATE_TTL,
    path: "/api/auth/github/callback",
  });
};

export const clearGithubOAuthStateCookie = (res) => {
  res.clearCookie(GITHUB_OAUTH_STATE_COOKIE, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/auth/github/callback",
  });
};

/** 使用常量时间比较，避免根据比较耗时泄露 state 的有效前缀。 */
export const isValidGithubOAuthState = (storedState, receivedState) => {
  if (typeof storedState !== "string" || typeof receivedState !== "string") return false;
  const stored = Buffer.from(storedState);
  const received = Buffer.from(receivedState);
  return stored.length === received.length && crypto.timingSafeEqual(stored, received);
};
