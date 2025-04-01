type Weights<WeightsNames extends string> = { [k in WeightsNames]: number };

export default function weightedSelection<T extends string>(
  weights: Weights<T>,
  totalAmount: number
): Record<T, number> {
  /**
   * Selects factors based on their probabilities.
   *
   * @param factors - An object where keys are factor names and values are probabilities (0 to 1).
   * @param totalAmount - The total number of selections to make.
   * @returns An array of selected factors.
   */
  const selections: Record<T, number> = {} as Record<T, number>;
  const factorNames = Object.keys(weights) as T[];
  const probabilities = Object.values(weights) as number[];

  for (let i = 0; i < totalAmount; i++) {
    const choice = weightedRandomChoice(factorNames, probabilities);
    selections[choice] = (selections[choice] || 0) + 1;
  }

  return selections;
}

function weightedRandomChoice<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let randomValue = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    if (randomValue < weights[i]) {
      return items[i];
    }
    randomValue -= weights[i];
  }
  return items[items.length - 1];
}
