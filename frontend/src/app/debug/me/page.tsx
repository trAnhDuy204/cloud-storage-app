"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

type MeResponse = {
  user: {
    id: number;
    email: string;
    name?: string | null;
    organizationId?: number | null;
  };
};

export default function DebugMePage() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      try {
        setLoading(true);
        const res = await apiFetch<MeResponse>("/api/auth/me");
        setData(res);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Lỗi khi gọi /api/auth/me");
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded shadow p-4">
        <h1 className="text-xl font-semibold mb-4">
          Debug /api/auth/me (backend)
        </h1>

        {loading && <p>Đang tải...</p>}
        {error && <p className="text-red-600">Lỗi: {error}</p>}

        {data && (
          <pre className="mt-4 bg-gray-100 p-3 rounded text-sm overflow-auto">
{JSON.stringify(data, null, 2)}
          </pre>
        )}

        {!loading && !data && !error && (
          <p>Không có dữ liệu. Bạn đã đăng nhập chưa?</p>
        )}
      </div>
    </main>
  );
}
