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

const statusColors: Record<string, string> = {
  applied: "bg-blue-500",
  reviewed: "bg-yellow-500",
  interview: "bg-purple-500",
  hired: "bg-green-500",
  rejected: "bg-red-500",
};

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

  const totalApplicants = pipeline.reduce((sum, p) => sum + p.count, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header + Post Job button */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Manage your job listings and candidates</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
          >
            {showForm ? "Cancel" : "+ Post New Job"}
          </button>
        </div>

        {/* Post Job Form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8">
            <h2 className="font-semibold text-gray-900 mb-4">Post a New Job</h2>
            <form onSubmit={handlePostJob} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={form.title}
                    onChange={handleChange}
                    placeholder="Frontend Developer"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    required
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Bangalore"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Requirements (comma-separated)
                </label>
                <input
                  type="text"
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder="React, Next.js, Tailwind CSS"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Job Type
                  </label>
                  <select
                    name="jobType"
                    value={form.jobType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract</option>
                    <option value="remote">Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Salary (optional)
                  </label>
                  <input
                    type="text"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    placeholder="8-12 LPA"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={posting}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium px-6 py-2.5 rounded-lg transition"
              >
                {posting ? "Posting..." : "Post Job"}
              </button>
            </form>
          </div>
        )}

        {/* Pipeline overview */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">
            Candidate Pipeline ({totalApplicants} total applicants)
          </h2>
          {pipeline.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {["applied", "reviewed", "interview", "hired", "rejected"].map((status) => {
                const item = pipeline.find((p) => p._id === status);
                return (
                  <div key={status} className="text-center p-4 rounded-lg bg-gray-50">
                    <div
                      className={`w-2 h-2 rounded-full mx-auto mb-2 ${statusColors[status]}`}
                    ></div>
                    <p className="text-2xl font-bold text-gray-900">{item?.count || 0}</p>
                    <p className="text-xs text-gray-500 capitalize mt-1">{status}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Job listings */}
        <div>
          <h2 className="font-semibold text-gray-900 mb-4">Your Job Listings ({jobs.length})</h2>
          {jobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <p className="text-gray-500">You haven't posted any jobs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link
                  key={job._id}
                  href={`/recruiter/jobs/${job._id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition"
                >
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {job.location} · {job.jobType}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                        job.status === "open"
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {job.status}
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