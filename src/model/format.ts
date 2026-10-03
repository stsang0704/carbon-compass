import { published } from "../data/factors";
import type { Impacts, Metric } from "./types";

export function formatCarbon(kg: number): { value: string; unit: string } {
  return signed(kg, (abs) => {
    if (abs >= 1000) {
      const tonnes = abs / 1000;
      const digits = tonnes >= 10 ? 0 : 1;
      return { value: tonnes.toFixed(digits), unit: "t" };
    }
    return { value: Math.round(abs).toLocaleString("en-US"), unit: "kg" };
  });
}

export function formatWater(liters: number): { value: string; unit: string } {
  return signed(liters, (abs) => {
    if (abs >= 1_000_000) {
      const millions = abs / 1_000_000;
      const digits = millions >= 10 ? 0 : 1;
      return { value: millions.toFixed(digits), unit: "million L" };
    }
    return { value: Math.round(abs).toLocaleString("en-US"), unit: "L" };
  });
}

export function formatEnergy(kwh: number): { value: string; unit: string } {
  return signed(kwh, (abs) => ({
    value: Math.round(abs).toLocaleString("en-US"),
    unit: "kWh",
  }));
}

export function formatMetric(metric: Metric, amount: number): { value: string; unit: string } {
  if (metric === "carbon") return formatCarbon(amount);
  if (metric === "water") return formatWater(amount);
  return formatEnergy(amount);
}

/** Annual CO2e as miles in a typical gasoline passenger vehicle. Never invents a factor. */
export function drivingMilesFromCarbon(carbonKg: number): number {
  if (!Number.isFinite(carbonKg) || carbonKg <= 0) return 0;
  return carbonKg / published.vehicleKgCo2ePerMile;
}

export function formatDrivingMiles(carbonKg: number): string {
  return Math.round(drivingMilesFromCarbon(carbonKg)).toLocaleString("en-US");
}

export function carsFromCarbon(carbonKg: number): number {
  if (!Number.isFinite(carbonKg) || carbonKg <= 0) return 0;
  return carbonKg / published.vehicleKgCo2ePerYear;
}

export function formatCarCount(carbonKg: number): string {
  const cars = carsFromCarbon(carbonKg);
  if (cars <= 0) return "0";
  if (cars < 10) {
    const tenths = Math.round(cars * 10) / 10;
    return tenths % 1 === 0 ? String(tenths) : tenths.toFixed(1);
  }
  return Math.round(cars).toLocaleString("en-US");
}

export function carHeading(carbonKg: number): string {
  return `≈ ${formatCarCount(carbonKg)} ${carNoun(carbonKg)}`;
}

export function carEquivalenceLine(carbonKg: number): string {
  const label = formatCarCount(carbonKg);
  const noun = roundedCars(carbonKg) === 1 ? "typical gasoline car" : "typical gasoline cars";
  return `That's comparable to the annual emissions of ${label} ${noun}.`;
}

function roundedCars(carbonKg: number): number {
  const cars = carsFromCarbon(carbonKg);
  if (cars < 10) return Math.round(cars * 10) / 10;
  return Math.round(cars);
}

function carNoun(carbonKg: number): string {
  return roundedCars(carbonKg) === 1 ? "gasoline car" : "gasoline cars";
}

export function formatCarbonPerYear(carbonKg: number): string {
  const parts = formatCarbon(carbonKg);
  return `${parts.value} ${parts.unit} CO₂e / year`;
}

export function gallonsFromCarbon(carbonKg: number): number {
  if (!Number.isFinite(carbonKg) || carbonKg <= 0) return 0;
  return carbonKg / published.gasolineKgCo2PerGallon;
}

export function formatGasolineGallons(carbonKg: number): string {
  return Math.round(gallonsFromCarbon(carbonKg)).toLocaleString("en-US");
}

/** Saved CO2e as urban trees using the published annual sequestration factor. */
export function treesFromCarbonSaved(savedKg: number): number {
  if (!Number.isFinite(savedKg) || savedKg <= 0) return 0;
  return savedKg / published.urbanTreeKgCo2ePerYear;
}

export function formatTreeCount(savedKg: number): string {
  const trees = treesFromCarbonSaved(savedKg);
  if (trees < 1) return "";
  return Math.round(trees).toLocaleString("en-US");
}

export function treeHeading(savedKg: number): string {
  const label = formatTreeCount(savedKg);
  if (!label) return "";
  return `≈ ${label} ${label === "1" ? "tree" : "trees"}`;
}

export function treeEquivalenceLine(savedKg: number): string {
  const trees = treesFromCarbonSaved(savedKg);
  if (trees < 1) return "";
  const count = Math.round(trees);
  if (count === 1) {
    return "Your changes could avoid as much CO₂ as approximately 1 tree absorbs in a year.";
  }
  return `Your changes could avoid as much CO₂ as approximately ${count.toLocaleString("en-US")} trees absorb in a year.`;
}

export function canShowTrees(savedKg: number): boolean {
  return treesFromCarbonSaved(savedKg) >= 1;
}

export function avoidedMilesHeading(savedKg: number): string {
  if (!Number.isFinite(savedKg) || savedKg <= 0) return "";
  return `≈ ${formatDrivingMiles(savedKg)} miles`;
}

export function avoidedMilesLine(): string {
  return "Your changes could avoid roughly the same amount of CO₂ as driving a typical gasoline car this distance.";
}

export function formatCarbonSaved(savedKg: number): string {
  if (!Number.isFinite(savedKg) || savedKg <= 0) return "";
  return `${Math.round(savedKg).toLocaleString("en-US")} kg CO₂e saved`;
}

export type SavedEquivalence =
  | { kind: "trees"; heading: string; unit: string; line: string }
  | { kind: "miles"; heading: string; unit: string; line: string }
  | { kind: "none"; heading: string; unit: string; line: string };

/** Pick a readable unit from the actual saving. Never invents a larger number. */
export function savedEquivalence(savedKg: number): SavedEquivalence {
  if (!Number.isFinite(savedKg) || savedKg <= 0) {
    return { kind: "none", heading: "", unit: "", line: "" };
  }
  if (canShowTrees(savedKg)) {
    return { kind: "trees", heading: treeHeading(savedKg), unit: "", line: treeEquivalenceLine(savedKg) };
  }
  return {
    kind: "miles",
    heading: avoidedMilesHeading(savedKg),
    unit: "of driving avoided",
    line: avoidedMilesLine(),
  };
}

export function carbonShift(baselineKg: number, scenarioKg: number): {
  percent: number;
  direction: "less" | "more" | "same";
} {
  if (baselineKg <= 0) return { percent: 0, direction: "same" };
  const ratio = (baselineKg - scenarioKg) / baselineKg;
  const percent = Math.round(Math.abs(ratio) * 100);
  if (percent === 0) return { percent: 0, direction: "same" };
  return { percent, direction: ratio > 0 ? "less" : "more" };
}

export function changePhrase(metric: Metric, amount: number): string {
  const abs = Math.abs(amount);
  if (abs < negligible(metric)) {
    if (metric === "carbon") return "no carbon change";
    if (metric === "water") return "no water change";
    return "no energy change";
  }
  const parts = formatMetric(metric, abs);
  const direction = amount < 0 ? "less" : "more";
  const noun = metric === "carbon" ? "CO2e" : metric === "water" ? "water" : "energy";
  return `about ${parts.value} ${parts.unit} ${direction} ${noun}`;
}

export function carbonPhrase(amount: number): string {
  return changePhrase("carbon", amount);
}

export function countPhrase(count: number, singular: string, plural = `${singular}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? singular : plural}`;
}

export function plainNumber(amount: number, digits = 2): string {
  return amount.toLocaleString("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

export function emptyImpacts(): Impacts {
  return { carbon: 0, water: 0, energy: 0 };
}

export function addImpacts(left: Impacts, right: Impacts): Impacts {
  return {
    carbon: left.carbon + right.carbon,
    water: left.water + right.water,
    energy: left.energy + right.energy,
  };
}

export function subtractImpacts(scenario: Impacts, baseline: Impacts): Impacts {
  return {
    carbon: scenario.carbon - baseline.carbon,
    water: scenario.water - baseline.water,
    energy: scenario.energy - baseline.energy,
  };
}

function signed(
  amount: number,
  formatAbs: (abs: number) => { value: string; unit: string },
): { value: string; unit: string } {
  const parts = formatAbs(Math.abs(amount));
  if (Object.is(amount, -0) || amount < 0) {
    return { value: `-${parts.value}`, unit: parts.unit };
  }
  return parts;
}

function negligible(metric: Metric): number {
  if (metric === "carbon") return 0.5;
  if (metric === "water") return 1;
  return 0.5;
}
