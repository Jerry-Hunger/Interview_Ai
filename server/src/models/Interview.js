import mongoose, { Schema } from "mongoose";

const InterviewSchema = new Schema(
  {
    chatHistory: [{ type: Object }],
    finalFeedback: String,
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
    resumeText: String,
    roleSummary: String,
    roundType: {
      type: String,
      enum: ["behavioral", "technical", "system-design", "coding", "mixed"],
    },
    customTopic: String,
    rounds: { type: Number, default: 1 },
    currentRound: { type: Number, default: 1 },
    feedbacks: [{ type: String }],
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
  },
  { timestamps: true }
);

InterviewSchema.index({ student: 1, createdAt: -1 });
InterviewSchema.index({ student: 1 });
InterviewSchema.index({ createdAt: -1 });

export default mongoose.model("Interview", InterviewSchema);
