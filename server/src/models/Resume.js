// server/src/models/Resume.js
import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    textContent: {
      type: String,
    },
    parsedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Resume", resumeSchema);