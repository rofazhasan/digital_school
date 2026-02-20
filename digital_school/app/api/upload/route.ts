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

        const contentType = req.headers.get("content-type") || "";
        let fileBuffer: Buffer;
        let fileName: string = "upload";

        if (contentType.includes("application/json")) {
            const body = await req.json();
            if (!body.file) {
                return NextResponse.json({ error: "No base64 file provided" }, { status: 400 });
            }
            // Remove data:image/xxx;base64, prefix if present
            const base64Data = body.file.replace(/^data:image\/\w+;base64,/, "");
            fileBuffer = Buffer.from(base64Data, 'base64');
            fileName = body.fileName || "camera_upload.jpg";
        } else {
            const formData = await req.formData();
            const file = formData.get("file") as File;
            if (!file) {
                console.error('[Upload API] No file in request');
                return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
            }
            const arrayBuffer = await file.arrayBuffer();
            fileBuffer = Buffer.from(arrayBuffer);
            fileName = file.name;
        }

        console.log('[Upload API] File received:', fileName, 'Size:', fileBuffer.length, 'bytes');

        // Check if Cloudinary is configured
        if (!process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET || !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
            console.error('[Upload API] Cloudinary not configured. Missing env vars.');
            return NextResponse.json({ error: "Server configuration error: Cloudinary not configured" }, { status: 500 });
        }

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
            ).end(fileBuffer);
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
