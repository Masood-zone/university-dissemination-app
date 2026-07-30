"use client";

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const EMOJIS = ["😊", "👍", "🎓", "📌", "📚", "✅", "⚠️", "🎉"];

export function sanitizeMarkdown(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(
      /\]\(\s*(?:javascript|data|vbscript):[^)]*\)/gi,
      "](about:blank)",
    );
}

export function RichMarkdownEditor({
  value,
  onChange,
  variant = "announcement",
  placeholder,
  maxLength = variant === "message" ? 5000 : 50000,
  disabled,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  variant?: "announcement" | "message";
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  onSubmit?: () => void;
}) {
  const [sourceMode, setSourceMode] = React.useState(false);
  const [showEmoji, setShowEmoji] = React.useState(false);
  const onChangeRef = React.useRef(onChange);
  const onSubmitRef = React.useRef(onSubmit);
  onChangeRef.current = onChange;
  onSubmitRef.current = onSubmit;

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          protocols: ["http", "https", "mailto"],
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Write your content…",
      }),
      Markdown,
    ],
    content: sanitizeMarkdown(value),
    contentType: "markdown",
    onUpdate: ({ editor: current }) => {
      const next = sanitizeMarkdown(current.getMarkdown()).slice(0, maxLength);
      onChangeRef.current(next);
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none outline-none",
          variant === "message"
            ? "min-h-20 max-h-48 overflow-y-auto p-3"
            : "min-h-72 p-4",
        ),
        "aria-label":
          variant === "message" ? "Message content" : "Announcement content",
      },
      handleKeyDown: (_, event) => {
        if (
          variant === "message" &&
          event.key === "Enter" &&
          (event.ctrlKey || event.metaKey)
        ) {
          event.preventDefault();
          onSubmitRef.current?.();
          return true;
        }
        return false;
      },
    },
  });

  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  React.useEffect(() => {
    if (!editor || sourceMode || editor.getMarkdown() === value) return;
    editor.commands.setContent(sanitizeMarkdown(value), {
      contentType: "markdown",
      emitUpdate: false,
    });
  }, [editor, sourceMode, value]);

  const command = (name: string, run: () => void, active?: boolean) => (
    <Button
      key={name}
      type="button"
      size="xs"
      variant={active ? "secondary" : "ghost"}
      onClick={run}
      disabled={disabled || !editor}
      aria-label={name}
      title={name}
    >
      {name}
    </Button>
  );

  const setLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const href = window.prompt("Link URL", previous ?? "https://");
    if (href === null) return;
    if (!href.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    if (!/^(https?:|mailto:)/i.test(href)) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/30 p-2">
        {!sourceMode && editor ? (
          <>
            {command("Bold", () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
            {command("Italic", () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
            {command("H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
            {command("Bullets", () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
            {command("Numbers", () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
            {command("Quote", () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}
            {command("Code", () => editor.chain().focus().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
            {command("Link", setLink, editor.isActive("link"))}
            <div className="relative">
              {command("Emoji", () => setShowEmoji((current) => !current))}
              {showEmoji ? (
                <div className="absolute bottom-full left-0 z-20 mb-2 flex w-48 flex-wrap gap-1 rounded-lg border bg-popover p-2 shadow-lg">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="rounded p-1 text-lg hover:bg-muted"
                      onClick={() => {
                        editor.chain().focus().insertContent(emoji).run();
                        setShowEmoji(false);
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        <Button
          type="button"
          size="xs"
          variant="outline"
          className="ml-auto"
          onClick={() => setSourceMode((current) => !current)}
        >
          {sourceMode ? "Visual" : "Markdown"}
        </Button>
      </div>
      {sourceMode ? (
        <Textarea
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          onChange={(event) =>
            onChange(sanitizeMarkdown(event.target.value).slice(0, maxLength))
          }
          onKeyDown={(event) => {
            if (
              variant === "message" &&
              event.key === "Enter" &&
              (event.ctrlKey || event.metaKey)
            ) {
              event.preventDefault();
              onSubmit?.();
            }
          }}
          className={cn(
            "resize-y rounded-none border-0 font-mono focus-visible:ring-0",
            variant === "message" ? "min-h-24" : "min-h-72",
          )}
          placeholder={placeholder}
          aria-label="Markdown source"
        />
      ) : editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="min-h-24 animate-pulse bg-muted/30" />
      )}
      <div className="flex items-center justify-between border-t px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>Markdown stored safely · Ctrl/⌘+Enter to send</span>
        <span className={value.length >= maxLength ? "text-destructive" : ""}>
          {value.length.toLocaleString()} / {maxLength.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
