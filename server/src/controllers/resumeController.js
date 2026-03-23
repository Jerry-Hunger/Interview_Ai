import User from "../models/User.js";
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
