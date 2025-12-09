// frontend/src/lib/apiClient.ts
const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Lấy token từ localStorage (giống chỗ bạn lưu sau khi login)
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("token");
  }

  const headers = new Headers(options.headers || {});
  // chỉ set Content-Type nếu body là JSON
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      message = (data as any).message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json();
}
