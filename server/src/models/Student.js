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
    // 当前默认简历；历史投递和面试始终引用 Resume 自身，不受默认项切换影响。
    defaultResumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    // 兼容旧数据，迁移完成后删除。新代码不得写入该字段。
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
  },
  { timestamps: true }
);

studentSchema.index({ skills: 1 });
studentSchema.index({ defaultResumeId: 1 });

export default mongoose.model("Student", studentSchema);
