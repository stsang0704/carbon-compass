import type { RecId } from "../data/recommendations";
import { calculate } from "./calculate";
import type { Answers } from "./types";

/** Personal reflection only. These choices never enter calculate(). */
export type ReflectionChoice = "not-yet" | "trying" | "habit";

export const reflectionOptions: { id: ReflectionChoice; label: string }[] = [
  { id: "not-yet", label: "Not yet, but I'd like to." },
  { id: "trying", label: "Yes, I'm giving it a try!" },
  { id: "habit", label: "Yes, it's become a regular habit." },
];

export type CheckInSnapshot = {
  month: string;
  answers: Answers;
  carbonKg: number;
  selectedRecIds: RecId[];
  reflections: Partial<Record<RecId, ReflectionChoice>>;
};

export type ChangeDirection = "decrease" | "increase" | "same" | "unavailable";

export function cloneAnswers(answers: Answers): Answers {
  return JSON.parse(JSON.stringify(answers)) as Answers;
}

/** Annual carbon from lifestyle answers, using the same calculate() as the rest of the app. */
export function footprintKg(answers: Answers): number {
  return calculate(answers).totals.carbon;
}

export function percentChange(fromKg: number, toKg: number): number | null {
  if (!Number.isFinite(fromKg) || !Number.isFinite(toKg) || fromKg <= 0) return null;
  return ((toKg - fromKg) / fromKg) * 100;
}

export function describePercent(percent: number | null): { direction: ChangeDirection; label: string } {
  if (percent === null || !Number.isFinite(percent)) {
    return {
      direction: "unavailable",
      label: "A percentage needs a starting footprint above zero.",
    };
  }
  const rounded = Math.round(Math.abs(percent) * 10) / 10;
  if (rounded === 0) return { direction: "same", label: "No change" };
  const shown = rounded >= 10 ? String(Math.round(Math.abs(percent))) : rounded.toFixed(1);
  if (percent < 0) return { direction: "decrease", label: `${shown}% decrease` };
  return { direction: "increase", label: `${shown}% increase` };
}

export function footprintComparison(fromKg: number, toKg: number, fromLabel: string): string {
  const change = describePercent(percentChange(fromKg, toKg));
  if (change.direction === "unavailable") return change.label;
  if (change.direction === "same") return `About the same as ${fromLabel}.`;
  const delta = Math.abs(Math.round(toKg - fromKg)).toLocaleString("en-US");
  const direction = change.direction === "decrease" ? "lower" : "higher";
  return `About ${delta} kg CO₂e ${direction} than ${fromLabel}. ${change.label}.`;
}

/** One snapshot per month. A later save for that month replaces it. */
export function upsertCheckIn(existing: CheckInSnapshot[] | undefined, next: CheckInSnapshot): CheckInSnapshot[] {
  const list = [...(existing ?? [])];
  const index = list.findIndex((item) => item.month === next.month);
  if (index >= 0) list[index] = next;
  else list.push(next);
  return list.sort((left, right) => left.month.localeCompare(right.month));
}

export function checkInForMonth(checkIns: CheckInSnapshot[] | undefined, month: string): CheckInSnapshot | null {
  return (checkIns ?? []).find((item) => item.month === month) ?? null;
}

export function latestCheckIn(checkIns: CheckInSnapshot[] | undefined): CheckInSnapshot | null {
  return [...(checkIns ?? [])].sort((left, right) => left.month.localeCompare(right.month)).at(-1) ?? null;
}

/** The snapshot from an earlier month. A snapshot already stored for `month` is not the previous one. */
export function previousCheckIn(checkIns: CheckInSnapshot[] | undefined, month: string): CheckInSnapshot | null {
  return (
    [...(checkIns ?? [])]
      .filter((item) => item.month < month)
      .sort((left, right) => left.month.localeCompare(right.month))
      .at(-1) ?? null
  );
}

export function answersForCheckIn(baseline: Answers, checkIns: CheckInSnapshot[] | undefined, month: string): Answers {
  const current = checkInForMonth(checkIns, month);
  if (current) return cloneAnswers(current.answers);
  const latest = latestCheckIn(checkIns);
  if (latest) return cloneAnswers(latest.answers);
  return cloneAnswers(baseline);
}

export function buildSnapshot(input: {
  month: string;
  answers: Answers;
  selectedRecIds: readonly RecId[];
  reflections: Partial<Record<RecId, ReflectionChoice>>;
}): CheckInSnapshot {
  const answers = cloneAnswers(input.answers);
  const selectedRecIds = [...input.selectedRecIds];
  const reflections: Partial<Record<RecId, ReflectionChoice>> = {};
  for (const id of selectedRecIds) {
    const choice = input.reflections[id];
    if (choice) reflections[id] = choice;
  }
  return {
    month: input.month,
    answers,
    carbonKg: footprintKg(answers),
    selectedRecIds,
    reflections,
  };
}

export function compareDirection(fromKg: number, toKg: number): ChangeDirection {
  const described = describePercent(percentChange(fromKg, toKg));
  if (described.direction !== "unavailable") return described.direction;
  if (!Number.isFinite(fromKg) || !Number.isFinite(toKg) || Math.abs(toKg - fromKg) < 0.5) return "same";
  return toKg > fromKg ? "increase" : "decrease";
}

export function effortMessage(direction: ChangeDirection): string {
  if (direction === "decrease") {
    return "Your efforts are adding up! Small changes can make a meaningful difference.";
  }
  if (direction === "increase") {
    return "There's always room to grow. Every month is another opportunity to try something different.";
  }
  return "Every step counts. Change takes time, and there's always something new to explore.";
}

/** Share of the longer bar, from 0 to 100. Both bars use the same maximum. */
export function barShare(valueKg: number, maxKg: number): number {
  if (!Number.isFinite(valueKg) || !Number.isFinite(maxKg) || maxKg <= 0 || valueKg <= 0) return 0;
  return Math.min(100, (valueKg / maxKg) * 100);
}

export type ProgressPoint = {
  month: string;
  carbonKg: number;
  kind: "baseline" | "check-in";
};

export type SurveyProgress = {
  originalKg: number;
  currentKg: number;
  percent: number | null;
  points: ProgressPoint[];
};

/** Progress comes from saved survey answers. Selected changes are not applied. */
export function surveyProgress(
  baseline: Answers,
  checkIns: CheckInSnapshot[] | undefined,
  baselineMonth?: string | null,
): SurveyProgress {
  const originalKg = footprintKg(baseline);
  const checkInsInOrder = [...(checkIns ?? [])]
    .sort((left, right) => left.month.localeCompare(right.month))
    .map((item) => ({ month: item.month, carbonKg: footprintKg(item.answers), kind: "check-in" as const }));
  const points: ProgressPoint[] = [
    { month: baselineMonth && /^\d{4}-\d{2}$/.test(baselineMonth) ? baselineMonth : "", carbonKg: originalKg, kind: "baseline" },
    ...checkInsInOrder,
  ];
  const currentKg = checkInsInOrder.length > 0 ? checkInsInOrder[checkInsInOrder.length - 1].carbonKg : originalKg;
  return {
    originalKg,
    currentKg,
    percent: percentChange(originalKg, currentKg),
    points,
  };
}
