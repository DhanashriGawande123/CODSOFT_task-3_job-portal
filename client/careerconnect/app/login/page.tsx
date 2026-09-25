"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import useAuthStore from "@/store/authStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", form);
      login(res.data.user, res.data.token);

      if (res.data.user.role === "recruiter") {
        router.push("/recruiter/dashboard");
      } else {
        router.push("/jobs");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F3EFE6] grid md:grid-cols-2"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Left brand panel */}
      <div className="hidden md:flex flex-col justify-between bg-[#16243B] text-[#F3EFE6] p-12">
        <Link
          href="/"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
          className="text-xl"
        >
          CareerConnect
        </Link>

        <div className="max-w-sm">
          <p
            className="text-3xl leading-snug"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Every application, every role, tracked in one place.
          </p>
          <p className="text-[#8A97AA] text-sm mt-4">
            Sign in to pick up right where you left off — whether you're
            hunting for your next role or reviewing who applied to yours.
          </p>
        </div>

        <p className="text-xs text-[#5B6B82]">
          Connecting candidates and companies, one role at a time.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="md:hidden mb-8 text-center">
            <Link
              href="/"
              style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
              className="text-xl text-[#16243B]"
            >
              CareerConnect
            </Link>
          </div>

          <h1
            className="text-2xl text-[#16243B] mb-1"
            style={{ fontFamily: "'Fraunces', serif", fontWeight: 500 }}
          >
            Welcome back
          </h1>
          <p className="text-[#5B6B82] text-sm mb-8">
            Sign in to continue to your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-[#FBEAEA] border border-[#E8B4B4] text-[#8B3A3A] text-sm rounded-[4px] px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-[#16243B] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-white border border-[#DCD5C6] rounded-[4px] text-[#16243B] placeholder-[#94A0B2] focus:outline-none focus:ring-2 focus:ring-[#DD9A3B] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm text-[#16243B] mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                className="w-full px-4 py-2.5 bg-white border border-[#DCD5C6] rounded-[4px] text-[#16243B] placeholder-[#94A0B2] focus:outline-none focus:ring-2 focus:ring-[#DD9A3B] focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16243B] hover:bg-[#2C5A4E] disabled:opacity-50 text-[#F3EFE6] font-medium py-2.5 rounded-[4px] transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-[#5B6B82] mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#16243B] font-medium hover:text-[#DD9A3B] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}