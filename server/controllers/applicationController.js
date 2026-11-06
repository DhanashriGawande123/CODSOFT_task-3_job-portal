const fs = require("fs");
const Application = require("../models/Application");
const Job = require("../models/Job");

// Delete the uploaded file if the application is rejected after upload
const removeUploadedFile = (req) => {
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, () => {});
  }
};

// Candidate applies to a job
exports.applyToJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const {
      coverLetter,
      phone,
      currentLocation,
      experience,
      expectedSalary,
      noticePeriod,
    } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      removeUploadedFile(req);
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.status !== "open") {
      removeUploadedFile(req);
      return res
        .status(400)
        .json({ message: "This job is no longer accepting applications" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    if (!phone || !/^[+]?[0-9\s-]{10,15}$/.test(phone.trim())) {
      removeUploadedFile(req);
      return res.status(400).json({ message: "Enter a valid phone number" });
    }

    const application = await Application.create({
      job: jobId,
      candidate: req.user.id,
      resumeUrl: `/uploads/resumes/${req.file.filename}`,
      coverLetter: coverLetter ? coverLetter.slice(0, 1000) : undefined,
      phone: phone.trim(),
      currentLocation,
      experience,
      expectedSalary,
      noticePeriod,
    });

    res.status(201).json(application);
  } catch (err) {
    removeUploadedFile(req);
    if (err.code === 11000) {
      return res.status(400).json({ message: "You already applied to this job" });
    }
    console.error("Apply error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// Candidate views their own applications
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate("job", "title location jobType recruiter")
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recruiter views applicants for a specific job
exports.getApplicantsForJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view these applicants" });
    }

    const applications = await Application.find({ job: jobId })
      .populate("candidate", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recruiter updates application status (drives the pipeline)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["applied", "reviewed", "interview", "rejected", "hired"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const application = await Application.findById(req.params.id).populate("job");
    if (!application) return res.status(404).json({ message: "Application not found" });

    if (application.job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this application" });
    }

    application.status = status;
    await application.save();

    res.status(200).json(application);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Recruiter's full pipeline overview (counts grouped by status, across all their jobs)
exports.getRecruiterPipeline = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    const pipeline = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.status(200).json(pipeline);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};