import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "doc", "docx"],
      required: true,
    },
    text: {
      type: String,
    },
  },
  { timestamps: true }
);

resumeSchema.index({ studentId: 1 });

export default mongoose.model("Resume", resumeSchema);
