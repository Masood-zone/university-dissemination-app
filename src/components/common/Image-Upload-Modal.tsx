"use client";

import { useRef, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

import { MaterialSymbol } from "@/components/common/MaterialSymbol";
import { useImageUploadStore } from "@/stores/imageUploadStore";

type UploadResponse = {
  id: string;
  url: string;
  secureUrl: string | null;
  publicId: string | null;
};

export default function ImageUploadModal() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const selectedFile = useImageUploadStore((s) => s.selectedFile);
  const uploadedUrl = useImageUploadStore((s) => s.uploadedUrl);
  const uploading = useImageUploadStore((s) => s.uploading);
  const storeError = useImageUploadStore((s) => s.error);
  const setSelectedFile = useImageUploadStore((s) => s.setSelectedFile);
  const setUploadedUrl = useImageUploadStore((s) => s.setUploadedUrl);
  const setUploading = useImageUploadStore((s) => s.setUploading);
  const setError = useImageUploadStore((s) => s.setError);
  const reset = useImageUploadStore((s) => s.reset);

  async function upload() {
    if (!selectedFile) return;

    setLocalError(null);
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

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

      setUploadedUrl(json.data.secureUrl || json.data.url);

      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setLocalError(message);
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    reset();
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Button type="button">
          <MaterialSymbol icon="upload" className="mr-2 text-[18px]" />
          Upload Image
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className=" mb-3">Upload Profile Picture</DialogTitle>

          <div className="w-full rounded-lg border p-6">
            <div className="text-xs font-medium tracking-wide text-muted-foreground">
              IMAGE (OPTIONAL)
            </div>

            <div className="mt-3 flex items-center gap-3">
              <Input
                ref={inputRef}
                id="upload-file"
                accept="image/png, image/jpeg"
                type="file"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setLocalError(null);
                  setError(null);
                }}
              />

              <Button
                type="button"
                onClick={() => void upload()}
                disabled={!selectedFile || uploading}
              >
                <MaterialSymbol icon="upload" className="mr-2 text-[18px]" />
                {uploading ? "Uploading" : "Upload"}
              </Button>
            </div>

            <div className="mt-2 text-sm text-muted-foreground">
              Upload to attach a cover image.
            </div>

            {uploadedUrl ? (
              <div className="mt-2 text-sm text-muted-foreground">
                Uploaded.
              </div>
            ) : null}

            {localError || storeError ? (
              <div className="mt-2 text-sm text-destructive">
                {localError || storeError}
              </div>
            ) : null}
          </div>
        </DialogHeader>

        <DialogFooter className=" flex items-center justify-end gap-x-2">
          <DialogClose asChild>
            <Button onClick={clear} type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>

          <Button
            onClick={() => void upload()}
            disabled={!selectedFile || uploading}
            size={"sm"}
            className=" text-sm"
          >
            {uploading ? "Uploading..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
