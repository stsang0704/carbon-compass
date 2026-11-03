export type MonthRecord = {
  month: string;
  scenarioKg: number;
};

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string): string {
  const [year, part] = month.split("-");
  const date = new Date(Number(year), Number(part) - 1, 1);
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function upsertMonth(history: MonthRecord[] | undefined, scenarioKg: number, date = new Date()): MonthRecord[] {
  const month = monthKey(date);
  const next = [...(history ?? [])];
  const index = next.findIndex((item) => item.month === month);
  const record = { month, scenarioKg };
  if (index >= 0) next[index] = record;
  else next.push(record);
  return next.sort((left, right) => left.month.localeCompare(right.month));
}

export function previousRecord(history: MonthRecord[] | undefined, month = monthKey()): MonthRecord | null {
  const earlier = (history ?? []).filter((item) => item.month < month);
  return earlier.at(-1) ?? null;
}

export function monthCompare(currentKg: number, previous: MonthRecord | null): {
  kind: "first" | "less" | "more" | "same";
  kg: number;
  line: string;
} {
  if (!previous) {
    return {
      kind: "first",
      kg: 0,
      line: "This is your first month on record. Come back next month to see how things moved.",
    };
  }
  const delta = currentKg - previous.scenarioKg;
  const amount = Math.abs(Math.round(delta)).toLocaleString("en-US");
  if (Math.abs(delta) < 1) {
    return {
      kind: "same",
      kg: 0,
      line: `About the same as ${monthLabel(previous.month)}. Steady is still progress.`,
    };
  }
  if (delta < 0) {
    return {
      kind: "less",
      kg: Math.abs(delta),
      line: `About ${amount} kg CO₂e less than ${monthLabel(previous.month)}.`,
    };
  }
  return {
    kind: "more",
    kg: delta,
    line: `About ${amount} kg CO₂e more than ${monthLabel(previous.month)}. Progress is not a straight line.`,
  };
}
