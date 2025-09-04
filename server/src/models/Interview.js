import mongoose, { Schema } from "mongoose";

const InterviewSchema = new Schema(
  {
    chatHistory: [{ type: Object }], // stores { type, content, timestamp }
    finalFeedback: String,
    result: String,
    feedbacks: [String],
    type: String,
    difficulty: String,
    resumeText: String,
    roleSummary: String,
    roundType: String,
    customTopic: String,
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Interview", InterviewSchema);
