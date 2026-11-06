const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const upload = require("../config/multer");
const {
  applyToJob,
  getMyApplications,
  getApplicantsForJob,
  updateApplicationStatus,
  getRecruiterPipeline,
} = require("../controllers/applicationController");

// Runs the upload and returns a clear 400 message if the file is rejected
const uploadResume = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Resume must be 5 MB or smaller"
          : err.message || "Upload failed";
      return res.status(400).json({ message });
    }
    next();
  });
};

// Candidate routes
router.post(
  "/apply/:jobId",
  protect,
  authorize("candidate"),
  uploadResume,
  applyToJob
);
router.get("/my-applications", protect, authorize("candidate"), getMyApplications);

// Recruiter routes
router.get("/job/:jobId", protect, authorize("recruiter"), getApplicantsForJob);
router.put("/:id/status", protect, authorize("recruiter"), updateApplicationStatus);
router.get("/pipeline", protect, authorize("recruiter"), getRecruiterPipeline);

module.exports = router;