import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    // 旧数据可能缺少这些字段；新写入由 applicationController 强制完整性。
    roundNumber: { type: Number, min: 1 },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
    result: { type: String, enum: ["success", "failure"] },
    feedback: { type: String, default: "", maxlength: 50000 },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "JobOpening",
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    currentRound: { type: Number, default: 0, min: 0 },
    approvedThrough: { type: Number, default: 0, min: 0 },  // 企业已批准的轮次（企业点击"开启下一轮"时增加）
    status: {
      type: String,
      enum: [
        "applied",
        "in-progress",
        "selected",
        "final-selected",
        "rejected",
      ],
      default: "applied",
    },
    history: [historySchema],
  },
  { timestamps: true }
);

applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ jobId: 1, createdAt: -1 });
applicationSchema.index({ candidateId: 1, createdAt: -1 });
applicationSchema.index({ jobId: 1, status: 1 });

export default mongoose.model("Application", applicationSchema);
