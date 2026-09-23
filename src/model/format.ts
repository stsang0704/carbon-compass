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
