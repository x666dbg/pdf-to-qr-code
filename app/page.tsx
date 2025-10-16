"use client";
import { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setPdfUrl(null);
    setQrCode(null);

    try {
      const formData = new FormData();
      if (file) formData.append("pdf", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal upload");
      setPdfUrl(data.pdfUrl);
      setQrCode(data.qrCode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">PDF → QR Generator by RzkyO</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 items-center">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="bg-gray-800 p-3 rounded-md border border-gray-700 file:bg-blue-600 file:text-white"
        />
        <button
          type="submit"
          disabled={loading || !file}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Generate QR Code"}
        </button>
      </form>

      {error && <p className="mt-4 text-red-400">{error}</p>}

      {qrCode && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <img src={qrCode} alt="QR Code" className="border p-2 bg-white" />
          <a
            href={pdfUrl!}
            target="_blank"
            className="text-blue-400 underline"
          >
            Lihat PDF
          </a>
        </div>
      )}
    </main>
  );
}
