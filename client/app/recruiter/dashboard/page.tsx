"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import useAuthStore from "@/store/authStore";

interface Job {
  _id: string;
  title: string;
  location: string;
  jobType: string;
  status: string;
  createdAt: string;
}

interface PipelineItem {
  _id: string;
  count: number;
}

const STAGES = ["applied", "reviewed", "interview", "hired", "rejected"];

const stageColors: Record<string, string> = {
  applied: "#94A0B2",
  reviewed: "#DD9A3B",
  interview: "#B8671E",
  hired: "#2C5A4E",
  rejected: "#B35A5A",
};

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-[#DCD5C6] rounded-[4px] text-[#16243B] placeholder-[#94A0B2] focus:outline-none focus:ring-2 focus:ring-[#DD9A3B] focus:border-transparent transition";

function timeAgo(dateString: string) {
  const days = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  return `Posted ${days} days ago`;
}

export default function RecruiterDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [pipeline, setPipeline] = useState<PipelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const [posting, setPosting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    jobType: "full-time",
    salary: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "recruiter") {
      router.push("/jobs");
      return;
    }
    fetchData();
  }, [isAuthenticated, user, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, pipelineRes] = await Promise.all([
        api.get("/jobs/my-jobs"),
        api.get("/applications/pipeline"),
      ]);
      setJobs(jobsRes.data);
      setPipeline(pipelineRes.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setPosting(true);

    try {
      await api.post("/jobs", {
        ...form,
        requirements: form.requirements
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      });
      setForm({
        title: "",
        description: "",
        requirements: "",
        location: "",
        jobType: "full-time",
        salary: "",
      });
      setShowForm(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.message || "Failed to post job.");
    } finally {
      setPosting(false);
    }
  };

  const countFor = (stage: string) =>
    pipeline.find((p) => p._id === stage)?.count || 0;

  const totalApplicants = pipeline.reduce((sum, p) => sum + p.count, 0);
  const openJobs = jobs.filter((j) => j.status === "open").length;
  const closedJobs = jobs.length - openJobs;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3EFE6]">
        <p className="text-[#5B6B82]">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F3EFE6]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex justify-between items-end mb-8 flex-wrap gap-4">
          <div>
            <h1
              className="text-3xl text-[#16243B]"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Hiring dashboard
            </h1>
            <p className="text-[#5B6B82] mt-1">
              Welcome back, {user?.name?.split(" ")[0]}. Here is where your
              hiring stands.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className={`font-medium px-6 py-2.5 rounded-[4px] transition-colors ${
              showForm
                ? "bg-transparent border border-[#16243B] text-[#16243B] hover:bg-white"
                : "bg-[#DD9A3B] hover:bg-[#c98a2f] text-[#16243B]"
            }`}
          >
            {showForm ? "Cancel" : "Post a new job"}
          </button>
        </div>

        {/* Post job form */}
        {showForm && (
          <div className="bg-white rounded-[6px] border border-[#DCD5C6] p-8 mb-8">
            <h2
              className="text-xl text-[#16243B] mb-5"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Post a new job
            </h2>
            <form onSubmit={handlePostJob} className="space-y-4">
              {formError && (
                <div className="bg-[#FBEAEA] border border-[#E8B4B4] text-[#8B3A3A] text-sm rounded-[4px] px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#16243B] mb-1.5">
                    Job title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Frontend Developer"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#16243B] mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Bangalore"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#16243B] mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the role, responsibilities, and what you are looking for..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm text-[#16243B] mb-1.5">
                  Requirements (separate with commas)
                </label>
                <input
                  type="text"
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder="React, Next.js, Tailwind CSS"
                  className={inputClass}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#16243B] mb-1.5">
                    Job type
                  </label>
                  <select
                    name="jobType"
                    value={form.jobType}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#16243B] mb-1.5">
                    Salary (optional)
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    placeholder="8-12 LPA"
                    className={inputClass}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={posting}
                className="bg-[#16243B] hover:bg-[#2C5A4E] disabled:opacity-50 text-[#F3EFE6] font-medium px-6 py-2.5 rounded-[4px] transition-colors"
              >
                {posting ? "Publishing..." : "Publish job"}
              </button>
            </form>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Open roles", value: openJobs },
            { label: "Closed roles", value: closedJobs },
            { label: "Total applicants", value: totalApplicants },
            { label: "Hired", value: countFor("hired") },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white border border-[#DCD5C6] rounded-[6px] p-5"
            >
              <p className="text-3xl text-[#16243B] font-semibold">
                {stat.value}
              </p>
              <p className="text-sm text-[#5B6B82] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="bg-white border border-[#DCD5C6] rounded-[6px] p-6 mb-8">
          <h2
            className="text-xl text-[#16243B] mb-1"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Candidate pipeline
          </h2>
          <p className="text-sm text-[#5B6B82] mb-5">
            Across all your open and closed roles.
          </p>

          {totalApplicants === 0 ? (
            <p className="text-sm text-[#5B6B82]">
              No applications yet. They will appear here as candidates apply.
            </p>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden bg-[#EDE8DB] mb-5">
                {STAGES.map((stage) => {
                  const count = countFor(stage);
                  if (!count) return null;
                  return (
                    <div
                      key={stage}
                      style={{
                        width: `${(count / totalApplicants) * 100}%`,
                        backgroundColor: stageColors[stage],
                      }}
                      title={`${stage}: ${count}`}
                    />
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {STAGES.map((stage) => (
                  <div key={stage}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: stageColors[stage] }}
                      />
                      <span className="text-xs text-[#5B6B82] capitalize">
                        {stage}
                      </span>
                    </div>
                    <p className="text-2xl text-[#16243B] font-semibold mt-1">
                      {countFor(stage)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Job listings */}
        <div>
          <h2
            className="text-xl text-[#16243B] mb-4"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Your job listings ({jobs.length})
          </h2>

          {jobs.length === 0 ? (
            <div className="bg-white border border-[#DCD5C6] rounded-[6px] p-12 text-center">
              <p className="text-[#16243B] mb-1">You have not posted any jobs yet.</p>
              <p className="text-sm text-[#5B6B82]">
                Use &quot;Post a new job&quot; above to publish your first role.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#DCD5C6] rounded-[6px] divide-y divide-[#EDE8DB]">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/recruiter/jobs/${job._id}`}
                  className="flex items-center justify-between gap-4 p-5 group"
                >
                  <div>
                    <h3 className="text-[#16243B] font-medium group-hover:text-[#2C5A4E] transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-sm text-[#5B6B82] mt-0.5 capitalize">
                      {job.location} · {job.jobType} · {timeAgo(job.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${
                        job.status === "open"
                          ? "bg-[#E9F1EE] text-[#2C5A4E]"
                          : "bg-[#EEF1F5] text-[#5B6B82]"
                      }`}
                    >
                      {job.status}
                    </span>
                    <span className="text-sm text-[#5B6B82] group-hover:text-[#16243B] hidden sm:inline transition-colors">
                      View applicants
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}