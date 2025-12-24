import Header from "../components/headerSetting";
import Footer from "../components/footer"
import type { ReactNode } from "react";

export default function LoginLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {children}
      <Footer/>
    </div>
  );
}
