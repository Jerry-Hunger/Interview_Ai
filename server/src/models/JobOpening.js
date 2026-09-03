import mongoose from "mongoose";

const roundSchema = new mongoose.Schema({
  roundNumber: { type: Number, required: true, min: 1 },
  type: {
    type: String,
    enum: ["technical", "behavioral", "hr"],
    required: true,
  },
  difficulty: {
    type: String,
    enum: ["beginner", "intermediate", "senior"],
    required: true,
  },
  topic: { type: String },
  notes: { type: String },
});

const jobOpeningSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 20000 },
    skills: [{ type: String }],
    rounds: [roundSchema],
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

jobOpeningSchema.index({ companyId: 1, createdAt: -1 });
jobOpeningSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("JobOpening", jobOpeningSchema);
