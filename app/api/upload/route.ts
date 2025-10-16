import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("pdf") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME!)
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (error) throw error;

    // ambil URL publik
    const { data: publicUrl } = supabase.storage
      .from(process.env.SUPABASE_BUCKET_NAME!)
      .getPublicUrl(fileName);

    // generate QR code dari URL
    const qrDataUrl = await QRCode.toDataURL(publicUrl.publicUrl);

    return NextResponse.json({
      pdfUrl: publicUrl.publicUrl,
      qrCode: qrDataUrl,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
