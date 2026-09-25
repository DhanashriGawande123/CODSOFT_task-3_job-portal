const Job = require("../models/Job");

// Create job (recruiter only)
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, recruiter: req.user.id });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all jobs (public, with search/filter)
exports.getJobs = async (req, res) => {
  try {
    const { keyword, location, jobType } = req.query;

    const query = { status: "open" };
    if (keyword) query.title = { $regex: keyword, $options: "i" };
    if (location) query.location = { $regex: location, $options: "i" };
    if (jobType) query.jobType = jobType;

    const jobs = await Job.find(query)
      .populate("recruiter", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single job
exports.getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("recruiter", "name email");
    if (!job) return res.status(404).json({ message: "Job not found" });
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get jobs posted by logged-in recruiter
exports.getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update job (recruiter only, must own it)
exports.updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to edit this job" });
    }

    Object.assign(job, req.body);
    await job.save();
    res.status(200).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete job (recruiter only, must own it)
exports.deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this job" });
    }

    await job.deleteOne();
    res.status(200).json({ message: "Job deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};