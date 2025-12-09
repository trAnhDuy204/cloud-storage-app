import type { Metadata } from "next";
import NavUser from "@/components/NavUser";


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
        {/* Sticky navbar */}
        <header className="w-full bg-white/95 border-b shadow-sm sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow">
                  {/* simple cloud icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.36 10.46A7 7 0 0 0 5.64 9.6 5.5 5.5 0 1 0 18.5 12H19a3.5 3.5 0 0 0 .36-1.54z" />
                  </svg>
                </div>
                <div>
                  <a href="/" className="text-2xl font-bold text-slate-800 hover:text-blue-600 transition">
                    CloudStorage
                  </a>
                  <div className="text-xs text-slate-400">demo</div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex items-center gap-4">
                <a
                  href="/"
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 transition"
                  aria-label="Home"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 11.5L12 4l9 7.5M5 21h14V10" />
                  </svg>
                  Home
                </a>

                <a
                  href="/dashboard"
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-600 transition"
                  aria-label="My Files"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7v13a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V7M3 7l4-4h10l4 4" />
                  </svg>
                  My Files
                </a>

                {/* NavUser will show Login/Register or user info + logout */}
                <NavUser />
              </nav>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="py-6">
          <div className="max-w-6xl mx-auto px-4">{children}</div>
        </main>

        <footer className="py-6 text-sm text-center text-slate-500">
          © 2025 CloudStorage demo
        </footer>
      </body>
    </html>
  );
}
