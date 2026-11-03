import { starterAnswers } from "../data/habits";
import { usPerCapitaKgCo2e } from "../data/factors";
import { calculate } from "./calculate";
import { formatCarbon } from "./format";

export function typicalUsLifestyleKg(): number {
  return calculate(starterAnswers).totals.carbon;
}

export function usInventoryPerPersonKg(): number {
  return usPerCapitaKgCo2e;
}

export function lifestyleCompare(carbonKg: number): {
  typicalKg: number;
  percent: number;
  direction: "above" | "below" | "near";
  typicalLabel: string;
  percentLine: string;
} {
  const typicalKg = typicalUsLifestyleKg();
  const typical = formatCarbon(typicalKg);
  const typicalLabel = `${typical.value} ${typical.unit} CO₂e`;
  if (!Number.isFinite(carbonKg) || typicalKg <= 0) {
    return {
      typicalKg,
      percent: 0,
      direction: "near",
      typicalLabel,
      percentLine: "Your estimate is close to that typical year.",
    };
  }
  const ratio = (carbonKg - typicalKg) / typicalKg;
  const percent = Math.round(Math.abs(ratio) * 100);
  if (percent < 5) {
    return {
      typicalKg,
      percent,
      direction: "near",
      typicalLabel,
      percentLine: "Your estimate is close to that typical year.",
    };
  }
  if (ratio > 0) {
    return {
      typicalKg,
      percent,
      direction: "above",
      typicalLabel,
      percentLine: `Your estimate is about ${percent}% above that typical year.`,
    };
  }
  return {
    typicalKg,
    percent,
    direction: "below",
    typicalLabel,
    percentLine: `Your estimate is about ${percent}% below that typical year.`,
  };
}

/** Action savings ÷ this model's typical U.S. lifestyle year. Same scope as the survey. */
export function shareOfTypicalYear(savedKg: number): { typicalKg: number; percent: number; label: string } {
  const typicalKg = typicalUsLifestyleKg();
  if (!Number.isFinite(savedKg) || savedKg <= 0 || typicalKg <= 0) {
    return {
      typicalKg,
      percent: 0,
      label: "This change does not currently move a comparable average person's year.",
    };
  }
  const raw = (savedKg / typicalKg) * 100;
  const percent = raw >= 10 ? Math.round(raw) : Math.round(raw * 10) / 10;
  const shown = percent < 0.1 ? "<0.1" : String(percent);
  return {
    typicalKg,
    percent,
    label: `About ${shown}% of a comparable average person's annual emissions.`,
  };
}
