import type { Metadata } from 'next';
import type { ReactNode } from "react";
import './layout/globals.css';

export const metadata: Metadata = {
  title: 'Hellfile',
  description: 'Awesome web app for cloud storage management.',
  icons: {
    icon: '/Hellfile.ico',
    apple: '/Hellfile.ico',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">

        {children}

      </body>
    </html>
  );
}
