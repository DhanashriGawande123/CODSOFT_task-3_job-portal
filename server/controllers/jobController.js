const Job = require("../models/Job");

// Escape user input before using it in a regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Create job (recruiter only)
exports.createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, recruiter: req.user.id });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all open jobs (public) with search, filters, sorting, pagination
// Returns a plain array unless ?page= is provided
exports.getJobs = async (req, res) => {
  try {
    const {
      keyword,
      location,
      jobType,
      category,
      experience,
      salaryMin,
      sort,
      page,
      limit,
    } = req.query;

    const query = { status: "open" };
    const and = [];

    if (keyword) {
      const rx = new RegExp(escapeRegex(keyword), "i");
      and.push({
        $or: [{ title: rx }, { company: rx }, { requirements: rx }],
      });
    }

    if (location) {
      query.location = { $regex: escapeRegex(location), $options: "i" };
    }

    if (jobType) {
      const types = jobType.split(",").filter(Boolean);
      query.jobType = types.length > 1 ? { $in: types } : types[0];
    }

    if (category) {
      query.category = { $regex: escapeRegex(category), $options: "i" };
    }

    // Candidate's years of experience: show jobs whose range includes it
    if (experience !== undefined && experience !== "") {
      const years = Number(experience);
      if (!Number.isNaN(years)) {
        and.push({ experienceMin: { $lte: years } });
        and.push({
          $or: [
            { experienceMax: { $gte: years } },
            { experienceMax: 0 },
            { experienceMax: { $exists: false } },
          ],
        });
      }
    }

    // Minimum salary in LPA
    if (salaryMin) {
      const min = Number(salaryMin);
      if (!Number.isNaN(min)) {
        and.push({ salaryMax: { $gte: min } });
      }
    }

    if (and.length) query.$and = and;

    const sortOptions =
      sort === "salary" ? { salaryMax: -1, createdAt: -1 } : { createdAt: -1 };

    // Backwards compatible: no page param means return a plain array
    if (!page) {
      const jobs = await Job.find(query)
        .populate("recruiter", "name email")
        .sort(sortOptions);
      return res.status(200).json(jobs);
    }

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate("recruiter", "name email")
        .sort(sortOptions)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Job.countDocuments(query),
    ]);

    res.status(200).json({
      jobs,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
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