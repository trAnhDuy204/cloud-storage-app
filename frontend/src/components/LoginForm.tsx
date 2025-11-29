"use client";
import { useState } from "react";

export default function LoginForm({ onLogin }: { onLogin?: (user:any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Đang đăng nhập...");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Login failed");
      localStorage.setItem("token", body.token);
      setMsg("Đăng nhập thành công");
      if (onLogin) onLogin(body.user);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setMsg(err.message || "Lỗi");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm">Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm">Mật khẩu</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" required />
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded">Đăng nhập</button>
      <div className="text-sm text-red-600">{msg}</div>
    </form>
  );
}
