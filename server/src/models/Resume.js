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
    // OSS 对象键用于后续私有化访问和受控删除，URL 仅作为当前访问地址缓存。
    fileKey: {
      type: String,
      // 旧数据迁移前允许为空；新上传记录必须写入该字段。
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    title: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    fileType: {
      type: String,
      enum: ["pdf", "doc", "docx"],
      required: true,
    },
    mimeType: {
      type: String,
      maxlength: 100,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    checksum: {
      type: String,
      maxlength: 128,
    },
    text: {
      type: String,
      maxlength: 200000,
    },
    textStatus: {
      type: String,
      enum: ["pending", "ready", "failed"],
      default: "pending",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

resumeSchema.index({ studentId: 1, updatedAt: -1 });
resumeSchema.index({ studentId: 1, isArchived: 1, updatedAt: -1 });
resumeSchema.index({ studentId: 1, checksum: 1 });

export default mongoose.model("Resume", resumeSchema);
