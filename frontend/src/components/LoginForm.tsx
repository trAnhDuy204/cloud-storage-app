"use client";

import React, { useEffect, useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const GOOGLE_CLIENT_ID =
    "811435489538-mj43vmh6u6jrkas2grdg26le7ac3vk23.apps.googleusercontent.com";
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const BACKEND_GOOGLE_AUTH = `${API_BASE}/api/auth/google`;
  const BACKEND_LOGIN = `${API_BASE}/api/auth/login`;

  useEffect(() => {
    // Inject Google Identity script once
    if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    // global callback for Google credential response
    // @ts-ignore
    window.handleCredentialResponse = async (response: any) => {
      try {
        setLoading(true);
        const id_token = response?.credential;
        if (!id_token) throw new Error("Không nhận được id_token từ Google");

        const res = await fetch(BACKEND_GOOGLE_AUTH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || body?.message || "Đăng nhập Google thất bại");

        // save token and redirect
        localStorage.setItem("token", body.token);
        window.location.href = "/dashboard";
      } catch (err: any) {
        console.error("Google sign-in error:", err);
        setMsg("Đăng nhập bằng Google thất bại: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    };

    // create g_id_onload div only if not exists
    if (!document.getElementById("g_id_onload")) {
      const onloadDiv = document.createElement("div");
      onloadDiv.id = "g_id_onload";
      onloadDiv.setAttribute("data-client_id", GOOGLE_CLIENT_ID);
      onloadDiv.setAttribute("data-context", "signin");
      onloadDiv.setAttribute("data-ux_mode", "popup");
      onloadDiv.setAttribute("data-callback", "handleCredentialResponse");
      document.body.appendChild(onloadDiv);
    }

    // ensure there is a container for the rendered button (Google will render into elements with class g_id_signin)
    if (!document.getElementById("google-signin-button")) {
      const btnDiv = document.createElement("div");
      btnDiv.id = "google-signin-button";
      btnDiv.className = "g_id_signin";
      btnDiv.setAttribute("data-type", "standard");
      btnDiv.setAttribute("data-size", "large");
      document.body.appendChild(btnDiv);
    }

    // no heavy cleanup to avoid reloading script on client-side navigation
    // return () => { /* optional cleanup */ };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      if (!email || !password) {
        setMsg("Vui lòng nhập email và mật khẩu.");
        setLoading(false);
        return;
      }

      const res = await fetch(BACKEND_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Đăng nhập thất bại");

      localStorage.setItem("token", body.token);
      setMsg("Đăng nhập thành công — chuyển hướng...");
      // small delay to show message
      setTimeout(() => (window.location.href = "/dashboard"), 400);
    } catch (err: any) {
      console.error("Login error:", err);
      setMsg(err.message || "Lỗi khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded bg-white">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-medium">Đăng nhập</h2>

        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@mail.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Mật khẩu</label>
          <input
            type="password"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-blue-600 text-white font-medium disabled:opacity-60"
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>

        {msg && <div className="text-sm text-red-600">{msg}</div>}
      </form>

      <div className="my-4 text-center">hoặc</div>

      <div className="flex justify-center">
        {/* Google will render into element with class g_id_signin, but we also include a fallback container */}
        <div
          id="google-signin-button"
          className="g_id_signin"
          data-type="standard"
          data-size="large"
        />
      </div>
    </div>
  );
}
