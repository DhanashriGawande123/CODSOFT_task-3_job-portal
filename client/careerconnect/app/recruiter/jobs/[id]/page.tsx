"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import useAuthStore from "@/store/authStore";

interface Applicant {
  _id: string;
  candidate: { _id: string; name: string; email: string };
  resumeUrl: string;
  coverLetter?: string;
  status: string;
  createdAt: string;
}

interface Job {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  jobType: string;
  salary?: string;
  status: string;
}

const STATUS_OPTIONS = ["applied", "reviewed", "interview", "rejected", "hired"];

const statusStyles: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700 border-blue-200",
  reviewed: "bg-yellow-50 text-yellow-700 border-yellow-200",
  interview: "bg-purple-50 text-purple-700 border-purple-200",
  hired: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api$/, "");

export default function ApplicantsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const [showEditForm, setShowEditForm] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    requirements: "",
    location: "",
    jobType: "full-time",
    salary: "",
  });
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

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
  }, [isAuthenticated, user, router, id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobRes, applicantsRes] = await Promise.all([
        api.get(`/jobs/${id}`),
        api.get(`/applications/job/${id}`),
      ]);
      setJob(jobRes.data);
      setApplicants(applicantsRes.data);
      setEditForm({
        title: jobRes.data.title || "",
        description: jobRes.data.description || "",
        requirements: (jobRes.data.requirements || []).join(", "),
        location: jobRes.data.location || "",
        jobType: jobRes.data.jobType || "full-time",
        salary: jobRes.data.salary || "",
      });
    } catch (err) {
      console.error("Failed to fetch applicants:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    setUpdatingId(applicationId);
    try {
      await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      setApplicants((prev) =>
        prev.map((a) => (a._id === applicationId ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const openResume = (resumeUrl: string) => {
    const fullUrl = API_ORIGIN + resumeUrl;
    window.open(fullUrl, "_blank", "noopener,noreferrer");
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    setSavingEdit(true);

    try {
      const res = await api.put(`/jobs/${id}`, {
        ...editForm,
        requirements: editForm.requirements
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean),
      });
      setJob(res.data);
      setShowEditForm(false);
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Failed to update job.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!job) return;
    const newStatus = job.status === "open" ? "closed" : "open";
    setTogglingStatus(true);
    try {
      const res = await api.put(`/jobs/${id}`, { status: newStatus });
      setJob(res.data);
    } catch (err) {
      console.error("Failed to toggle job status:", err);
    } finally {
      setTogglingStatus(false);
    }
  };

  const filtered =
    filter === "all" ? applicants : applicants.filter((a) => a.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading applicants...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Link
          href="/recruiter/dashboard"
          className="text-indigo-600 text-sm font-medium hover:underline"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{job?.title}</h1>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  job?.status === "open"
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {job?.status}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              {job?.location} - {job?.jobType} - {applicants.length} applicant
              {applicants.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowEditForm(!showEditForm)}
              className="text-sm bg-white border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg transition"
            >
              {showEditForm ? "Cancel" : "Edit Job"}
            </button>
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className={`text-sm px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                job?.status === "open"
                  ? "bg-red-50 text-red-700 hover:bg-red-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
            >
              {togglingStatus
                ? "Updating..."
                : job?.status === "open"
                ? "Close Job"
                : "Reopen Job"}
            </button>
          </div>
        </div>

        {/* Edit form */}
        {showEditForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mt-6">
            <h2 className="font-semibold text-gray-900 mb-4">Edit Job Details</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {editError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {editError}
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
                    value={editForm.title}
                    onChange={handleEditChange}
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
                    value={editForm.location}
                    onChange={handleEditChange}
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
                  value={editForm.description}
                  onChange={handleEditChange}
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
                  value={editForm.requirements}
                  onChange={handleEditChange}
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
                    value={editForm.jobType}
                    onChange={handleEditChange}
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
                    value={editForm.salary}
                    onChange={handleEditChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingEdit}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium px-6 py-2.5 rounded-lg transition"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 mt-8 flex-wrap">
          {["all", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-sm px-4 py-1.5 rounded-full capitalize border transition ${
                filter === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
              }`}
            >
              {s === "all" ? "All" : s}
              {s !== "all" && (
                <span className="ml-1 opacity-70">
                  ({applicants.filter((a) => a.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center mt-6">
            <p className="text-gray-500">
              {applicants.length === 0
                ? "No one has applied to this job yet."
                : "No applicants match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-6">
            {filtered.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {app.candidate?.name}
                    </h3>
                    <p className="text-sm text-gray-500">{app.candidate?.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize border ${statusStyles[app.status]}`}
                  >
                    {app.status}
                  </span>
                </div>

                {app.coverLetter && (
                  <p className="text-sm text-gray-600 mt-4 bg-gray-50 rounded-lg p-3">
                    {app.coverLetter}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openResume(app.resumeUrl)}
                    className="text-sm text-indigo-600 font-medium hover:underline"
                  >
                    View Resume
                  </button>

                  <select
                    value={app.status}
                    disabled={updatingId === app._id}
                    onChange={(e) => handleStatusChange(app._id, e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}