"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"error" | "success" | "loading">("error");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "811435489538-mj43vmh6u6jrkas2grdg26le7ac3vk23.apps.googleusercontent.com";
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const BACKEND_GOOGLE_AUTH = `${API_BASE}/api/login/google`;
  const BACKEND_LOGIN = `${API_BASE}/api/login`;

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
        setIsLoading(true);
        const id_token = response?.credential;
        console.log("Google ID Token:", id_token);
        if (!id_token) throw new Error("Không nhận được id_token từ Google");

        const res = await fetch(BACKEND_GOOGLE_AUTH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || body?.message || "Đăng nhập Google thất bại");

        // xóa thông tin cũ trước khi lưu mới
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // lưu token và user mới
        localStorage.setItem("token", body.token);
        localStorage.setItem("user", JSON.stringify(body.user));
        window.location.href = "/dashboard";
      } catch (err: any) {
        console.error("Google sign-in error:", err);
        setMsg("Đăng nhập bằng Google thất bại: " + (err.message || err));
      } finally {
        setIsLoading(false);
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
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("Đang đăng nhập...");
    setMsgType("loading");
    setIsLoading(true);

    try {
      if (!email || !password) {
        setMsg("Vui lòng nhập email và mật khẩu.");
        setIsLoading(false);
        return;
      }

      const res = await fetch(BACKEND_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const body = await res.json().catch(() => ({}));
      
      if (!res.ok) throw new Error(body.message || "Đăng nhập thất bại");
      
      localStorage.setItem("token", body.token);
      localStorage.setItem("user", JSON.stringify(body.user));
      setMsg("Đăng nhập thành công!");
      setMsgType("success");
      
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err: any) {
      setMsg(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.");
      setMsgType("error");
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-200 via-pink-100 to-indigo-200 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Chào mừng trở lại</h1>
            <p className="text-indigo-100">Đăng nhập để tiếp tục</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 text-black border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-12 py-3 text-black border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 cursor-pointer text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 focus:outline-none focus:ring-4 focus:ring-orange-300 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Đang xử lý...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>

            {/* Message */}
            {msg && (
              <div
                className={`flex items-center gap-2 p-4 rounded-xl ${
                  msgType === "error"
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : msgType === "success"
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                {msgType === "error" && <AlertCircle className="w-5 h-5 shrink-0" />}
                {msgType === "success" && <CheckCircle className="w-5 h-5 shrink-0" />}
                {msgType === "loading" && (
                  <svg className="animate-spin h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span className="text-sm font-medium">{msg}</span>
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-1 gap-3">
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
          </form>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <a href="/register" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                Đăng ký ngay
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Bằng cách đăng nhập, bạn đồng ý với{" "}
          <a href="#" className="text-orange-600 hover:underline">Điều khoản dịch vụ</a>
          {" "}và{" "}
          <a href="#" className="text-orange-600 hover:underline">Chính sách bảo mật</a>
        </p>
      </div>
    </div>
  );
}