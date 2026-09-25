const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    requirements: { type: [String], default: [] },
    location: { type: String, required: true },
    jobType: {
      type: String,
      enum: ["full-time", "part-time", "internship", "contract", "remote"],
      default: "full-time",
    },
    salary: { type: String }, // e.g. "6-8 LPA" or "$60k-$80k"
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);