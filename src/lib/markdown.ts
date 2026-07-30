export function sanitizeMarkdown(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(
      /\]\(\s*(?:javascript|data|vbscript):[^)]*\)/gi,
      "](about:blank)",
    );
}
