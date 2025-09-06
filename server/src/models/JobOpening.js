import mongoose from "mongoose";

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true },
  type: {
    type: String,
    enum: ["technical", "behavioral", "hr"],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true,
  },
  topic: { type: String },
  duration: { type: Number }, // minutes
  notes: { type: String },
});

const jobOpeningSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    skills: [{ type: String }],
    rounds: [roundSchema],
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

export default mongoose.model("JobOpening", jobOpeningSchema);
