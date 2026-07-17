import type { QuizMode } from "@/data/mibt";

export type SharedResultPayload = {
  code: string;
  catName: string;
  scores: number[];
  mode: QuizMode;
};

const validTypeCodes = new Set([
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ",
]);
const dimensionPairs = [["E", "I"], ["S", "N"], ["T", "F"], ["J", "P"]] as const;

export function buildSharedResultUrl(baseUrl: string, payload: SharedResultPayload) {
  const url = new URL("result/", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  url.searchParams.set("v", "1");
  url.searchParams.set("t", payload.code);
  url.searchParams.set("n", payload.catName.slice(0, 12));
  url.searchParams.set("s", payload.scores.map((score) => Math.round(score)).join("."));
  url.searchParams.set("m", payload.mode === "full" ? "f" : "q");
  return url.toString();
}

export function parseSharedResult(search: string): SharedResultPayload | null {
  const parameters = new URLSearchParams(search);
  const code = parameters.get("t")?.toUpperCase() ?? "";
  const catName = parameters.get("n")?.trim().slice(0, 12) ?? "";
  const rawScores = parameters.get("s")?.split(".") ?? [];
  const scores = rawScores.map(Number);
  const expectedCode = scores.length === 4
    ? scores.map((score, index) => score >= 50 ? dimensionPairs[index][0] : dimensionPairs[index][1]).join("")
    : "";

  if (
    parameters.get("v") !== "1" ||
    !validTypeCodes.has(code) ||
    expectedCode !== code ||
    !catName ||
    scores.length !== 4 ||
    scores.some((score) => !Number.isFinite(score) || score < 0 || score > 100)
  ) {
    return null;
  }

  return {
    code,
    catName,
    scores: scores.map(Math.round),
    mode: parameters.get("m") === "f" ? "full" : "quick",
  };
}
