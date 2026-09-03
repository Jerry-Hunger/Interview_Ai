import mongoose, { Schema } from "mongoose";

const chatMessageSchema = new Schema(
  {
    type: { type: String, enum: ["question", "answer"], required: true },
    content: { type: String, required: true, trim: true, maxlength: 10000 },
    timestamp: { type: String, maxlength: 64 },
  },
  { _id: false }
);

const InterviewSchema = new Schema(
  {
    chatHistory: { type: [chatMessageSchema], default: [] },
    finalFeedback: { type: String, maxlength: 50000 },
    result: {
      type: String,
      enum: ["success", "failure", "quit"],
    },
    type: {
      type: String,
      enum: ["practice", "company"],
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "senior"],
    },
    resumeText: { type: String, maxlength: 200000 },
    // 记录本次实际使用的简历版本，避免默认简历切换后无法还原面试上下文。
    resumeId: { type: Schema.Types.ObjectId, ref: "Resume" },
    applicationId: { type: Schema.Types.ObjectId, ref: "Application" },
    jobId: { type: Schema.Types.ObjectId, ref: "JobOpening" },
    roundNumber: { type: Number, min: 1 },
    roleSummary: { type: String, maxlength: 300 },
    roundType: {
      type: String,
      enum: ["behavioral", "technical", "hr"],
    },
    customTopic: { type: String, maxlength: 2000 },
    rounds: { type: Number, default: 1, min: 1 },
    currentRound: { type: Number, default: 1, min: 1 },
    feedbacks: [{ type: String, maxlength: 50000 }],
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
  },
  { timestamps: true }
);

InterviewSchema.index({ student: 1, createdAt: -1 });
// 同一轮可以保留退出后的重试记录；Application.history 只允许写入一条最终结果。
InterviewSchema.index({ applicationId: 1, roundNumber: 1, createdAt: -1 }, { sparse: true });

export default mongoose.model("Interview", InterviewSchema);
