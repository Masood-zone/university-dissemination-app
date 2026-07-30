export function normalizeGhanaPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) {
    return `233${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("233")) return digits;
  return null;
}

export function isValidGhanaPhone(value: string): boolean {
  return normalizeGhanaPhone(value) !== null;
}
