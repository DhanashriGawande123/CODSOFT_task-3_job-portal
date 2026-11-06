"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import useAuthStore from "@/store/authStore";

interface Application {
  _id: string;
  job: {
    _id: string;
    title: string;
    location: string;
    jobType: string;
  } | null;
  status: string;
  resumeUrl: string;
  createdAt: string;
}

const STAGES = ["applied", "reviewed", "interview", "hired"];

const statusStyles: Record<string, string> = {
  applied: "bg-[#EEF1F5] text-[#5B6B82]",
  reviewed: "bg-[#FCF3E4] text-[#9A6410]",
  interview: "bg-[#FBE9D0] text-[#8A4B0F]",
  hired: "bg-[#E9F1EE] text-[#2C5A4E]",
  rejected: "bg-[#FBEAEA] text-[#8B3A3A]",
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (user?.role !== "candidate") {
      router.push("/jobs");
      return;
    }

    const fetchApplications = async () => {
      try {
        const res = await api.get("/applications/my-applications");
        setApplications(res.data);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [isAuthenticated, user, router]);

  const countFor = (status: string) =>
    applications.filter((a) => a.status === status).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3EFE6]">
        <p className="text-[#5B6B82]">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F3EFE6]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1
          className="text-3xl text-[#16243B]"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
        >
          My applications
        </h1>
        <p className="text-[#5B6B82] mt-1 mb-8">
          Track where you stand on every role you&apos;ve applied for.
        </p>

        {applications.length === 0 ? (
          <div className="bg-white rounded-[6px] border border-[#DCD5C6] p-12 text-center">
            <p
              className="text-xl text-[#16243B] mb-2"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
            >
              No applications yet
            </p>
            <p className="text-[#5B6B82] text-sm mb-6">
              Find a role that fits and apply. It will show up here.
            </p>
            <Link
              href="/jobs"
              className="inline-block bg-[#DD9A3B] hover:bg-[#c98a2f] text-[#16243B] font-medium px-6 py-2.5 rounded-[4px] transition-colors"
            >
              Browse jobs
            </Link>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
              <div className="bg-white border border-[#DCD5C6] rounded-[6px] p-4">
                <p className="text-2xl text-[#16243B] font-semibold">
                  {applications.length}
                </p>
                <p className="text-xs text-[#5B6B82] mt-1">Total</p>
              </div>
              {["applied", "reviewed", "interview", "hired"].map((s) => (
                <div
                  key={s}
                  className="bg-white border border-[#DCD5C6] rounded-[6px] p-4"
                >
                  <p className="text-2xl text-[#16243B] font-semibold">
                    {countFor(s)}
                  </p>
                  <p className="text-xs text-[#5B6B82] mt-1 capitalize">{s}</p>
                </div>
              ))}
            </div>

            {/* List */}
            <div className="space-y-4">
              {applications.map((app) => {
                const stageIndex = STAGES.indexOf(app.status);
                const rejected = app.status === "rejected";

                return (
                  <div
                    key={app._id}
                    className="bg-white rounded-[6px] border border-[#DCD5C6] p-6"
                  >
                    <div className="flex justify-between items-start gap-4 flex-wrap">
                      <div>
                        {app.job ? (
                          <Link
                            href={`/jobs/${app.job._id}`}
                            className="text-lg text-[#16243B] hover:text-[#2C5A4E] transition-colors"
                            style={{
                              fontFamily: "'Fraunces', serif",
                              fontWeight: 500,
                            }}
                          >
                            {app.job.title}
                          </Link>
                        ) : (
                          <p className="text-lg text-[#5B6B82]">
                            Job no longer available
                          </p>
                        )}
                        {app.job && (
                          <p className="text-sm text-[#5B6B82] mt-1">
                            {app.job.location} · {app.job.jobType}
                          </p>
                        )}
                        <p className="text-xs text-[#94A0B2] mt-1">
                          Applied on{" "}
                          {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${
                          statusStyles[app.status] || "bg-[#EEF1F5] text-[#5B6B82]"
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>

                    {/* Progress tracker */}
                    <div className="mt-5 pt-5 border-t border-[#EDE8DB]">
                      {rejected ? (
                        <p className="text-sm text-[#8B3A3A]">
                          This application was not taken forward.
                        </p>
                      ) : (
                        <div className="flex items-center">
                          {STAGES.map((stage, i) => {
                            const reached = i <= stageIndex;
                            return (
                              <div
                                key={stage}
                                className="flex items-center flex-1 last:flex-none"
                              >
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      reached ? "bg-[#2C5A4E]" : "bg-[#DCD5C6]"
                                    }`}
                                  />
                                  <span
                                    className={`text-[11px] mt-1.5 capitalize ${
                                      reached
                                        ? "text-[#16243B] font-medium"
                                        : "text-[#94A0B2]"
                                    }`}
                                  >
                                    {stage}
                                  </span>
                                </div>
                                {i < STAGES.length - 1 && (
                                  <div
                                    className={`flex-1 h-0.5 mx-2 mb-5 ${
                                      i < stageIndex
                                        ? "bg-[#2C5A4E]"
                                        : "bg-[#DCD5C6]"
                                    }`}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}