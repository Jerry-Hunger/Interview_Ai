import User from "../models/User.js";
import Student from "../models/Student.js";
import Company from "../models/Company.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import axios from "axios";

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;
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
      console.warn(`请求失败，剩余重试次数 ${retries - i - 1}:`, err.message);
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
    return ["fullName", "avatarUrl", "phone", "location", "education", "skills", "expectedSalaryMin", "expectedSalaryMax", "resumeId"];
  }
  return ["companyName", "companyLogoUrl", "companyPhotos", "companyDescription", "companyWebsite", "companySize", "industry", "roleOffered", "companyLocation", "companyLocationCoords"];
};

export const githubLogin = (req, res) => {
  const scope = "read:user user:email";
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${scope}`);
};

export const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

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
      return res.status(400).json({ error: "无法获取访问令牌" });
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
          return res.status(400).json({ error: "无法获取邮箱，请设置 GitHub 公开邮箱" });
        }

        const existingUser = await User.findOne({ email: primaryEmail });
        if (existingUser) {
          existingUser.githubId = githubId;
          await existingUser.save();
          user = existingUser;
        } else {
          const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
          user = await User.create({
            role: "student",
            email: primaryEmail,
            password: hashedPassword,
            githubId,
          });

          const StudentModel = getProfileModel("student");
          await StudentModel.create({
            _id: user._id,
            email: primaryEmail,
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
          user = await User.create({
            role: "student",
            email,
            password: hashedPassword,
            githubId,
          });

          const StudentModel = getProfileModel("student");
          await StudentModel.create({
            _id: user._id,
            email,
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

    res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&role=${user.role}`);
  } catch (err) {
    console.error("GitHub OAuth error:", err.message);
    res.status(500).json({ error: "GitHub 登录失败，请重试" });
  }
};

export const register = async (req, res) => {
  try {
    const { role, email, password, ...rest } = req.body;

    if (!["student", "company"].includes(role)) {
      return res.status(400).json({ message: "无效的角色" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "该邮箱已被注册" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      role,
      email,
      password: hashedPassword,
    });

    const ProfileModel = getProfileModel(role);
    const profileData = {
      _id: user._id,
      email,
    };

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

    await ProfileModel.create(profileData);

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const profile = await ProfileModel.findById(user._id).select("-password");

    res.status(201).json({ message: "注册成功", user: { ...profile.toObject(), email }, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "邮箱或密码错误" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "邮箱或密码错误" });

    const ProfileModel = getProfileModel(user.role);
    const profile = await ProfileModel.findById(user._id).select("-password");

    if (!profile) {
      return res.status(400).json({ message: "账户数据不完整，请联系管理员或重新注册" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role, user: { ...profile.toObject(), email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const me = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
    }

    const ProfileModel = getProfileModel(user.role);
    const profile = await ProfileModel.findById(userId).select("-password");

    res.json({ user: { ...profile.toObject(), email: user.email }, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "用户不存在" });
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
      { new: true }
    ).select("-password");

    res.json({ user: profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
