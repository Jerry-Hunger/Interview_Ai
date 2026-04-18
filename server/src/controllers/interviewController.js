import { generateDeepSeekResponse, streamDeepSeekResponse } from "../utils/deepseek.js";
import Interview from "../models/Interview.js";

export const startInterview = async (req, res) => {
  const { role, resume, roundType, topic, difficulty, isContinuation, currentRound, totalRounds, previousFeedback } = req.body;

  let prompt;

  if (isContinuation && currentRound && totalRounds) {
    let continuationContext = `这是第 ${currentRound} 轮面试（共 ${totalRounds} 轮）。`;

    if (currentRound > 1 && previousFeedback) {
      continuationContext += `

【前一轮面试的反馈】
${previousFeedback}

请根据以上反馈，适当调整提问的深度和方向。对于前面已经表现良好的方面可以简化，对于需要改进的方面可以深入追问。`;
    }

    const roundQuestionCount = Math.max(3, 5 - currentRound + 1);

    prompt = `
你正在主持一场多轮求职面试的第 ${currentRound} 轮。

你的名字是艾莎，是一名经验丰富的面试官。不要提及你是 AI。

候选人的简历：
${resume}

应聘职位：${role}

${roundType ? `这是 ${roundType} 环节。` : ""}
${topic ? `请重点关注以下主题：${topic}。` : ""}
${difficulty ? `请将问题的难度调整为：${difficulty}。` : ""}

${continuationContext}

【重要】本轮请只提 ${roundQuestionCount} 个问题，不要提更多。保持问题简洁有力。

请简短地欢迎候选人进入第 ${currentRound} 轮面试，然后直接开始提问。保持对话流畅自然，避免机械化的语气。
`;
  } else {
    prompt = `
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
  }

  try {
    const response = await generateDeepSeekResponse(prompt);
    res.json({ message: response.trim() });
  } catch (error) {
    console.error("startInterview error:", error.message);
    res.status(500).json({ error: "AI 响应失败，请稍后重试。" });
  }
};

export const respondToInterview = async (req, res) => {
  const { chatHistory, answer, resume, role, roundType, topic, difficulty, isLastQuestion, currentRound, totalRounds } =
    req.body;

  const isLastRoundOfMultiRound = currentRound && totalRounds && currentRound >= totalRounds;
  const shouldEndInterview = isLastQuestion || isLastRoundOfMultiRound || (currentRound && isLastQuestion);

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
  if (shouldEndInterview) {
    const endMessage = currentRound && totalRounds
 ? `这是第 ${currentRound} 轮面试（共 ${totalRounds} 轮）的最后一题。`
 : "本轮面试即将结束。";

    prompt = `
${endMessage}

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

请先尝试追问一次，引导候选人详细回答。例如：
"您提到的X能详细说说吗？" 或 "能举例说明一下吗？"

如果候选人仍然拒绝详细回答或继续简短回应，再礼貌地结束面试。例如：
"我注意到您的回答仍然比较简短，没有充分展示您的能力。作为专业的面试官，我希望看到更详细的回答来了解您的经验和技能。不过面试时间有限，感谢您的参与，本轮面试到此结束。"

【注意】先追问，不要直接结束面试！` : `请对候选人的最后一个回答进行简短的点评和总结，然后礼貌地结束面试，告知候选人本轮面试到此结束，感谢他们的参与。`}

不要再问超过1个问题。
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

【重要】请仔细分析这个回答：
1. 首先判断回答是否与问题相关——即使回答较短，只要涉及了问题的核心内容，就应该给予肯定
2. 如果回答基本正确但不够详细，请具体指出缺少哪些方面的内容（如：实现细节、时间复杂度、边界情况、优缺点分析等），然后用更具体的问题引导面试者深入回答
3. 如果回答与问题完全不相关或敷衍，才要求重新回答

回复原则：
- 即使回答简短，只要相关就要肯定
- 指出不足时要具体，不要泛泛而谈
- 尽量引导面试者深入思考，而不是简单要求"详细回答"
- 如果需要追问，可以用更具体的问题（如："你提到了X，能详细说说Y吗？"。）

请继续对话，保持自然流畅。
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
  const { chatHistory, answer, resume, role, roundType, topic, difficulty, isLastQuestion, currentRound, totalRounds } =
    req.body;

  const isLastRoundOfMultiRound = currentRound && totalRounds && currentRound >= totalRounds;
  const shouldEndInterview = isLastQuestion || isLastRoundOfMultiRound || (currentRound && isLastQuestion);

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
  if (shouldEndInterview) {
    const endMessage = currentRound && totalRounds
 ? `这是第 ${currentRound} 轮面试（共 ${totalRounds} 轮）的最后一题。`
 : "本轮面试即将结束。";

    prompt = `
${endMessage}

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

请先尝试追问一次，引导候选人详细回答。例如：
"您提到的X能详细说说吗？" 或 "能举例说明一下吗？"

如果候选人仍然拒绝详细回答或继续简短回应，再礼貌地结束面试。例如：
"我注意到您的回答仍然比较简短，没有充分展示您的能力。作为专业的面试官，我希望看到更详细的回答来了解您的经验和技能。不过面试时间有限，感谢您的参与，本轮面试到此结束。"

【注意】先追问，不要直接结束面试！` : `请对候选人的最后一个回答进行简短的点评和总结，然后礼貌地结束面试，告知候选人本轮面试到此结束，感谢他们的参与。`}

不要再问超过1个问题。
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

【重要】请仔细分析这个回答：
1. 首先判断回答是否与问题相关——即使回答较短，只要涉及了问题的核心内容，就应该给予肯定
2. 如果回答基本正确但不够详细，请具体指出缺少哪些方面的内容（如：实现细节、时间复杂度、边界情况、优缺点分析等），然后用更具体的问题引导面试者深入回答
3. 如果回答与问题完全不相关或敷衍，才要求重新回答

回复原则：
- 即使回答简短，只要相关就要肯定
- 指出不足时要具体，不要泛泛而谈
- 尽量引导面试者深入思考，而不是简单要求"详细回答"
- 如果需要追问，可以用更具体的问题（如："你提到了X，能详细说说Y吗？"。）

请继续对话，保持自然流畅。
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

export const concludeInterview = async (req, res) => {
  const {
    history = [],
    resumeText,
    roleSummary,
    roundType,
    customTopic,
    difficulty,
    typeOfInterview,
    result: clientResult,
    totalRounds,
    currentRound,
  } = req.body;

  const studentId = req.user.id;

  if (clientResult === "Quit") {
    const interview = new Interview({
      student: studentId,
      chatHistory: history,
      finalFeedback: "面试已退出，未完成评估。",
      result: "quit",
      type: typeOfInterview,
      difficulty,
      resumeText,
      roleSummary,
      roundType,
      customTopic,
      rounds: totalRounds || 1,
      currentRound: currentRound || 1,
      createdAt: new Date(),
    });
    await interview.save();
    console.log("Saved quit interview:", interview._id);
    return res.json({
      interview: interview,
    });
  }

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
你是一名专业的面试评估专家。你将基于各部分的实际评估结果，给出最终的综合评价。

【面试基本信息】
- 面试总问题数：${history.length} 个
- 评估块数：${chunks.length} 个（每${CHUNK_SIZE}个问答为一块）
- 应聘职位：${roleSummary}
- 难度级别：${difficulty || "中等"}
- 简历摘要：${resumeText}

【各部分实际评估结果】
${feedbacks.map((f, i) => `第 ${i + 1} 部分评估：\n${f}`).join("\n\n")}

【评估标准】（请综合考虑以下因素）
1. 回答的相关性：回答是否与问题相关
2. 回答的深度：根据难度级别评估回答的详细程度
3. 面试表现整体性：即使部分回答不够完美，也要看整体表现
4. 成长潜力：对于初学者，评估学习态度和潜力
5. 与职位的匹配度：回答是否展现了职位所需的基本能力

【通过标准】（请宽容评估）
- 大部分回答涉及问题核心，即使有小瑕疵也给予通过
- 对于初级难度，要求可以适当放宽
- 除非明显敷衍、完全不相关或态度问题，否则给予通过机会
- 考虑面试者的整体表现，而非揪住某一个弱点不放

【输出要求】
1. 基于以上评估，写一份客观的综合评价，重点肯定面试者的优点
2. 如实总结优点和可以改进的地方（用鼓励的语气）
3. 最后另起一行，输出评估结论：
   如果面试者整体表现尚可，有基本的职位相关能力 → "结果：通过"
   如果面试者明显敷衍、态度消极、或者几乎所有问题都完全无法回答 → "结果：不通过"
4. 评估结论后不要添加任何解释
5. 【重要】不要使用"基于面试的X个部分"这样的固定句式，直接根据实际评估内容写综合评价
`;

  const finalFeedback = await generateDeepSeekResponse(finalPrompt);

  const resultLine = finalFeedback
    .split("\n")
    .find((line) => line.includes("结果：通过") || line.includes("结果:通过") || line.includes("结果：不通过") || line.includes("结果:不通过"));

  const result = resultLine?.includes("不通过") ? "failure" : "success";

  const interview = new Interview({
    student: studentId,
    chatHistory: history,
    finalFeedback,
    result,
    type: typeOfInterview,
    difficulty,
    resumeText,
    roleSummary,
    roundType,
    customTopic,
    rounds: totalRounds || 1,
    currentRound: currentRound || 1,
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
    const studentId = req.user.id;
    console.log("Fetching interviews for student:", studentId);
    const interviews = await Interview.find({ student: studentId }).sort({
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
    const studentId = req.user.id;

    const interview = await Interview.findOne({ _id: id, student: studentId });
    if (!interview) {
      return res.status(404).json({ error: "面试记录不存在" });
    }

    res.json(interview);
  } catch (err) {
    console.error("Error fetching interview by ID:", err);
    res.status(500).json({ error: "获取面试详情失败" });
  }
};
