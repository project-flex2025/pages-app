import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  api: { bodyParser: false },
};

const REGION = process.env.AWS_REGION!;
const BUCKET_NAME = process.env.S3_BUCKET_NAME!;
const APP_ID = process.env.FEATURE_NAME!;

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

function getFileCategory(ext: string): string {
  const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
  const videoExts = ["mp4", "mov", "avi", "mkv", "flv", "wmv"];
  const audioExts = ["mp3", "wav", "aac", "flac", "ogg", "m4a"];
  if (imageExts.includes(ext.toLowerCase())) return "images";
  if (videoExts.includes(ext.toLowerCase())) return "videos";
  if (audioExts.includes(ext.toLowerCase())) return "audios";
  return "files";
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const safeName =
      (formData.get("safeName") as string)?.replace(/\s+/g, "_") || "guest";
    const uniqueId = formData.get("uniqueId") as string;

    if (!file || typeof file === "string" || !safeName || !uniqueId) {
      return NextResponse.json({ error: "Missing file or parameters" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const categoryFolder = getFileCategory(ext);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = `${safeName}_${uniqueId}.${ext}`;
    const key = `user_uploads/${APP_ID}/${categoryFolder}/${fileName}`;

    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    };

    await s3.send(new PutObjectCommand(uploadParams));
    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${key}`;

    return NextResponse.json({
      success: true,
      fileName,
      url: fileUrl,
      category: categoryFolder,
    });
  } catch (err: unknown) {
    console.error("S3 Upload Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown server error";

    return NextResponse.json(
      { error: "Upload failed", details: errorMessage },
      { status: 500 }
    );
  }
}
