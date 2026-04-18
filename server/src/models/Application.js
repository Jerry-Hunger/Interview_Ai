import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  roundNumber: Number,
  interviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview" },
  result: { type: String, enum: ["success", "failure"] },
  feedback: String,
});

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
    currentRound: { type: Number, default: 0 },
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
applicationSchema.index({ candidateId: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ createdAt: -1 });

export default mongoose.model("Application", applicationSchema);
