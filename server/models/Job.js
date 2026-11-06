const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    company: { type: String, trim: true },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] }, // shown as skill tags
    location: { type: String, required: true },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract", "remote"],
      default: "full-time",
    },
    category: { type: String, trim: true }, // e.g. "Software", "Marketing"
    experienceMin: { type: Number, default: 0 }, // years
    experienceMax: { type: Number, default: 0 },
    salaryMin: { type: Number }, // in LPA
    salaryMax: { type: Number }, // in LPA
    salary: { type: String }, // free-text, kept for older jobs
    openings: { type: Number, default: 1 },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);