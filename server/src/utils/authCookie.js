const ONE_DAY = 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === "production";

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
