import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
    },
    fullName: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    phone: {
      type: String,
    },
    location: {
      type: String,
    },
    education: {
      type: String,
    },
    skills: [
      {
        type: String,
      },
    ],
    expectedSalaryMin: {
      type: String,
    },
    expectedSalaryMax: {
      type: String,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
  },
  { timestamps: true }
);

studentSchema.index({ skills: 1 });

export default mongoose.model("Student", studentSchema);
