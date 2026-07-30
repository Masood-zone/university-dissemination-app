"use client";

import dynamic from "next/dynamic";
import { RichMarkdownEditor } from "@/components/common/RichMarkdownEditor";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

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
    <div style={{ minHeight: height }}>
      <RichMarkdownEditor value={value} onChange={onChange} />
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
