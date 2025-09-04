import { generateGeminiResponse } from "../utils/gemini.js";
import Interview from "../models/Interview.js";

export const startInterview = async (req, res) => {
  const { role, resume, roundType, topic, difficulty } = req.body;

  const prompt = `
You are conducting a job interview.

Your name is Ashta, and you are an experienced interviewer. Never mention that you're an AI.

Candidate's Resume:
${resume}

Role is : ${role}

${roundType ? `This is a ${roundType} round.` : ""}
${topic ? `Please focus on the topic: ${topic}.` : ""}
${
  difficulty ? `Adjust the difficulty of your questions to: ${difficulty}.` : ""
}

Begin the interview naturally and professionally — like a real human interviewer. Introduce yourself and start the conversation in your own way. Avoid robotic tone.
`;

  try {
    const response = await generateGeminiResponse(prompt);
    res.json({ message: response.trim() });
  } catch (error) {
    console.error("startInterview error:", error.message);
    res.status(500).json({ error: "Gemini failed to respond." });
  }
};

export const respondToInterview = async (req, res) => {
  const { chatHistory, answer, resume, role, roundType, topic, difficulty } =
    req.body;

  const historyFormatted = chatHistory
    .slice(-10)
    .map(
      (entry, i) => `Q${i + 1}: ${entry.question}\nA${i + 1}: ${entry.answer}`
    )
    .join("\n\n");

  const prompt = `
Continue conducting the interview.

You are Astha, a professional interviewer. Never mention you're an AI.



${
  role
    ? `Role Description:
${role}`
    : ""
}

Candidate's Resume:
${resume}

${roundType ? `This is a ${roundType} round.` : ""}
${topic ? `The candidate requested focus on: ${topic}.` : ""}
${
  difficulty
    ? `Maintain a ${difficulty} level of difficulty in your questions.`
    : ""
}

Conversation so far:
${historyFormatted}

Latest answer:
"${answer}"

Now continue the conversation — briefly reflect on the user's answer if appropriate, and ask the next question naturally. Avoid formatting or labels. Stay fluid and humanlike.
`;

  try {
    const responseText = await generateGeminiResponse(prompt);
    res.json({ message: responseText.trim() });
  } catch (error) {
    console.error("respondToInterview error:", error.message);
    res.status(500).json({ error: "Failed to get Gemini response." });
  }
};

export const formatResume = async (req, res) => {
  const { resumeText } = req.body;

  const prompt = `
You are a resume formatter.

Given the following extracted resume text, organize it clearly into sections:
- Professional Summary (if any)
- Skills
- Projects
- Work Experience
- Education
- Certifications
- Achievements

Make it visually clean and readable using markdown formatting with proper headings and bullet points. Do not add any fake data.

Resume text:
${resumeText}
`;

  try {
    const formatted = await generateGeminiResponse(prompt);
    res.json({ formatted });
  } catch (error) {
    console.error("Error formatting resume:", error.message);
    res.status(500).json({ error: "Failed to format resume" });
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

  // if (history.length < 5) {
  //   return res.status(400).json({ error: "Not enough data to conclude." });
  // }

  const CHUNK_SIZE = 5;

  // ✅ Helper to format Q&A blocks
  // ✅ Helper to format Q&A blocks correctly from your chatHistory
  const formatBlock = (block) => {
    let result = "";
    let qCount = 1;

    for (let i = 0; i < block.length; i++) {
      if (block[i].type === "question") {
        result += `Q${qCount}: ${block[i].content}\n`;
        if (i + 1 < block.length && block[i + 1].type === "answer") {
          result += `A${qCount}: ${block[i + 1].content}\n\n`;
          i++; // skip the answer since we already processed it
        }
        qCount++;
      }
    }
    return result.trim();
  };

  // ✅ Split into N chunks of CHUNK_SIZE
  const chunks = [];
  for (let i = 0; i < history.length; i += CHUNK_SIZE) {
    chunks.push(history.slice(i, Math.min(i + CHUNK_SIZE, history.length)));
  }

  // ✅ Generate feedbacks for each chunk
  const feedbacks = [];

  for (let i = 0; i < chunks.length; i++) {
    const prompt = `
You're evaluating a candidate for the "${roundType}" round${
      customTopic ? ` with a focus on ${customTopic}` : ""
    }.

This is part ${i + 1} of the interview.

Questions & Answers:
${formatBlock(chunks[i])}

Role Summary:
${roleSummary}

Resume:
${resumeText}

Give clear and concise feedback for this part of the interview only.
    `;

    const feedback = await generateGeminiResponse(prompt);
    feedbacks.push(feedback.trim());
  }

  // ✅ Generate final evaluation
  const finalPrompt = `
You have reviewed an interview split into ${chunks.length} parts.

Role: ${roleSummary}
Difficulty: ${difficulty || "Medium"}
Resume: ${resumeText}

Here are the feedbacks:
${feedbacks.map((f, i) => `Part ${i + 1} Feedback:\n${f}`).join("\n\n")}

✅ Write a final overall summary of the candidate’s performance.

✅ Then, on a new line, state clearly:
Result: Success
OR
Result: Failure

Do NOT add any explanation after Result line.
`;

  const finalFeedback = await generateGeminiResponse(finalPrompt);

  const resultLine = finalFeedback
    .split("\n")
    .find((line) => line.trim().toLowerCase().startsWith("result:"));

  const result = resultLine?.toLowerCase().includes("success")
    ? "success"
    : "failure";
  const userId = req.user.id;
  // Save to DB
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

// ✅ Get all interviews of the logged-in user
export const getUserInterviews = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT
    console.log("Fetching interviews for user:", userId);
    const interviews = await Interview.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.json(interviews);
  } catch (err) {
    console.error("Error fetching interviews:", err);
    res.status(500).json({ error: "Server error while fetching interviews" });
  }
};

// ✅ Get a single interview by ID
export const getInterviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const interview = await Interview.findOne({ _id: id, user: userId });
    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    res.json(interview);
  } catch (err) {
    console.error("Error fetching interview by ID:", err);
    res.status(500).json({ error: "Server error while fetching interview" });
  }
};
