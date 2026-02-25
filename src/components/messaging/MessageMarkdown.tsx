"use client";

import dynamic from "next/dynamic";

import "@uiw/react-markdown-preview/markdown.css";

const MarkdownPreview = dynamic(() => import("@uiw/react-markdown-preview"), {
  ssr: false,
});

export function MessageMarkdownPreview({
  source,
  colorMode,
}: {
  source: string;
  colorMode: "light" | "dark";
}) {
  return (
    <div
      data-color-mode={colorMode}
      className="w-full break-words [&_.wmde-markdown]:bg-transparent [&_.wmde-markdown]:p-0"
    >
      <MarkdownPreview source={source} />
    </div>
  );
}
