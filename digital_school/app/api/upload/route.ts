import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { getTokenFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        console.log('[Upload API] Request received');

        const token = await getTokenFromRequest(req);
        if (!token) {
            console.error('[Upload API] Unauthorized - no token');
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            console.error('[Upload API] No file in request');
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        console.log('[Upload API] File received:', file.name, file.type, file.size, 'bytes');

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
            console.error('[Upload API] Cloudinary not configured. Missing env vars.');
            return NextResponse.json({ error: "Server configuration error: Cloudinary not configured" }, { status: 500 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('[Upload API] Starting Cloudinary upload...');

        // Upload to Cloudinary using a stream or buffer
        const result: any = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    folder: "question-bank", // Upload to this folder
                    resource_type: "auto",
                    width: 1280,
                    crop: "limit",
                    quality: "auto:good", // Intelligent compression
                    fetch_format: "auto", // WebP/AVIF automatically
                },
                (error, result) => {
                    if (error) {
                        console.error('[Upload API] Cloudinary upload failed:', error);
                        reject(error);
                    } else {
                        console.log('[Upload API] Cloudinary upload successful:', result?.secure_url);
                        resolve(result);
                    }
                }
            ).end(buffer);
        });

        return NextResponse.json({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width,
            height: result.height,
        });

    } catch (error: any) {
        console.error("[Upload API] Error:", error);
        return NextResponse.json({
            error: error.message || "Upload failed",
            details: error.toString()
        }, { status: 500 });
    }
}
