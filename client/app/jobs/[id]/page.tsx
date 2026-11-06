"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import useAuthStore from "@/store/authStore";

interface Job {
  _id: string;
  title: string;
  company?: string;
  description: string;
  requirements: string[];
  location: string;
  jobType: string;
  category?: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  salary?: string;
  openings?: number;
  status: string;
  recruiter: { name: string; email: string };
  createdAt: string;
}

const EXPERIENCE_OPTIONS = [
  "Fresher",
  "Less than 1 year",
  "1-2 years",
  "2-3 years",
  "3-5 years",
  "5-8 years",
  "8+ years",
];

const NOTICE_OPTIONS = [
  "Immediately available",
  "15 days",
  "1 month",
  "2 months",
  "3 months",
];

const MAX_FILE_MB = 5;
const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

const inputClass =
  "w-full px-4 py-2.5 bg-white border border-[#DCD5C6] rounded-[4px] text-sm text-[#16243B] placeholder-[#94A0B2] focus:outline-none focus:ring-2 focus:ring-[#DD9A3B] focus:border-transparent transition";

function formatExperience(job: Job) {
  const min = job.experienceMin || 0;
  const max = job.experienceMax || 0;
  if (max > 0) return `${min}-${max} years`;
  if (min > 0) return `${min}+ years`;
  return "Freshers welcome";
}

function formatSalary(job: Job) {
  if (job.salaryMin || job.salaryMax) {
    if (job.salaryMin && job.salaryMax) return `${job.salaryMin}-${job.salaryMax} LPA`;
    return `${job.salaryMax || job.salaryMin} LPA`;
  }
  return job.salary || "Not disclosed";
}

function timeAgo(dateString: string) {
  const days = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function JobDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id)
    ? params.id[0]
    : (params?.id as string | undefined);

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [resume, setResume] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    phone: "",
    currentLocation: "",
    experience: "Fresher",
    expectedSalary: "",
    noticePeriod: "Immediately available",
    coverLetter: "",
  });

  // Load the job
  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const fetchJob = async () => {
      try {
        const res = await api.get(`/jobs/${id}`, { timeout: 10000 });
        if (!cancelled) setJob(res.data);
      } catch (err: any) {
        console.error("Failed to fetch job:", err);
        if (!cancelled) {
          setLoadError(
            err.code === "ECONNABORTED"
              ? "The server took too long to respond."
              : err.response?.data?.message || err.message
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchJob();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Check whether this candidate already applied
  useEffect(() => {
    if (!isAuthenticated || user?.role !== "candidate" || !id) return;

    const checkApplied = async () => {
      try {
        const res = await api.get("/applications/my-applications");
        const applied = res.data.some(
          (a: { job: { _id: string } | null }) => a.job?._id === id
        );
        setAlreadyApplied(applied);
      } catch (err) {
        console.error("Failed to check applications:", err);
      }
    };
    checkApplied();
  }, [isAuthenticated, user, id]);

  const closeForm = () => {
    if (submitting) return;
    setShowForm(false);
    setSubmitted(false);
    setFormError("");
  };

  // Escape closes the form, and the page behind it stops scrolling
  useEffect(() => {
    if (!showForm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForm();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [showForm, submitting]);

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setShowForm(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setResume(null);
      setFileError("Upload a PDF, DOC or DOCX file.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setResume(null);
      setFileError(`File is too large. The limit is ${MAX_FILE_MB} MB.`);
      return;
    }
    setFileError("");
    setResume(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!resume) {
      setFileError("Attach your resume to continue.");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("resume", resume);
      Object.entries(form).forEach(([key, value]) => data.append(key, value));

      await api.post(`/applications/apply/${id}`, data);

      setSubmitted(true);
      setAlreadyApplied(true);
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || "Could not submit your application. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3EFE6]">
        <p className="text-[#5B6B82]">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3EFE6] gap-3">
        <p className="text-[#16243B]">This job could not be found.</p>
        {loadError && <p className="text-sm text-[#8B3A3A]">{loadError}</p>}
        <Link href="/jobs" className="text-[#2C5A4E] underline text-sm">
          Back to all jobs
        </Link>
      </div>
    );
  }

  const isClosed = job.status !== "open";
  const isRecruiter = isAuthenticated && user?.role === "recruiter";
  const companyName = job.company || job.recruiter?.name;

  // The apply button / status shown in the header
  const renderApplyControl = () => {
    if (isClosed) {
      return (
        <span className="inline-block text-sm bg-[#EEF1F5] text-[#5B6B82] px-5 py-2.5 rounded-[4px]">
          This job is closed
        </span>
      );
    }
    if (isRecruiter) {
      return (
        <span className="inline-block text-sm bg-[#EEF1F5] text-[#5B6B82] px-5 py-2.5 rounded-[4px]">
          Recruiter accounts cannot apply
        </span>
      );
    }
    if (alreadyApplied) {
      return (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-block text-sm bg-[#E9F1EE] text-[#2C5A4E] font-medium px-5 py-2.5 rounded-[4px]">
            Applied
          </span>
          <Link
            href="/my-applications"
            className="text-sm text-[#2C5A4E] underline"
          >
            Track application
          </Link>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={handleApplyClick}
        className="bg-[#DD9A3B] hover:bg-[#c98a2f] text-[#16243B] font-medium px-8 py-3 rounded-[4px] transition-colors"
      >
        {isAuthenticated ? "Apply now" : "Log in to apply"}
      </button>
    );
  };

  return (
    <div
      className="min-h-screen bg-[#F3EFE6]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Link
          href="/jobs"
          className="text-sm text-[#5B6B82] hover:text-[#16243B] transition-colors"
        >
          Back to all jobs
        </Link>

        {/* Header card */}
        <div className="bg-white border border-[#DCD5C6] rounded-[6px] p-6 md:p-8 mt-4">
          <div className="flex justify-between items-start gap-6 flex-wrap">
            <div>
              <h1
                className="text-2xl md:text-3xl text-[#16243B]"
                style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
              >
                {job.title}
              </h1>
              <p className="text-[#5B6B82] mt-1">{companyName}</p>

              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-xs bg-[#F3EFE6] text-[#16243B] px-3 py-1.5 rounded-full">
                  {job.location}
                </span>
                <span className="text-xs bg-[#F3EFE6] text-[#16243B] px-3 py-1.5 rounded-full">
                  {formatExperience(job)}
                </span>
                <span className="text-xs bg-[#F3EFE6] text-[#16243B] px-3 py-1.5 rounded-full">
                  {formatSalary(job)}
                </span>
                <span className="text-xs bg-[#E9F1EE] text-[#2C5A4E] px-3 py-1.5 rounded-full capitalize">
                  {job.jobType}
                </span>
              </div>
            </div>

            <div>{renderApplyControl()}</div>
          </div>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-[2fr_1fr] gap-6 mt-6">
          <div className="bg-white border border-[#DCD5C6] rounded-[6px] p-6 md:p-8">
            <h2
              className="text-xl text-[#16243B] mb-3"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Job description
            </h2>
            <p className="text-[#5B6B82] text-sm leading-relaxed whitespace-pre-line">
              {job.description}
            </p>

            {job.requirements?.length > 0 && (
              <>
                <h2
                  className="text-xl text-[#16243B] mt-8 mb-3"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
                >
                  Skills required
                </h2>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.map((req, i) => (
                    <span
                      key={i}
                      className="text-sm bg-[#F3EFE6] border border-[#DCD5C6] text-[#16243B] px-3 py-1 rounded-full"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <aside className="bg-white border border-[#DCD5C6] rounded-[6px] p-6 h-fit">
            <h2
              className="text-lg text-[#16243B] mb-4"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              Job overview
            </h2>
            <dl className="space-y-4 text-sm">
              {[
                ["Posted", timeAgo(job.createdAt)],
                ["Experience", formatExperience(job)],
                ["Salary", formatSalary(job)],
                ["Job type", job.jobType],
                ...(job.category ? [["Category", job.category]] : []),
                ...(job.openings ? [["Openings", String(job.openings)]] : []),
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[#94A0B2]">{label}</dt>
                  <dd className="text-[#16243B] capitalize mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>

      {/* Application form pop-up */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-[#16243B]/60 overflow-y-auto p-4"
          onClick={closeForm}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-title"
            className="bg-[#F3EFE6] w-full max-w-xl mx-auto my-8 rounded-[6px]"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-[#2C5A4E] text-white flex items-center justify-center mx-auto mb-5 text-2xl">
                  ✓
                </div>
                <h2
                  className="text-2xl text-[#16243B]"
                  style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
                >
                  Application submitted
                </h2>
                <p className="text-[#5B6B82] text-sm mt-2">
                  Your application for {job.title} has been sent to{" "}
                  {companyName}. You can follow its progress anytime.
                </p>
                <div className="flex gap-3 justify-center mt-8 flex-wrap">
                  <Link
                    href="/my-applications"
                    className="bg-[#DD9A3B] hover:bg-[#c98a2f] text-[#16243B] font-medium px-6 py-2.5 rounded-[4px] transition-colors"
                  >
                    Track my applications
                  </Link>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="border border-[#16243B] text-[#16243B] px-6 py-2.5 rounded-[4px] hover:bg-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="flex justify-between items-start gap-4 p-6 border-b border-[#DCD5C6]">
                  <div>
                    <h2
                      id="apply-title"
                      className="text-xl text-[#16243B]"
                      style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
                    >
                      Apply for {job.title}
                    </h2>
                    <p className="text-sm text-[#5B6B82] mt-0.5">{companyName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    aria-label="Close application form"
                    className="text-[#5B6B82] hover:text-[#16243B] text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {formError && (
                    <div className="bg-[#FBEAEA] border border-[#E8B4B4] text-[#8B3A3A] text-sm rounded-[4px] px-4 py-3">
                      {formError}
                    </div>
                  )}

                  {/* From account */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-[#16243B] mb-1.5">
                        Full name
                      </label>
                      <input
                        type="text"
                        value={user?.name || ""}
                        readOnly
                        className={`${inputClass} bg-[#EDE8DB] cursor-not-allowed`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[#16243B] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ""}
                        readOnly
                        className={`${inputClass} bg-[#EDE8DB] cursor-not-allowed`}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm text-[#16243B] mb-1.5"
                      >
                        Phone number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        pattern="[+]?[0-9\s\-]{10,15}"
                        title="Enter a valid phone number, 10 to 15 digits"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="currentLocation"
                        className="block text-sm text-[#16243B] mb-1.5"
                      >
                        Current location
                      </label>
                      <input
                        id="currentLocation"
                        type="text"
                        name="currentLocation"
                        value={form.currentLocation}
                        onChange={handleChange}
                        placeholder="Nanded"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="experience"
                        className="block text-sm text-[#16243B] mb-1.5"
                      >
                        Total experience
                      </label>
                      <select
                        id="experience"
                        name="experience"
                        value={form.experience}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        {EXPERIENCE_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="noticePeriod"
                        className="block text-sm text-[#16243B] mb-1.5"
                      >
                        Notice period
                      </label>
                      <select
                        id="noticePeriod"
                        name="noticePeriod"
                        value={form.noticePeriod}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        {NOTICE_OPTIONS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="expectedSalary"
                      className="block text-sm text-[#16243B] mb-1.5"
                    >
                      Expected salary (LPA, optional)
                    </label>
                    <input
                      id="expectedSalary"
                      type="text"
                      name="expectedSalary"
                      value={form.expectedSalary}
                      onChange={handleChange}
                      placeholder="6"
                      className={inputClass}
                    />
                  </div>

                  {/* Resume upload */}
                  <div>
                    <label className="block text-sm text-[#16243B] mb-1.5">
                      Resume
                    </label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`cursor-pointer border-2 border-dashed rounded-[6px] px-4 py-6 text-center transition-colors ${
                        dragging
                          ? "border-[#DD9A3B] bg-[#FCF3E4]"
                          : "border-[#DCD5C6] bg-white hover:border-[#DD9A3B]"
                      }`}
                    >
                      {resume ? (
                        <div className="flex items-center justify-between gap-3 text-left">
                          <div>
                            <p className="text-sm text-[#16243B] break-all">
                              {resume.name}
                            </p>
                            <p className="text-xs text-[#5B6B82] mt-0.5">
                              {formatSize(resume.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResume(null);
                              if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                            className="text-sm text-[#8B3A3A] hover:underline shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-[#16243B]">
                            Drag your resume here, or{" "}
                            <span className="text-[#2C5A4E] underline">browse</span>
                          </p>
                          <p className="text-xs text-[#94A0B2] mt-1">
                            PDF, DOC or DOCX, up to {MAX_FILE_MB} MB
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) validateAndSetFile(file);
                      }}
                    />
                    {fileError && (
                      <p className="text-sm text-[#8B3A3A] mt-2">{fileError}</p>
                    )}
                  </div>

                  {/* Cover letter */}
                  <div>
                    <label
                      htmlFor="coverLetter"
                      className="block text-sm text-[#16243B] mb-1.5"
                    >
                      Cover letter (optional)
                    </label>
                    <textarea
                      id="coverLetter"
                      name="coverLetter"
                      rows={4}
                      maxLength={1000}
                      value={form.coverLetter}
                      onChange={handleChange}
                      placeholder="Tell the recruiter why you are a good fit for this role..."
                      className={inputClass}
                    />
                    <p className="text-xs text-[#94A0B2] mt-1 text-right">
                      {form.coverLetter.length}/1000
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-[#DCD5C6]">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={submitting}
                    className="text-[#5B6B82] hover:text-[#16243B] px-5 py-2.5 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-[#DD9A3B] hover:bg-[#c98a2f] disabled:opacity-60 text-[#16243B] font-medium px-8 py-2.5 rounded-[4px] transition-colors"
                  >
                    {submitting ? "Submitting..." : "Submit application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}