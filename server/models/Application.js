const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    resumeUrl: { type: String, required: true },
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ["applied", "reviewed", "interview", "rejected", "hired"],
      default: "applied",
    },
  },
  { timestamps: true }
);

// Prevent same candidate applying to same job twice
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);