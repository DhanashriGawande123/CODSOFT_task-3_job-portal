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
    <div
      className="min-h-screen bg-[#F3EFE6]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Hero + Search */}
      <div className="bg-[#DD9A3B] py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-3xl md:text-4xl text-[#16243B] mb-2"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Find your next opportunity
          </h1>
          <p className="text-[#3D2E10] mb-8">
            Browse open roles from companies actively hiring right now.
          </p>

          <form
            onSubmit={handleSearch}
            className="bg-white rounded-[6px] p-2 flex flex-col md:flex-row gap-2"
          >
            <input
              type="text"
              placeholder="Job title or keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1 px-4 py-2.5 text-[#16243B] placeholder-[#94A0B2] focus:outline-none"
            />
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="flex-1 px-4 py-2.5 text-[#16243B] placeholder-[#94A0B2] focus:outline-none"
            />
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="px-4 py-2.5 text-[#16243B] bg-white focus:outline-none"
            >
              <option value="">All types</option>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
              <option value="remote">Remote</option>
            </select>
            <button
              type="submit"
              className="bg-[#2C5A4E] hover:bg-[#244A40] text-white font-medium px-6 py-2.5 rounded-[4px] transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Job listings */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <p className="text-center text-[#5B6B82]">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#5B6B82] text-lg">
              No jobs match your search. Try a different keyword or location.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#5B6B82]">
              {jobs.length} job{jobs.length !== 1 ? "s" : ""} found
            </p>
            {jobs.map((job) => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="block bg-white rounded-[6px] border border-[#DCD5C6] p-6 hover:border-[#2C5A4E] transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3
                      className="text-lg text-[#16243B]"
                      style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
                    >
                      {job.title}
                    </h3>
                    <p className="text-sm text-[#5B6B82] mt-1">
                      {job.recruiter?.name} · {job.location}
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-[#E9F1EE] text-[#2C5A4E] px-3 py-1 rounded-full capitalize whitespace-nowrap">
                    {job.jobType}
                  </span>
                </div>
                <p className="text-[#5B6B82] text-sm mt-3 line-clamp-2">
                  {job.description}
                </p>
                {job.salary && (
                  <p className="text-sm font-medium text-[#16243B] mt-3">
                    {job.salary}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}