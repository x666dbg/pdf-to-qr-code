"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

// Inisialisasi Supabase client (pakai env public)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
      if (!file) throw new Error("Pilih file PDF dulu");

      // buat nama file unik
      const fileName = `${Date.now()}-${file.name}`;

      // Upload langsung ke bucket Supabase
      const { error: uploadError } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME || "pdfs")
        .upload(fileName, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Ambil public URL
      const { data: publicUrlData } = supabase.storage
        .from(process.env.SUPABASE_BUCKET_NAME || "pdfs")
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      setPdfUrl(publicUrl);

      // Generate QR code dari URL
      const qrDataUrl = await QRCode.toDataURL(publicUrl);
      setQrCode(qrDataUrl);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat upload");
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
