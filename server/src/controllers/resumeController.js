import User from "../models/User.js";
import Resume from "../models/Resume.js";
import { generateDeepSeekResponse } from "../utils/deepseek.js";

export const updateResumeText = async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) {
      return res.status(400).json({ msg: "简历内容不能为空" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { resumeText: resumeText },
      { new: true }
    ).select("-password");

    res.json({
      msg: "简历保存成功",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating resume:", err);
    res.status(500).json({ msg: "服务器错误", error: err.message });
  }
};

export const formatResume = async (req, res) => {
  const { resumeText } = req.body;

  const prompt = `
你是一个简历格式化助手。

请将以下提取的简历文本整理成清晰的结构，包含以下部分：
- 个人简介（如果有）
- 技能
- 项目经验
- 工作经历
- 教育背景
- 证书资质
- 获奖情况

请使用 Markdown 格式，使用适当的标题和项目符号，使其视觉上清晰易读。不要添加任何虚假信息。

简历内容：
${resumeText}
`;

  try {
    const formatted = await generateDeepSeekResponse(prompt);
    res.json({ formatted });
  } catch (error) {
    console.error("Error formatting resume:", error.message);
    res.status(500).json({ error: "简历格式化失败" });
  }
};

export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      return res.status(404).json({ error: "简历不存在" });
    }
    res.json(resume);
  } catch (err) {
    console.error("Error getting resume:", err);
    res.status(500).json({ error: "服务器错误" });
  }
};

export const getResumeByUserId = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: "用户不存在" });
    }
    if (!user.resumeId) {
      return res.status(404).json({ error: "用户未上传简历" });
    }
    const resume = await Resume.findById(user.resumeId);
    if (!resume) {
      return res.status(404).json({ error: "简历不存在" });
    }
    res.json(resume);
  } catch (err) {
    console.error("Error getting user resume:", err);
    res.status(500).json({ error: "服务器错误" });
  }
};
