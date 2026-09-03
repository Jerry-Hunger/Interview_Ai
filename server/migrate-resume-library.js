import "dotenv/config";
import mongoose from "mongoose";
import Student from "./src/models/Student.js";
import Resume from "./src/models/Resume.js";

const getFileKey = (fileUrl) => {
  try {
    return new URL(fileUrl).pathname.replace(/^\//, "");
  } catch {
    return "";
  }
};

const migrate = async () => {
  if (!process.env.MONGO_URI) throw new Error("缺少 MONGO_URI 环境变量");
  await mongoose.connect(process.env.MONGO_URI);

  const legacyResumes = await Resume.find({
    $or: [
      { title: { $exists: false } },
      { fileKey: { $exists: false } },
      { isArchived: { $exists: false } },
      { deletedAt: { $exists: false } },
      { textStatus: { $exists: false } },
    ],
  }).lean();

  if (legacyResumes.length) {
    await Resume.bulkWrite(legacyResumes.map((resume) => ({
      updateOne: {
        filter: { _id: resume._id },
        update: {
          $set: {
            title: resume.title || resume.fileName || "未命名简历",
            fileKey: resume.fileKey || getFileKey(resume.fileUrl),
            isArchived: resume.isArchived ?? false,
            deletedAt: resume.deletedAt ?? null,
            textStatus: resume.textStatus || (resume.text ? "ready" : "pending"),
          },
        },
      },
    })));
  }

  const studentResult = await Student.updateMany(
    { defaultResumeId: { $exists: false }, resumeId: { $exists: true, $ne: null } },
    [{ $set: { defaultResumeId: "$resumeId" } }]
  );

  console.log(`已迁移 ${legacyResumes.length} 份简历，设置 ${studentResult.modifiedCount} 个默认简历。`);
  await mongoose.disconnect();
};

migrate().catch(async (error) => {
  console.error("简历库迁移失败：", error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
