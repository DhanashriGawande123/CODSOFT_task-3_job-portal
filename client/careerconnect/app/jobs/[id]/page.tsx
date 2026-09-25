"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import useAuthStore from "@/store/authStore";

interface Job {
  _id: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  jobType: string;
  salary?: string;
  recruiter: { name: string; email: string };
  createdAt: string;
}

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error("Failed to fetch job:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchJob();
  }, [id]);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "candidate") {
      setApplyError("Only candidates can apply to jobs.");
      return;
    }
    setShowApplyForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResume(e.target.files[0]);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError("");

    if (!resume) {
      setApplyError("Please attach your resume (PDF).");
      return;
    }

    setApplying(true);
    try {
      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("coverLetter", coverLetter);

      await api.post(`/applications/apply/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setApplySuccess(true);
      setShowApplyForm(false);
    } catch (err: any) {
      setApplyError(err.response?.data?.message || "Failed to submit application.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <p className="text-gray-500 mt-1">
                {job.recruiter?.name} · {job.location}
              </p>
            </div>
            <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full capitalize">
              {job.jobType}
            </span>
          </div>

          {job.salary && (
            <p className="text-gray-700 font-medium mt-4">💰 {job.salary}</p>
          )}

          <div className="mt-6">
            <h2 className="font-semibold text-gray-900 mb-2">Job Description</h2>
            <p className="text-gray-600 whitespace-pre-line">{job.description}</p>
          </div>

          {job.requirements?.length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold text-gray-900 mb-2">Requirements</h2>
              <div className="flex flex-wrap gap-2">
                {job.requirements.map((req, i) => (
                  <span
                    key={i}
                    className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full"
                  >
                    {req}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100">
            {applySuccess ? (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
                ✅ Application submitted successfully! You can track it in{" "}
                <Link href="/my-applications" className="font-medium underline">
                  My Applications
                </Link>
                .
              </div>
            ) : !showApplyForm ? (
              <>
                {applyError && (
                  <p className="text-red-600 text-sm mb-3">{applyError}</p>
                )}
                <button
                  onClick={handleApplyClick}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
                >
                  Apply Now
                </button>
              </>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4 max-w-md">
                <h3 className="font-semibold text-gray-900">Submit your application</h3>

                {applyError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {applyError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Resume (PDF)
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                    className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cover Letter (optional)
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={4}
                    placeholder="Tell the recruiter why you're a great fit..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={applying}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium px-6 py-2.5 rounded-lg transition"
                  >
                    {applying ? "Submitting..." : "Submit Application"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="text-gray-600 hover:text-gray-800 px-6 py-2.5 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}