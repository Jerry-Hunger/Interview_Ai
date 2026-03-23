import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB 已连接...");
  } catch (err) {
    console.error("❌ 数据库连接错误:", err.message);
    process.exit(1);
  }
};

export default connectDB;
