'use client';
export const dynamic = 'force-dynamic';

import HeaderDashboard from "../components/headerDashboard";
import Footer from "../components/footer"
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderDashboard/>
      {children}
      <Footer/>
    </div>
  );
}
