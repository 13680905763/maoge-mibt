export type ScoredDimension<TLetter extends string> = {
  pair: readonly [TLetter, TLetter];
  left: string;
  right: string;
  leftPercent: number;
  rightPercent: number;
  leftScore: number;
  rightScore: number;
  winner: TLetter;
  isTied: boolean;
  inclination: "接近均衡" | "轻微倾向" | "明显倾向";
};

type ScoringQuestion<TLetter extends string> = {
  pair: readonly [TLetter, TLetter];
};

type DimensionDefinition<TLetter extends string> = {
  pair: readonly [TLetter, TLetter];
  left: string;
  right: string;
};

export function getInclinationLabel(leftPercent: number): ScoredDimension<string>["inclination"] {
  const difference = Math.abs(leftPercent - 50);
  if (difference <= 8) return "接近均衡";
  if (difference <= 22) return "轻微倾向";
  return "明显倾向";
}
export function calculateDimensionResults<TLetter extends string>(
  questions: readonly ScoringQuestion<TLetter>[],
  answers: Readonly<Record<number, number>>,
  dimensions: readonly DimensionDefinition<TLetter>[],
): ScoredDimension<TLetter>[] {
  return dimensions.map((dimension) => {
    let leftScore = 0;
    let rightScore = 0;

    questions.forEach((question, index) => {
      const belongsToDimension = question.pair.some(
        (letter) => letter === dimension.pair[0] || letter === dimension.pair[1],
      );
      if (!belongsToDimension) return;

      const answer = answers[index] ?? 0;
      const selectedLetter = answer < 0 ? question.pair[0] : question.pair[1];
      const amount = Math.abs(answer);
      if (selectedLetter === dimension.pair[0]) leftScore += amount;
      if (selectedLetter === dimension.pair[1]) rightScore += amount;
    });

    const total = leftScore + rightScore;
    const leftPercent = total === 0 ? 50 : Math.round((leftScore / total) * 100);
    const isTied = leftScore === rightScore;

    return {
      ...dimension,
      leftPercent,
      rightPercent: 100 - leftPercent,
      leftScore,
      rightScore,
      winner: leftScore >= rightScore ? dimension.pair[0] : dimension.pair[1],
      isTied,
      inclination: getInclinationLabel(leftPercent),
    };
  });
}
