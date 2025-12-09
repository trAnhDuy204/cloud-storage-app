"use client";

import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 mt-20">
        <div className="w-full max-w-xl mx-auto">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
