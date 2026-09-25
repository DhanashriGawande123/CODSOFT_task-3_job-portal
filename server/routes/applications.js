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

// Candidate routes
router.post(
  "/apply/:jobId",
  protect,
  authorize("candidate"),
  (req, res, next) => {
    upload.single("resume")(req, res, function (err) {
      if (err) {
        console.log("UPLOAD MIDDLEWARE ERROR:", err);
        return res.status(500).json({ message: err.message || "Upload failed" });
      }
      next();
    });
  },
  applyToJob
);
router.get("/my-applications", protect, authorize("candidate"), getMyApplications);

// Recruiter routes
router.get("/job/:jobId", protect, authorize("recruiter"), getApplicantsForJob);
router.put("/:id/status", protect, authorize("recruiter"), updateApplicationStatus);
router.get("/pipeline", protect, authorize("recruiter"), getRecruiterPipeline);

module.exports = router;