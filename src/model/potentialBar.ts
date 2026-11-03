export type PotentialBar = {
  originalKg: number;
  nextKg: number;
  savingsKg: number;
  coloredPercent: number;
  greyPercent: number;
  inconsistent: boolean;
};

/**
 * One category bar for a possible future footprint.
 * The colored share is the footprint after selected changes.
 * The grey share is the potential reduction.
 * Together they fill the original category footprint.
 */
export function potentialCategoryBar(originalKg: number, scenarioKg: number): PotentialBar {
  const original = finiteKg(originalKg);
  const scenario = Number.isFinite(scenarioKg) ? scenarioKg : original;
  const rawSavings = original - scenario;
  const savingsKg = Math.max(0, rawSavings);
  const inconsistent = savingsKg > original + 0.5;
  const nextKg = Math.max(0, original - savingsKg);
  if (original <= 0) {
    return {
      originalKg: original,
      nextKg: 0,
      savingsKg,
      coloredPercent: 0,
      greyPercent: 0,
      inconsistent,
    };
  }
  const coloredPercent = clampPercent((nextKg / original) * 100);
  const greyPercent = clampPercent(Math.min(100 - coloredPercent, (Math.min(savingsKg, original) / original) * 100));
  return { originalKg: original, nextKg, savingsKg, coloredPercent, greyPercent, inconsistent };
}

/** Tonnes for one footprint. Small footprints stay in tonnes. */
export function formatPotentialTonnes(kg: number): string {
  const tonnes = finiteKg(kg) / 1000;
  const digits = tonnes >= 10 ? 0 : tonnes >= 1 ? 1 : 2;
  return `${trimTonnes(tonnes, digits)} t`;
}

/** Before and after labels. Adds a decimal when rounding would hide a real change. */
export function formatPotentialPair(originalKg: number, nextKg: number): { original: string; next: string } {
  const original = finiteKg(originalKg) / 1000;
  const next = finiteKg(nextKg) / 1000;
  let originalDigits = tonneDigits(original);
  let nextDigits = tonneDigits(next);
  while (
    Math.max(originalDigits, nextDigits) < 2 &&
    Math.abs(original - next) >= 0.05 &&
    trimTonnes(original, originalDigits) === trimTonnes(next, nextDigits)
  ) {
    originalDigits += 1;
    nextDigits += 1;
  }
  return {
    original: `${trimTonnes(original, originalDigits)} t`,
    next: `${trimTonnes(next, nextDigits)} t`,
  };
}

export function formatPotentialKg(kg: number): string {
  return Math.round(finiteKg(kg)).toLocaleString("en-US");
}

function finiteKg(kg: number): number {
  if (!Number.isFinite(kg) || kg < 0) return 0;
  return kg;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.min(100, value);
}

function tonneDigits(tonnes: number): number {
  if (tonnes >= 10) return 0;
  if (tonnes >= 1) return 1;
  return 2;
}

function trimTonnes(tonnes: number, digits: number): string {
  return tonnes
    .toFixed(digits)
    .replace(/\.0+$/, "")
    .replace(/(\.\d)0$/, "$1");
}
