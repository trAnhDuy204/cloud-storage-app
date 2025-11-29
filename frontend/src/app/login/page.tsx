    "use client";
import LoginForm from "../../components/LoginForm";

export default function LoginPage() {
  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white shadow rounded p-6">
        <h2 className="text-2xl font-semibold mb-4">Đăng nhập</h2>
        <LoginForm />
      </div>
    </div>
  );
}
