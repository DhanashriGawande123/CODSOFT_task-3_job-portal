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
  };
  status: string;
  resumeUrl: string;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  applied: "bg-blue-50 text-blue-700",
  reviewed: "bg-yellow-50 text-yellow-700",
  interview: "bg-purple-50 text-purple-700",
  hired: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading your applications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Applications</h1>
        <p className="text-gray-500 mb-8">Track the status of every job you've applied to</p>

        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
            <Link
              href="/jobs"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
            >
              Browse Jobs
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app._id}
                className="bg-white rounded-xl border border-gray-200 p-6 flex justify-between items-center flex-wrap gap-4"
              >
                <div>
                  <Link
                    href={`/jobs/${app.job._id}`}
                    className="text-lg font-semibold text-gray-900 hover:text-indigo-600"
                  >
                    {app.job?.title || "Job no longer available"}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">
                    {app.job?.location} · {app.job?.jobType}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full capitalize ${
                    statusStyles[app.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}