"use client";

import { useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type UploadResponse = {
  id: string;
  url: string;
  secureUrl: string | null;
  publicId: string | null;
};

export function ImageUpload(props: {
  value?: string | null;
  folder?: string;
  onChange: (args: {
    url: string;
    assetId?: string;
    publicId?: string;
  }) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const imageUrl = props.value || "";

  const displayUrl = useMemo(() => {
    return imageUrl || "";
  }, [imageUrl]);

  async function onFileSelected(file: File) {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (props.folder) formData.append("folder", props.folder);

      const res = await fetch("/api/uploads/images", {
        method: "POST",
        body: formData,
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: UploadResponse;
        message?: string;
      };

      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.message || "Upload failed");
      }

      props.onChange({
        url: json.data.secureUrl || json.data.url,
        assetId: json.data.id,
        publicId: json.data.publicId || undefined,
      });

      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFileSelected(file);
        }}
      />

      {uploading ? (
        <div className="text-sm text-muted-foreground">Uploading…</div>
      ) : null}

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      {displayUrl ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input readOnly value={displayUrl} />
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onChange({ url: "" })}
            >
              Clear
            </Button>
          </div>

          <div className="overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="Uploaded"
              className="h-auto w-full max-w-xl"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
