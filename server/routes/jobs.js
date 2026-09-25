const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  updateJob,
  deleteJob,
} = require("../controllers/jobController");

router.get("/", getJobs); // public
router.get("/my-jobs", protect, authorize("recruiter"), getMyJobs);
router.get("/:id", getJobById); // public
router.post("/", protect, authorize("recruiter"), createJob);
router.put("/:id", protect, authorize("recruiter"), updateJob);
router.delete("/:id", protect, authorize("recruiter"), deleteJob);

module.exports = router;