"use client";
import { useState } from "react";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Đang gửi...");
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${base}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name })
      });

      const contentType = res.headers.get("content-type") || "";
      let body: any;
      if (contentType.includes("application/json")) {
        body = await res.json();
      } else {
        body = { message: await res.text() };
      }

      if (!res.ok) throw new Error(body?.message || `Lỗi ${res.status}`);

      setMsg("Đăng ký thành công — vui lòng đăng nhập.");
      setEmail(""); setName(""); setPassword("");
    } catch (err: any) {
      setMsg(String(err.message || err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm">Tên</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm">Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" className="w-full border rounded px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm">Mật khẩu</label>
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" required />
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded">Đăng ký</button>
      <div className="text-sm text-red-600">{msg}</div>
    </form>
  );
}
