import assert from "node:assert/strict";
import test from "node:test";
import { buildSharedResultUrl, parseSharedResult } from "./share-result.ts";

test("shared results round-trip without including an avatar", () => {
  const url = buildSharedResultUrl("https://example.com/", {
    code: "ENFP",
    catName: "毛球",
    scores: [70, 42, 39, 28],
    mode: "quick",
  });
  const parsed = parseSharedResult(new URL(url).search);
  assert.deepEqual(parsed, {
    code: "ENFP",
    catName: "毛球",
    scores: [70, 42, 39, 28],
    mode: "quick",
  });
  assert.equal(url.includes("avatar"), false);
});

test("invalid type codes are rejected", () => {
  assert.equal(parseSharedResult("?v=1&t=XXXX&n=毛球&s=50.50.50.50&m=q"), null);
});

test("a type code that conflicts with its scores is rejected", () => {
  assert.equal(parseSharedResult("?v=1&t=ISTJ&n=毛球&s=80.20.80.80&m=q"), null);
});
