"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

interface Job {
  _id: string;
  title: string;
  description: string;
  location: string;
  jobType: string;
  salary?: string;
  recruiter: { name: string; email: string };
  createdAt: string;
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (keyword) params.keyword = keyword;
      if (location) params.location = location;
      if (jobType) params.jobType = jobType;

      const res = await api.get("/jobs", { params });
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero + Search */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-2">Find your next opportunity</h2>
          <p className="text-indigo-100 mb-8">
            Browse open roles from companies actively hiring right now
          </p>

          <form
            onSubmit={handleSearch}
            className="bg-white rounded-xl shadow-lg p-3 flex flex-col md:flex-row gap-2"
          >
            <input
              type="text"
              placeholder="Job title or keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="px-4 py-2.5 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2.5 rounded-lg transition"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Job listings */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <p className="text-center text-gray-500">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No jobs found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">{jobs.length} jobs found</p>
            {jobs.map((job) => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="block bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md hover:border-indigo-200 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {job.recruiter?.name} · {job.location}
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full capitalize">
                    {job.jobType}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mt-3 line-clamp-2">{job.description}</p>
                {job.salary && (
                  <p className="text-sm font-medium text-gray-700 mt-3">💰 {job.salary}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}