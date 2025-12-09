// frontend/src/components/NavUser.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NavUser() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      if (!token) { setLoading(false); return; }
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          localStorage.removeItem("token");
          setLoading(false);
          return;
        }
        const body = await res.json();
        setUser(body.user || null);
      } catch (err) {
        console.error("NavUser fetch error", err);
        localStorage.removeItem("token");
      } finally { setLoading(false); }
    }
    load();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/");
  };

  if (loading) return <div className="text-sm text-slate-600">...</div>;

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <a href="/login" className="text-sm px-3 py-1.5 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50 transition">Login</a>
        <a href="/register" className="text-sm px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition">Register</a>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-slate-700">Xin chào, <span className="font-medium">{user.name || user.email}</span></div>
      <button onClick={logout} className="text-sm px-3 py-1.5 rounded-md border text-slate-700 hover:bg-slate-100 transition">Logout</button>
    </div>
  );
}
