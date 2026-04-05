import { generateDeepSeekResponse, streamDeepSeekResponse } from "../utils/deepseek.js";
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

  const answerLength = answer.trim().length;
  const isShortAnswer = answerLength < 10;
  const isNumericAnswer = /^\d+$/.test(answer.trim());
  const isSingleWordAnswer = answer.trim().split(/\s+/).length <= 2;

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

${isShortAnswer || isNumericAnswer || isSingleWordAnswer ? `
【重要】候选人的这个回答内容非常简短（"${answer}"），没有提供有实质意义的面试信息。

请直接、坦率地指出这个问题，然后礼貌地结束面试。例如：
"我注意到您的回答比较简短，没有充分展示您的能力。作为专业的面试官，我希望看到更详细的回答来了解您的经验和技能。不过面试时间有限，感谢您的参与，面试到此结束。"` : `请对候选人的最后一个回答进行简短的点评和总结，然后礼貌地结束面试，告知候选人面试到此结束，感谢他们的参与。`}

不要再问任何问题。
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

${isShortAnswer || isNumericAnswer || isSingleWordAnswer ? `
【重要】候选人的这个回答 "${answer}" 非常简短，没有实质内容。

请不要假装这个简短的回答有什么深层含义，也不要说"我明白了"或"好的"然后继续假装理解了。
你应该直接、友好地指出这个问题：

示例回应：
- "我注意到您的回答比较简短。作为面试官，我需要更详细的回答来了解您的经验和能力。请您重新回答一下刚才的问题，尽可能详细地描述您的相关经历。"
- "请不要只回答数字或单个词。请认真思考并用完整的句子回答问题，这样我才能更好地评估您的能力。"

然后再次提出同样的问题，或者根据情况问一个相关的后续问题。
` : `请继续对话——如果合适的话，简短地回顾一下候选人的回答，然后自然地提出下一个问题。`}

避免格式或标签。保持流畅和人性化。
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

export const respondToInterviewStream = async (req, res) => {
  const { chatHistory, answer, resume, role, roundType, topic, difficulty, isLastQuestion } =
    req.body;

  const historyFormatted = chatHistory
    .slice(-10)
    .map(
      (entry, i) => `问${i + 1}：${entry.question}\n答${i + 1}：${entry.answer}`
    )
    .join("\n\n");

  const answerLength = answer.trim().length;
  const isShortAnswer = answerLength < 10;
  const isNumericAnswer = /^\d+$/.test(answer.trim());
  const isSingleWordAnswer = answer.trim().split(/\s+/).length <= 2;

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

${isShortAnswer || isNumericAnswer || isSingleWordAnswer ? `
【重要】候选人的这个回答内容非常简短（"${answer}"），没有提供有实质意义的面试信息。

请直接、坦率地指出这个问题，然后礼貌地结束面试。例如：
"我注意到您的回答比较简短，没有充分展示您的能力。作为专业的面试官，我希望看到更详细的回答来了解您的经验和技能。不过面试时间有限，感谢您的参与，面试到此结束。"` : `请对候选人的最后一个回答进行简短的点评和总结，然后礼貌地结束面试，告知候选人面试到此结束，感谢他们的参与。`}

不要再问任何问题。
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

${isShortAnswer || isNumericAnswer || isSingleWordAnswer ? `
【重要】候选人的这个回答 "${answer}" 非常简短，没有实质内容。

请不要假装这个简短的回答有什么深层含义，也不要说"我明白了"或"好的"然后继续假装理解了。
你应该直接、友好地指出这个问题：

示例回应：
- "我注意到您的回答比较简短。作为面试官，我需要更详细的回答来了解您的经验和能力。请您重新回答一下刚才的问题，尽可能详细地描述您的相关经历。"
- "请不要只回答数字或单个词。请认真思考并用完整的句子回答问题，这样我才能更好地评估您的能力。"

然后再次提出同样的问题，或者根据情况问一个相关的后续问题。
` : `请继续对话——如果合适的话，简短地回顾一下候选人的回答，然后自然地提出下一个问题。`}

避免格式或标签。保持流畅和人性化。
`;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  try {
    for await (const chunk of streamDeepSeekResponse(prompt)) {
      res.write(chunk);
    }
    res.end();
  } catch (error) {
    console.error("respondToInterviewStream error:", error.message);
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
你是一名专业的面试评估专家。请严格根据候选人实际回答的内容进行评估。

【重要原则】
- 必须基于候选人实际说的话进行评价
- 如果回答内容简单、无意义或敷衍，应如实指出问题
- 不要添加任何简历中没有提到的虚假优点
- 评分和反馈必须与实际表现相符

评估任务：${roundType ? `面试类型：${roundType}` : ""}${customTopic ? `，重点关注：${customTopic}` : ""}

这是第 ${i + 1} 部分面试（共 ${chunks.length} 部分）。

【候选人实际问答内容】
${formatBlock(chunks[i])}

【应聘职位】
${roleSummary}

【候选人简历】
${resumeText}

请给出客观真实的评估反馈，明确指出：
1. 候选人实际回答了什么
2. 回答的质量如何（好在哪里或问题在哪里）
3. 与职位的匹配度

请保持客观中立，不要刻意美化或丑化。
`;

    const feedback = await generateDeepSeekResponse(prompt);
    feedbacks.push(feedback.trim());
  }

  const finalPrompt = `
你是一名严谨的面试评估专家。你将基于各部分的实际评估结果，给出最终的综合评价。

【核心原则】
- 所有评价必须基于候选人实际回答的内容
- 如果候选人的回答内容简单、敷衍、无实质信息，应如实指出这是问题所在
- 绝对不要凭空添加候选人在面试中没有展现的优点或能力
- 评价必须与面试中的实际表现相符

【面试基本信息】
- 应聘职位：${roleSummary}
- 难度级别：${difficulty || "中等"}
- 简历摘要：${resumeText}

【各部分实际评估结果】
${feedbacks.map((f, i) => `第 ${i + 1} 部分评估：\n${f}`).join("\n\n")}

【输出要求】
1. 基于以上实际评估，写一份客观的综合评价
2. 如实总结候选人在面试中展现的优点（如有）和不足（如有）
3. 最后另起一行，输出评估结论：
   如果候选人在面试中表现良好、回答有实质内容、与职位要求基本匹配 → "结果：通过"
   如果候选人回答敷衍、内容空洞、偏离职位要求或存在明显不足 → "结果：不通过"
4. 评估结论后不要添加任何解释
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
