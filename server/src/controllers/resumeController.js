import User from "../models/User.js";
import { generateGeminiResponse } from "../utils/gemini.js";

export const updateResumeText = async (req, res) => {
  try {
    const { resumeText } = req.body; // frontend sends parsed text
    if (!resumeText) {
      return res.status(400).json({ msg: "Resume text required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { resumeText: resumeText },
      { new: true }
    ).select("-password");

    res.json({
      msg: "Resume text updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating resume:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
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
