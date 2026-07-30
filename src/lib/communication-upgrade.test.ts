import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeMarkdown } from "@/lib/markdown";
import {
  isValidGhanaPhone,
  normalizeGhanaPhone,
} from "@/lib/phone";

test("normalizes supported Ghana phone formats", () => {
  assert.equal(normalizeGhanaPhone("024 123 4567"), "233241234567");
  assert.equal(normalizeGhanaPhone("+233 24 123 4567"), "233241234567");
  assert.equal(normalizeGhanaPhone("233241234567"), "233241234567");
});

test("rejects ambiguous or non-Ghana phone formats", () => {
  assert.equal(normalizeGhanaPhone("12345"), null);
  assert.equal(normalizeGhanaPhone("+1 415 555 0100"), null);
  assert.equal(isValidGhanaPhone("0200000000"), true);
});

test("removes raw HTML and unsafe markdown link protocols", () => {
  const source =
    '<script>alert("x")</script> **Hello** [click](javascript:alert(1))';
  const sanitized = sanitizeMarkdown(source);
  assert.equal(sanitized.includes("<script>"), false);
  assert.equal(sanitized.includes("javascript:"), false);
  assert.equal(sanitized.includes("**Hello**"), true);
});
