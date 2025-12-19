"use client";
import { useEffect, useState } from "react";
import { getToken, getUser } from "../../app/utils/auth";
import { useRouter } from "next/navigation";

type FileItem = { id: number; name: string; size: string; updated: string };

export default function Dashboard() {
  const [files, setFiles] = useState<FileItem[]>([
    { id: 1, name: "document.pdf", size: "120 KB", updated: "2025-11-20" },
    { id: 2, name: "photo.jpg", size: "2.3 MB", updated: "2025-11-22" },
  ]);

  const token = getToken();
  const user = getUser();
  console.log("user: ", user);
  console.log("token: ", token);

  return (
    <div>
      <div className="bg-white shadow rounded p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Upload file</label>
          <input type="file" className="block" disabled />
          <div className="text-xs text-slate-500 mt-1">Upload API chưa implement — đây là giao diện.</div>
        </div>

        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-slate-600">
              <th>Name</th>
              <th>Size</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {files.map(f => (
              <tr key={f.id} className="border-t">
                <td className="py-2">{f.name}</td>
                <td className="py-2">{f.size}</td>
                <td className="py-2">{f.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}