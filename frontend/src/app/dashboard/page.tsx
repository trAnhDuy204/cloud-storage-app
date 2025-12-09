"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type FileItem = { id: number; name: string; size: string; updated: string };

export default function Dashboard() {
  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: "document.pdf", size: "120 KB", updated: "2025-11-20" },
    { id: 2, name: "photo.jpg", size: "2.3 MB", updated: "2025-11-22" },
  ]);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ id?: number; email?: string; name?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    // Check token + validate with backend
    const t = localStorage.getItem("token");
    if (!t) {
      // no token -> redirect to login
      router.push("/login");
      return;
    }
    setToken(t);

    (async () => {
      try {
        const res = await fetch(`${API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (!res.ok) {
          // invalid token -> remove and redirect
          localStorage.removeItem("token");
          setToken(null);
          router.push("/login");
          return;
        }
        const body = await res.json();
        setUser(body.user || null);

        // OPTIONAL: fetch real files from API if you have an endpoint
        // const filesRes = await fetch(`${API}/api/files`, { headers: { Authorization: `Bearer ${t}` } });
        // if (filesRes.ok) setFiles(await filesRes.json());

      } catch (err) {
        console.error("Dashboard auth check error:", err);
        localStorage.removeItem("token");
        router.push("/login");
      } finally {
        setLoading(false);
      }
    })();
  }, [API, router]);

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-slate-600">Đang kiểm tra đăng nhập...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">My Files</h2>
          {user && (
            <div className="text-sm text-slate-600">
              Xin chào, <span className="font-medium">{user.name || user.email}</span>
            </div>
          )}
        </div>

        {token ? (
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded">
              Logout
            </button>
          </div>
        ) : (
          <a href="/login" className="text-indigo-600 underline">
            Đăng nhập để quản lý
          </a>
        )}
      </div>

      <div className="bg-white shadow rounded p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Upload file</label>
          <input
            type="file"
            className="block"
            disabled={!token}
            title={token ? "Upload API chưa implement" : "Vui lòng đăng nhập để upload"}
          />
          <div className="text-xs text-slate-500 mt-1">
            {token ? "Upload API chưa implement — đây là giao diện." : "Vui lòng đăng nhập để upload file."}
          </div>
        </div>

        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-slate-600">
              <th>Name</th>
              <th>Size</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {files.map((f) => (
              <tr key={f.id} className="border-t">
                <td className="py-2">{f.name}</td>
                <td className="py-2">{f.size}</td>
                <td className="py-2">{f.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
