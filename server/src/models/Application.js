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
      ref: "User",
      required: true,
    },
    resumeText: { type: String, required: true },
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

export default mongoose.model("Application", applicationSchema);
