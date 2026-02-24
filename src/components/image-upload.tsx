"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RadialProgress from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type UploadResponse = {
  id: string;
  url: string;
  secureUrl: string | null;
  publicId: string | null;
};

export default function ImageUpload(props: {
  folder?: string;
  value?: string | null;
  onChange?: (url: string | null) => void;
  onUploadComplete?: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [dragActive, setDragActive] = useState(false);

  const currentUrl = useMemo(() => {
    return props.value !== undefined ? props.value : localUrl;
  }, [localUrl, props.value]);

  const isControlled = props.value !== undefined;

  useEffect(() => {
    return () => {
      if (xhrRef.current) {
        try {
          xhrRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  function setUrl(next: string | null) {
    if (!isControlled) setLocalUrl(next);
    props.onChange?.(next);
    if (next) props.onUploadComplete?.(next);
  }

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadFile(file: File) {
    if (!file) return;

    setError(null);
    setUploading(true);
    setProgress(0);

    // Abort any in-flight upload.
    if (xhrRef.current) {
      try {
        xhrRef.current.abort();
      } catch {
        // ignore
      }
      xhrRef.current = null;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (props.folder) formData.append("folder", props.folder);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.withCredentials = true;
      xhr.open("POST", "/api/uploads/images");

      xhr.upload.onprogress = (evt) => {
        if (!evt.lengthComputable) return;
        const pct = Math.round((evt.loaded / evt.total) * 100);
        setProgress(Math.max(0, Math.min(100, pct)));
      };

      const result = await new Promise<UploadResponse>((resolve, reject) => {
        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText) as {
              success: boolean;
              data?: UploadResponse;
              message?: string;
            };

            if (
              xhr.status < 200 ||
              xhr.status >= 300 ||
              !json.success ||
              !json.data
            ) {
              reject(new Error(json.message || "Upload failed"));
              return;
            }

            resolve(json.data);
          } catch {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));

        xhr.send(formData);
      });

      setUrl(result.secureUrl || result.url);
      resetInput();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      xhrRef.current = null;
    }
  }

  function onFileSelected(file: File | null) {
    if (!file) return;
    void uploadFile(file);
  }

  function onRemove() {
    if (xhrRef.current) {
      try {
        xhrRef.current.abort();
      } catch {
        // ignore
      }
      xhrRef.current = null;
    }

    setUploading(false);
    setProgress(0);
    setError(null);
    setUrl(null);
    resetInput();
  }

  function openPicker() {
    if (uploading) return;
    inputRef.current?.click();
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative flex min-h-[220px] w-full items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 p-6",
          dragActive ? "border-primary" : "border-border",
          uploading ? "cursor-not-allowed" : "cursor-pointer",
        )}
        onClick={openPicker}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (uploading) return;
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (uploading) return;
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          if (uploading) return;
          const file = e.dataTransfer.files?.[0] ?? null;
          onFileSelected(file);
        }}
      >
        {uploading ? (
          <div className="text-center">
            <RadialProgress progress={progress} />
            <p className="mt-3 text-sm font-semibold">Uploading Picture</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Do not refresh or perform any other action while the picture is
              being uploaded
            </p>
          </div>
        ) : currentUrl ? (
          <div className="text-center space-y-2">
            <div className="mx-auto max-w-[280px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentUrl}
                alt="Uploaded image"
                className="mx-auto max-h-24 w-auto rounded-md object-contain opacity-90"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold">Image Uploaded</p>
              <p className="text-xs text-muted-foreground">
                Click here to upload another image
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-md border bg-background">
              <MaterialSymbol icon="cloud_upload" className="text-[20px]" />
            </div>
            <p className="mt-3 text-sm font-semibold">Drag an image</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a image or drag here to upload directly
            </p>
          </div>
        )}

        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={uploading}
          onChange={(e) => onFileSelected(e.target.files?.[0] ?? null)}
        />
      </div>

      {currentUrl ? (
        <div className="flex items-center justify-between gap-3">
          <Link
            href={currentUrl}
            target="_blank"
            className="text-xs text-muted-foreground hover:underline"
          >
            Click here to see uploaded image :D
          </Link>

          <Button type="button" variant="secondary" onClick={onRemove}>
            Remove
          </Button>
        </div>
      ) : null}

      {error ? <div className="text-sm text-destructive">{error}</div> : null}
    </div>
  );
}
