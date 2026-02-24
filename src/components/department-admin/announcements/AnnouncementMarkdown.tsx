"use client";

import dynamic from "next/dynamic";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

export function AnnouncementMarkdownEditor({
  value,
  onChange,
  height = 420,
}: {
  value: string;
  onChange: (next: string) => void;
  height?: number;
}) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(next) => onChange(next ?? "")}
        height={height}
        preview="edit"
      />
    </div>
  );
}

export function AnnouncementMarkdownPreview({ source }: { source: string }) {
  return (
    <div data-color-mode="light" className="w-full">
      <MarkdownPreview source={source} />
    </div>
  );
}
