import { generateDeepSeekResponse } from "../utils/deepseek.js";
import Interview from "../models/Interview.js";

export const startInterview = async (req, res) => {
  const { role, resume, roundType, topic, difficulty } = req.body;

  const prompt = `
你正在主持一场求职面试。

你的名字是艾莎，是一名经验丰富的面试官。不要提及你是 AI。

候选人的简历：
${resume}

应聘职位：${role}

${roundType ? `这是 ${roundType} 环节。` : ""}
${topic ? `请重点关注以下主题：${topic}。` : ""}
${difficulty ? `请将问题的难度调整为：${difficulty}。` : ""}

请自然专业地开始面试，像真正的面试官一样。介绍一下自己，然后用你自己的方式开始对话。避免机械化的语气。
`;

  try {
    const response = await generateDeepSeekResponse(prompt);
    res.json({ message: response.trim() });
  } catch (error) {
    console.error("startInterview error:", error.message);
    res.status(500).json({ error: "AI 响应失败，请稍后重试。" });
  }
};

export const respondToInterview = async (req, res) => {
  const { chatHistory, answer, resume, role, roundType, topic, difficulty, isLastQuestion } =
    req.body;

  const historyFormatted = chatHistory
    .slice(-10)
    .map(
      (entry, i) => `问${i + 1}：${entry.question}\n答${i + 1}：${entry.answer}`
    )
    .join("\n\n");

  let prompt;
  if (isLastQuestion) {
    prompt = `
    面试即将结束。

    你是艾莎，一名专业的面试官。不要提及你是 AI。

    ${role ? `职位描述：\n${role}` : ""}

    候选人的简历：
    ${resume}

    ${roundType ? `这是 ${roundType} 环节。` : ""}

    到目前为止的对话：
    ${historyFormatted}

    候选人的最后一个回答：
    "${answer}"

    请对候选人的最后一个回答进行简短的点评和总结，然后礼貌地结束面试，告知候选人面试到此结束，感谢他们的参与。不要再问任何问题。
    `;
  } else {
    prompt = `
    继续主持面试。

    你是艾莎，一名专业的面试官。不要提及你是 AI。

    ${role ? `职位描述：\n${role}` : ""}

    候选人的简历：
    ${resume}

    ${roundType ? `这是 ${roundType} 环节。` : ""}
    ${topic ? `候选人要求重点关注：${topic}。` : ""}
    ${difficulty ? `请保持 ${difficulty} 的问题难度。` : ""}

    到目前为止的对话：
    ${historyFormatted}

    最新回答：
    "${answer}"

    请继续对话——如果合适的话，简短地回顾一下候选人的回答，然后自然地提出下一个问题。避免格式或标签。保持流畅和人性化。
    `;
  }

  try {
    const responseText = await generateDeepSeekResponse(prompt);
    res.json({ message: responseText.trim() });
  } catch (error) {
    console.error("respondToInterview error:", error.message);
    res.status(500).json({ error: "AI 响应失败，请稍后重试。" });
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

export const concludeInterview = async (req, res) => {
  const {
    history = [],
    resumeText,
    roleSummary,
    roundType,
    customTopic,
    difficulty,
    typeOfInterview,
  } = req.body;

  const CHUNK_SIZE = 5;

  const formatBlock = (block) => {
    let result = "";
    let qCount = 1;

    for (let i = 0; i < block.length; i++) {
      if (block[i].type === "question") {
        result += `问${qCount}：${block[i].content}\n`;
        if (i + 1 < block.length && block[i + 1].type === "answer") {
          result += `答${qCount}：${block[i + 1].content}\n\n`;
          i++;
        }
        qCount++;
      }
    }
    return result.trim();
  };

  const chunks = [];
  for (let i = 0; i < history.length; i += CHUNK_SIZE) {
    chunks.push(history.slice(i, Math.min(i + CHUNK_SIZE, history.length)));
  }

  const feedbacks = [];

  for (let i = 0; i < chunks.length; i++) {
    const prompt = `
请评估 "${roundType}" 环节的候选人表现${customTopic ? `，重点关注 ${customTopic}` : ""}。

这是第 ${i + 1} 部分面试。

问答内容：
${formatBlock(chunks[i])}

职位描述：
${roleSummary}

简历：
${resumeText}

请给出清晰简洁的反馈，仅针对这一部分的面试。
`;

    const feedback = await generateDeepSeekResponse(prompt);
    feedbacks.push(feedback.trim());
  }

  const finalPrompt = `
你已经完成了分为 ${chunks.length} 个部分的面试评审。

职位：${roleSummary}
难度：${difficulty || "中等"}
简历：${resumeText}

以下是各部分的反馈：
${feedbacks.map((f, i) => `第 ${i + 1} 部分反馈：\n${f}`).join("\n\n")}

✅ 写一份关于候选人表现的最终总体总结。

✅ 然后在新的一行中明确说明：
结果：通过
或者
结果：不通过

不要在结果行之后添加任何解释。
`;

  const finalFeedback = await generateDeepSeekResponse(finalPrompt);

  const resultLine = finalFeedback
    .split("\n")
    .find((line) => line.includes("结果：通过") || line.includes("结果:通过") || line.includes("结果：不通过") || line.includes("结果:不通过"));

  const result = resultLine?.includes("不通过") ? "failure" : "success";
  const userId = req.user.id;

  const interview = new Interview({
    user: userId,
    chatHistory: history,
    finalFeedback,
    result,
    feedbacks,
    type: typeOfInterview,
    difficulty,
    resumeText,
    roleSummary,
    roundType,
    customTopic,
    createdAt: new Date(),
  });
  await interview.save();
  console.log("Saved interview:", interview._id);
  res.json({
    interview: interview,
  });
};

export const getUserInterviews = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("Fetching interviews for user:", userId);
    const interviews = await Interview.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.json(interviews);
  } catch (err) {
    console.error("Error fetching interviews:", err);
    res.status(500).json({ error: "获取面试记录失败" });
  }
};

export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: id, user: userId });
    if (!interview) {
      return res.status(404).json({ error: "面试记录不存在" });
    }

    res.json(interview);
  } catch (err) {
    console.error("Error fetching interview by ID:", err);
    res.status(500).json({ error: "获取面试详情失败" });
  }
};
