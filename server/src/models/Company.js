import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    companyLogoUrl: {
      type: String,
    },
    companyPhotos: [
      {
        type: String,
      },
    ],
    companyDescription: {
      type: String,
    },
    companyWebsite: {
      type: String,
    },
    companySize: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
    },
    industry: {
      type: String,
    },
    roleOffered: [
      {
        type: String,
      },
    ],
    companyLocation: {
      type: String,
    },
    companyLocationCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { timestamps: true }
);

companySchema.index({ companyName: 1 });
companySchema.index({ industry: 1 });

export default mongoose.model("Company", companySchema);
