"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isAuthenticated, removeToken } from "@/lib/auth";
import "./globals.css";

function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
  }, [pathname]);

  const linkClass = (href: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-blue-100 text-blue-700"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  if (!authed) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className={linkClass("/login")}>Sign In</Link>
        <Link href="/register" className={linkClass("/register")}>Register</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/dashboard" className={linkClass("/dashboard")}>Dashboard</Link>
      <Link href="/tasks" className={linkClass("/tasks")}>Tasks</Link>
      <button
        onClick={() => {
          removeToken();
          router.push("/login");
        }}
        className="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
      >
        Logout
      </button>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center justify-between">
              <Link href="/" className="text-lg font-bold text-blue-600">TaskFlow</Link>
              <NavLinks />
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
