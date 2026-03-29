// server/src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["student", "company"],
      required: true,
    },
    // Common fields
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    githubId: {
      type: String,
      unique: true,
      sparse: true,
    },

    // Student fields
    fullName: {
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
    resumeText: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
    },
    phone: {
      type: String,
    },
    location: {
      type: String,
    },
    expectedSalary: {
      type: String,
    },
    // Company fields
    companyName: {
      type: String,
    },
    roleOffered: [
      {
        type: String, // e.g., "Software Engineer", "Data Analyst"
      },
    ],
    companySize: {
      type: String, // e.g., "1-10", "11-50", "51-200"
    },
    industry: {
      type: String, // e.g., "Software", "Mechanical", "Automobile"
    },
    companyLogoUrl: {
      type: String,
    },
    companyPhotos: [{
      type: String,
    }],
    companyDescription: {
      type: String,
    },
    companyLocation: {
      type: String,
    },
    companyLocationCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    companyWebsite: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
