"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

const HIDDEN_ON = ["/", "/login", "/register"];

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  // These pages render their own header/branding
  if (HIDDEN_ON.includes(pathname)) return null;

  const linkClass = (active: boolean) =>
    `transition-colors ${
      active
        ? "text-[#16243B] font-medium"
        : "text-[#5B6B82] hover:text-[#16243B]"
    }`;

  return (
    <header className="bg-[#F3EFE6] border-b border-[#DCD5C6] sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg text-[#16243B]"
          style={{ fontFamily: "'Fraunces', serif", fontWeight: 600 }}
        >
          CareerConnect
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/jobs" className={linkClass(pathname === "/jobs")}>
            Browse Jobs
          </Link>

          <Link
            href="/career-assistant"
            className={linkClass(pathname === "/career-assistant")}
          >
            AI Assistant
          </Link>

          {isAuthenticated && user?.role === "candidate" && (
            <Link
              href="/my-applications"
              className={linkClass(pathname === "/my-applications")}
            >
              My Applications
            </Link>
          )}

          {isAuthenticated && user?.role === "recruiter" && (
            <Link
              href="/recruiter/dashboard"
              className={linkClass(pathname.startsWith("/recruiter"))}
            >
              Dashboard
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4 pl-4 border-l border-[#DCD5C6]">
              <span className="text-[#5B6B82] hidden sm:inline">
                Hi, {user?.name?.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="bg-[#16243B] hover:bg-[#2C5A4E] text-[#F3EFE6] px-4 py-2 rounded-[4px] transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-4 border-l border-[#DCD5C6]">
              <Link
                href="/login"
                className="text-[#5B6B82] hover:text-[#16243B] transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-[#16243B] hover:bg-[#2C5A4E] text-[#F3EFE6] px-4 py-2 rounded-[4px] transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}