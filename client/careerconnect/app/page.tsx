"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import api from "@/lib/api";





interface Job {
  _id: string;
  title: string;
  location: string;
  jobType: string;
  salary?: string;
  recruiter: { name: string };
  createdAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    api
      .get("/jobs")
      .then((res) => setJobs(res.data))
      .catch(() => setJobs([]))
      .finally(() => setLoaded(true));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (location) params.set("location", location);
    router.push(`/jobs${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const companyCount = new Set(jobs.map((j) => j.recruiter?.name)).size;
  const preview = jobs.slice(0, 4);
  const feed = jobs.slice(0, 5);

  return (
    <div
  className="bg-[#F3EFE6] min-h-screen"
  style={{ fontFamily: "'Inter', sans-serif" }}
>
      {/* Nav */}
      <header className="border-b border-[#DCD5C6]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span
            className="text-lg text-[#16243B]"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 600 }}
          >
            CareerConnect
          </span>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#16243B]">
            <Link href="/jobs" className="hover:text-[#DD9A3B] transition-colors">
              For candidates
            </Link>
            <Link
              href="/register"
              className="hover:text-[#2C5A4E] transition-colors"
            >
              For companies
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-[#16243B] hover:text-[#DD9A3B] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-[#16243B] text-[#F3EFE6] px-4 py-2 rounded-[4px] hover:bg-[#2C5A4E] transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid md:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
        <div>
          <h1
            className="text-[2.75rem] md:text-[3.4rem] leading-[1.08] text-[#16243B]"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}
          >
            Work worth doing starts with the right match.
          </h1>
          <p className="text-[#5B6B82] text-lg mt-5 max-w-md leading-relaxed">
            CareerConnect brings candidates and recruiters onto one platform —
            search roles, track applications, and manage your pipeline in one
            place.
          </p>

          <form
            onSubmit={handleSearch}
            className="mt-8 bg-white rounded-[6px] border border-[#DCD5C6] p-2 flex flex-col sm:flex-row gap-2 max-w-lg"
          >
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Job title, e.g. Frontend Developer"
              className="flex-1 px-3 py-2.5 text-sm text-[#16243B] placeholder-[#94A0B2] focus:outline-none"
            />
            <div className="hidden sm:block w-px bg-[#DCD5C6]" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
              className="sm:w-36 px-3 py-2.5 text-sm text-[#16243B] placeholder-[#94A0B2] focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[#DD9A3B] hover:bg-[#c98a2f] text-[#16243B] text-sm font-medium px-5 py-2.5 rounded-[4px] transition-colors"
            >
              Search roles
            </button>
          </form>

          {loaded && jobs.length > 0 && (
            <p className="text-sm text-[#5B6B82] mt-4">
              {jobs.length} open role{jobs.length !== 1 ? "s" : ""} right now
              {companyCount > 0 &&
                ` across ${companyCount} compan${companyCount !== 1 ? "ies" : "y"}`}
              .
            </p>
          )}
        </div>

        {/* Stacked real-job cards */}
        <div className="relative h-[380px] hidden md:block">
          {preview.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#94A0B2] text-sm border border-dashed border-[#DCD5C6] rounded-[6px]">
              Open roles will appear here
            </div>
          ) : (
            preview.map((job, i) => (
              <div
                key={job._id}
                className="absolute w-72 bg-white border border-[#DCD5C6] rounded-[6px] p-5 shadow-sm animate-[cardIn_0.6s_ease_forwards]"
                style={{
                  top: `${i * 62}px`,
                  right: `${i * 18}px`,
                  transform: `rotate(${i % 2 === 0 ? -2 : 2}deg)`,
                  opacity: 0,
                  animationDelay: `${i * 120}ms`,
                  zIndex: preview.length - i,
                }}
              >
                <p
                  className="text-[#16243B] font-medium"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {job.title}
                </p>
                <p className="text-xs text-[#5B6B82] mt-1">
                  {job.recruiter?.name} · {job.location}
                </p>
                <span className="inline-block mt-3 text-[11px] px-2 py-0.5 rounded-full bg-[#F3EFE6] text-[#2C5A4E] capitalize">
                  {job.jobType}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <style jsx global>{`
        @keyframes cardIn {
          from {
            opacity: 0;
            transform: translateY(14px) rotate(var(--r, 0deg));
          }
          to {
            opacity: 1;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="cardIn"] {
            animation: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>

      {/* Two-sided flow */}
      <section className="bg-[#16243B] py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2
            className="text-2xl text-[#F3EFE6] mb-12"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}
          >
            Built for both sides of hiring
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-[#DD9A3B] text-sm font-medium mb-5">
                For candidates
              </p>
              <ol className="space-y-5">
                {[
                  ["Search and filter", "Find roles by title, location, and type."],
                  ["Apply in one place", "Upload your resume once, apply to any listing."],
                  ["Track every application", "See where you stand — applied, reviewed, interview, or hired."],
                ].map(([title, desc], i) => (
                  <li key={title} className="flex gap-4">
                    <span className="text-[#DD9A3B] text-sm mt-0.5 w-4">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[#F3EFE6] font-medium text-sm">{title}</p>
                      <p className="text-[#8A97AA] text-sm mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <p className="text-[#4E9A85] text-sm font-medium mb-5">
                For recruiters
              </p>
              <ol className="space-y-5">
                {[
                  ["Publish a role", "Post openings with requirements, salary, and type."],
                  ["Review applicants", "See every resume and cover letter in one queue."],
                  ["Move through your pipeline", "Update status as candidates progress toward a hire."],
                ].map(([title, desc], i) => (
                  <li key={title} className="flex gap-4">
                    <span className="text-[#4E9A85] text-sm mt-0.5 w-4">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[#F3EFE6] font-medium text-sm">{title}</p>
                      <p className="text-[#8A97AA] text-sm mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Live roles feed */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-baseline justify-between mb-8">
          <h2
            className="text-2xl text-[#16243B]"
            style={{ fontFamily: "var(--font-fraunces)", fontWeight: 500 }}
          >
            Open roles right now
          </h2>
          <Link
            href="/jobs"
            className="text-sm text-[#2C5A4E] hover:underline"
          >
            Browse all jobs
          </Link>
        </div>

        {!loaded ? (
          <p className="text-[#5B6B82] text-sm">Loading roles...</p>
        ) : feed.length === 0 ? (
          <div className="border border-dashed border-[#DCD5C6] rounded-[6px] p-10 text-center">
            <p className="text-[#5B6B82] text-sm">
              No roles posted yet. Recruiters can{" "}
              <Link href="/register" className="text-[#2C5A4E] underline">
                sign up
              </Link>{" "}
              and publish the first one.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#DCD5C6] border-t border-b border-[#DCD5C6]">
            {feed.map((job) => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}`}
                className="flex items-center justify-between py-5 group"
              >
                <div>
                  <p className="text-[#16243B] font-medium group-hover:text-[#2C5A4E] transition-colors">
                    {job.title}
                  </p>
                  <p className="text-sm text-[#5B6B82] mt-0.5">
                    {job.recruiter?.name} · {job.location}
                  </p>
                </div>
                <span className="text-xs text-[#5B6B82] capitalize border border-[#DCD5C6] rounded-full px-3 py-1">
                  {job.jobType}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DCD5C6] py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span
            className="text-[#16243B]"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            CareerConnect
          </span>
          <p className="text-sm text-[#8A97AA]">
            Connecting candidates and companies, one role at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}