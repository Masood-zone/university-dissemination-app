import { v2 as cloudinary } from "cloudinary";

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  created_at?: string;
}

let configured = false;

function ensureConfigured() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary credentials are missing from environment");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  configured = true;
}

export async function uploadImageBuffer(args: {
  buffer: Buffer;
  folder?: string;
  filename?: string;
  contentType?: string;
}): Promise<CloudinaryUploadResponse> {
  ensureConfigured();

  const folder = args.folder || "sids";

  const res = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        filename_override: args.filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as unknown as CloudinaryUploadResponse);
      },
    );

    stream.end(args.buffer);
  });

  return {
    public_id: res.public_id,
    secure_url: res.secure_url,
    url: res.url,
    format: res.format,
    width: res.width,
    height: res.height,
    bytes: res.bytes,
    created_at: res.created_at,
  };
}
