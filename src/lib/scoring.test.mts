import assert from "node:assert/strict";
import test from "node:test";
import { calculateDimensionResults } from "./scoring.ts";

const dimensions = [{ pair: ["E", "I"] as const, left: "社交", right: "独处" }];

test("neutral answers remain balanced", () => {
  const questions = [{ pair: ["E", "I"] as const }, { pair: ["I", "E"] as const }];
  const [result] = calculateDimensionResults(questions, { 0: 0, 1: 0 }, dimensions);
  assert.equal(result.leftPercent, 50);
  assert.equal(result.isTied, true);
  assert.equal(result.inclination, "接近均衡");
});
test("reversed questions score the selected semantic letter", () => {
  const questions = [{ pair: ["I", "E"] as const }];
  const [result] = calculateDimensionResults(questions, { 0: 2 }, dimensions);
  assert.equal(result.winner, "E");
  assert.equal(result.leftPercent, 100);
});

test("answer strength contributes to the final percentage", () => {
  const questions = [{ pair: ["E", "I"] as const }, { pair: ["E", "I"] as const }];
  const [result] = calculateDimensionResults(questions, { 0: -2, 1: 1 }, dimensions);
  assert.equal(result.leftPercent, 67);
  assert.equal(result.winner, "E");
});
