import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server";
import { uploadImageBuffer } from "@/lib/cloudinary/cloudinary-service";
import type { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const session = await requireSession(request);

    const formData = await request.formData();
    const file = formData.get("file");
    const folderRaw = formData.get("folder");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "File is required",
          code: "FILE_REQUIRED",
        } satisfies ApiResponse<never>,
        { status: 400 },
      );
    }

    const folder =
      typeof folderRaw === "string" && folderRaw.trim()
        ? folderRaw.trim()
        : "sids";

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploaded = await uploadImageBuffer({
      buffer,
      folder,
      filename: file.name,
      contentType: file.type,
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        provider: "CLOUDINARY",
        publicId: uploaded.public_id,
        url: uploaded.url,
        secureUrl: uploaded.secure_url,
        format: uploaded.format ?? null,
        width: uploaded.width ?? null,
        height: uploaded.height ?? null,
        bytes: uploaded.bytes ?? null,
        folder,
        createdById: session?.user.id,
      },
      select: {
        id: true,
        url: true,
        secureUrl: true,
        publicId: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: asset,
      } satisfies ApiResponse<typeof asset>,
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Response) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized",
          code: "UNAUTHORIZED",
        } satisfies ApiResponse<never>,
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload image",
        code: "UPLOAD_FAILED",
      } satisfies ApiResponse<never>,
      { status: 500 },
    );
  }
}
