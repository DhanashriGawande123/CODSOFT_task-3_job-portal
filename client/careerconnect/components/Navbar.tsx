"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useAuthStore from "@/store/authStore";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  // Homepage renders its own custom nav — skip the shared one there
  if (pathname === "/") return null;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-semibold text-indigo-600">
          CareerConnect
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/jobs"
            className={`transition-colors ${
              pathname === "/jobs"
                ? "text-indigo-600 font-medium"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            Browse Jobs
          </Link>

          {isAuthenticated && user?.role === "candidate" && (
            <Link
              href="/my-applications"
              className={`transition-colors ${
                pathname === "/my-applications"
                  ? "text-indigo-600 font-medium"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              My Applications
            </Link>
          )}

          {isAuthenticated && user?.role === "recruiter" && (
            <Link
              href="/recruiter/dashboard"
              className={`transition-colors ${
                pathname.startsWith("/recruiter")
                  ? "text-indigo-600 font-medium"
                  : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              Dashboard
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-4 pl-2 border-l border-gray-200">
              <span className="text-gray-500 hidden sm:inline">
                Hi, {user?.name?.split(" ")[0]}
              </span>
              <button
                onClick={logout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
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