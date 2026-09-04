import User from "../models/User.js";
import Student from "../models/Student.js";
import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import axios from "axios";
import logger from "../utils/logger.js";
import { success, error } from "../utils/apiResponse.js";
import {
  clearAuthCookie,
  clearGithubOAuthStateCookie,
  createGithubOAuthState,
  isValidGithubOAuthState,
  setAuthCookie,
  setGithubOAuthStateCookie,
} from "../utils/authCookie.js";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const HTTP_PROXY = process.env.HTTP_PROXY;
const GITHUB_TIMEOUT = parseInt(process.env.GITHUB_TIMEOUT || "30000");
const MAX_RETRIES = parseInt(process.env.GITHUB_MAX_RETRIES || "3");

const axiosInstance = axios.create({
  timeout: GITHUB_TIMEOUT,
  ...(HTTP_PROXY && {
    proxy: {
      host: new URL(HTTP_PROXY).hostname,
      port: new URL(HTTP_PROXY).port || 7890,
      protocol: new URL(HTTP_PROXY).protocol === "https:" ? "https" : "http",
    },
  }),
});

const fetchWithRetry = async (fn, retries = MAX_RETRIES) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      logger.warn({ retries: retries - i - 1, err: err.message }, "Request failed, retries left");
      if (i < retries - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
};

const getProfileModel = (role) => (role === "student" ? Student : Company);
const getProfileFields = (role) => {
  if (role === "student") {
    return ["fullName", "avatarUrl", "phone", "location", "education", "skills", "expectedSalaryMin", "expectedSalaryMax"];
  }
  return ["companyName", "companyLogoUrl", "companyPhotos", "companyDescription", "companyWebsite", "companySize", "industry", "roleOffered", "companyLocation", "companyLocationCoords"];
};

/**
 * MongoDB 单机部署不支持事务时，使用补偿删除避免留下没有资料记录的账号。
 */
const createUserWithProfile = async (userData, profileData) => {
  const user = await User.create(userData);
  try {
    const ProfileModel = getProfileModel(user.role);
    await ProfileModel.create({ _id: user._id, email: user.email, ...profileData });
    return user;
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    throw error;
  }
};

export const githubLogin = (req, res) => {
  const scope = "read:user user:email";
  const state = createGithubOAuthState();
  setGithubOAuthStateCookie(res, state);
  const params = new URLSearchParams({ client_id: GITHUB_CLIENT_ID, scope, state });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

export const githubCallback = async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !isValidGithubOAuthState(req.cookies?.github_oauth_state, state)) {
      clearGithubOAuthStateCookie(res);
      return error(res, "GitHub 授权请求无效或已过期", 400);
    }
    // state 只能使用一次，验证通过后立即删除以阻止回放。
    clearGithubOAuthStateCookie(res);

    const tokenResponse = await fetchWithRetry(async () => {
      return await axiosInstance.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
        },
        { headers: { Accept: "application/json" } }
      );
    });

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return error(res, "无法获取访问令牌", 400);
    }

    const userResponse = await fetchWithRetry(async () => {
      return await axiosInstance.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    });

    const { id: githubId, login: githubLogin, email, avatar_url: avatarUrl, name } = userResponse.data;

    let user = await User.findOne({ githubId });

    if (!user) {
      if (!email) {
        const emailsResponse = await fetchWithRetry(async () => {
          return await axiosInstance.get("https://api.github.com/user/emails", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
        });
        const primaryEmail = emailsResponse.data.find(e => e.primary)?.email;
        if (!primaryEmail) {
          return error(res, "无法获取邮箱，请设置 GitHub 公开邮箱", 400);
        }

        const existingUser = await User.findOne({ email: primaryEmail });
        if (existingUser) {
          existingUser.githubId = githubId;
          await existingUser.save();
          user = existingUser;
        } else {
          const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
          user = await createUserWithProfile({
            role: "student",
            email: primaryEmail,
            password: hashedPassword,
            githubId,
          }, {
            fullName: name || githubLogin,
            avatarUrl,
          });
        }
      } else {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          existingUser.githubId = githubId;
          await existingUser.save();
          user = existingUser;
        } else {
          const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
          user = await createUserWithProfile({
            role: "student",
            email,
            password: hashedPassword,
            githubId,
          }, {
            fullName: name || githubLogin,
            avatarUrl,
          });
        }
      }
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    setAuthCookie(res, token);
    res.redirect(`${process.env.FRONTEND_URL.split(',')[0]}/login?role=${user.role}`);
  } catch (err) {
    logger.error({ err }, "GitHub OAuth error");
    error(res, "GitHub 登录失败，请重试");
  }
};

export const register = async (req, res) => {
  try {
    const { role, email, password, ...rest } = req.body;

    if (!["student", "company"].includes(role)) {
      return error(res, "无效的角色", 400);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, "该邮箱已被注册", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const profileData = {};

    if (role === "student") {
      profileData.fullName = rest.name || "";
      profileData.education = rest.education || "";
      profileData.skills = typeof rest.skills === "string" && rest.skills.trim()
        ? rest.skills.split(/[,，、\s]+/).filter(Boolean)
        : [];
    } else {
      profileData.companyName = rest.name || "";
      profileData.industry = rest.industry || "";
      profileData.companySize = rest.companySize || "";
      profileData.roleOffered = typeof rest.roleOffered === "string" && rest.roleOffered.trim()
        ? rest.roleOffered.split(/[,，、\s]+/).filter(Boolean)
        : [];
    }

    const user = await createUserWithProfile({
      role,
      email,
      password: hashedPassword,
    }, profileData);

    const ProfileModel = getProfileModel(role);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const profile = await ProfileModel.findById(user._id).select("-password");

    setAuthCookie(res, token);
    success(res, { message: "注册成功", role: user.role, user: { ...profile.toObject(), email } }, 201);
  } catch (err) {
    logger.error({ err }, "注册失败");
    error(res, "注册失败，请稍后重试");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return error(res, "邮箱或密码错误", 400);

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return error(res, "邮箱或密码错误", 400);

    const ProfileModel = getProfileModel(user.role);
    const profile = await ProfileModel.findById(user._id).select("-password");

    if (!profile) {
      return error(res, "账户数据不完整，请联系管理员或重新注册", 400);
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    setAuthCookie(res, token);
    success(res, { role: user.role, user: { ...profile.toObject(), email: user.email } });
  } catch (err) {
    logger.error({ err }, "登录失败");
    error(res, "登录失败，请稍后重试");
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return error(res, "用户不存在", 404);
    }

    const ProfileModel = getProfileModel(user.role);
    const profile = await ProfileModel.findById(userId).select("-password");

    success(res, { user: { ...profile.toObject(), email: user.email }, role: user.role });
  } catch (err) {
    logger.error({ err }, "获取当前用户失败");
    error(res, "获取当前用户失败");
  }
};

export const logout = (_req, res) => {
  clearAuthCookie(res);
  success(res, { message: "已退出登录" });
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return error(res, "用户不存在", 404);
    }

    const ProfileModel = getProfileModel(user.role);
    const allowedFields = getProfileFields(user.role);
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const profile = await ProfileModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    success(res, { user: profile });
  } catch (err) {
    logger.error({ err }, "更新用户资料失败");
    error(res, "更新用户资料失败");
  }
};
