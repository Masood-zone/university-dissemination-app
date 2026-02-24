import { create } from "zustand";

interface ImageUploadState {
  selectedFile: File | null;
  uploadedUrl: string | null;
  uploading: boolean;
  error: string | null;

  setSelectedFile: (file: File | null) => void;
  setUploadedUrl: (url: string | null) => void;
  setUploading: (uploading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useImageUploadStore = create<ImageUploadState>((set) => ({
  selectedFile: null,
  uploadedUrl: null,
  uploading: false,
  error: null,

  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setUploadedUrl: (uploadedUrl) => set({ uploadedUrl }),
  setUploading: (uploading) => set({ uploading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      selectedFile: null,
      uploadedUrl: null,
      uploading: false,
      error: null,
    }),
}));
