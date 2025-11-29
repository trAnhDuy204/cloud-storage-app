// frontend/src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cloud Storage - Demo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        {/* Tailwind CDN (development fallback) */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <header className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-semibold">CloudStorage</h1>
            <nav className="space-x-3">
              <a href="/" className="text-sm hover:underline">Home</a>
              <a href="/dashboard" className="text-sm hover:underline">My Files</a>
              <a href="/login" className="text-sm hover:underline">Login</a>
              <a href="/register" className="text-sm hover:underline">Register</a>
            </nav>
          </header>
          <main className="py-6">{children}</main>
          <footer className="py-6 text-sm text-center text-slate-500">
            © 2025 CloudStorage demo
          </footer>
        </div>
      </body>
    </html>
  );
}
