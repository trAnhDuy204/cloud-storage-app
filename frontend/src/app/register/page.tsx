"use client";
import RegisterForm from "@/components/RegisterForm";


export default function RegisterPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white shadow rounded p-6">
        <h2 className="text-2xl font-semibold mb-4">Tạo tài khoản</h2>
        <RegisterForm />
      </div>
    </div>
  );
}
