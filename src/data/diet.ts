import type { DietCategory, DietShare } from "../model/types";

export const dietCategories: {
  id: DietCategory;
  label: string;
  shortLabel: string;
  color: string;
}[] = [
  { id: "plant", label: "Vegetables / plant-based foods", shortLabel: "plants", color: "#3f8f6b" },
  { id: "chickenPork", label: "Chicken / pork", shortLabel: "chicken/pork", color: "#c4924a" },
  { id: "fish", label: "Fish / seafood", shortLabel: "fish", color: "#5d8f9a" },
  { id: "beef", label: "Beef / lamb", shortLabel: "beef/lamb", color: "#c17b62" },
];

export const emptyDietShare: DietShare = {
  plant: 0,
  chickenPork: 0,
  fish: 0,
  beef: 0,
};

export const typicalDietShare: DietShare = {
  plant: 50,
  chickenPork: 25,
  fish: 15,
  beef: 10,
};

export function dietSum(share: DietShare): number {
  return share.plant + share.chickenPork + share.fish + share.beef;
}

export function dietIsComplete(share: DietShare): boolean {
  return Math.abs(dietSum(share) - 100) < 0.05;
}

export function isDietShare(value: unknown): value is DietShare {
  if (!value || typeof value !== "object") return false;
  const share = value as DietShare;
  return (["plant", "chickenPork", "fish", "beef"] as const).every(
    (key) => typeof share[key] === "number" && Number.isFinite(share[key]) && share[key] >= 0,
  );
}

export function sanitizeDietShare(value: unknown): DietShare {
  if (!isDietShare(value)) return { ...emptyDietShare };
  return {
    plant: clampShare(value.plant),
    chickenPork: clampShare(value.chickenPork),
    fish: clampShare(value.fish),
    beef: clampShare(value.beef),
  };
}

export function resolvedDiet(share: DietShare): DietShare {
  const clean = sanitizeDietShare(share);
  const sum = dietSum(clean);
  if (sum <= 0) return { ...typicalDietShare };
  if (Math.abs(sum - 100) < 0.5) return clean;
  return {
    plant: (clean.plant / sum) * 100,
    chickenPork: (clean.chickenPork / sum) * 100,
    fish: (clean.fish / sum) * 100,
    beef: (clean.beef / sum) * 100,
  };
}

export function shiftDietPoints(
  share: DietShare,
  from: DietCategory,
  to: DietCategory,
  points: number,
): DietShare {
  const next = { ...resolvedDiet(share) };
  const take = Math.min(next[from], Math.max(0, points));
  next[from] -= take;
  next[to] += take;
  return roundDiet(next);
}

export function shiftTowardPlants(share: DietShare, points: number): DietShare {
  const next = { ...resolvedDiet(share) };
  let need = Math.max(0, points);
  for (const key of ["beef", "chickenPork", "fish"] as const) {
    const take = Math.min(next[key], need);
    next[key] -= take;
    next.plant += take;
    need -= take;
  }
  return roundDiet(next);
}

export function formatDietShare(share: DietShare): string {
  const clean = sanitizeDietShare(share);
  if (dietSum(clean) <= 0) return "Enter a mix that adds to 100%";
  return dietCategories
    .filter((category) => clean[category.id] > 0)
    .map((category) => `${plainPercent(clean[category.id])}% ${category.shortLabel}`)
    .join(" · ");
}

export function dietFromMeatDiet(value: unknown): DietShare {
  if (value === "none" || (typeof value === "number" && Number.isFinite(value) && value <= 0)) {
    return { plant: 100, chickenPork: 0, fish: 0, beef: 0 };
  }
  if (value === "fish") return { plant: 40, chickenPork: 0, fish: 60, beef: 0 };
  if (value === "chickenPork") return { plant: 40, chickenPork: 60, fish: 0, beef: 0 };
  if (value === "beef") return { plant: 30, chickenPork: 20, fish: 0, beef: 50 };
  return { ...typicalDietShare };
}

export function dietRemainder(share: DietShare): number {
  return 100 - dietSum(share);
}

function roundDiet(share: DietShare): DietShare {
  const rounded: DietShare = {
    plant: Math.round(share.plant),
    chickenPork: Math.round(share.chickenPork),
    fish: Math.round(share.fish),
    beef: Math.round(share.beef),
  };
  rounded.plant += 100 - dietSum(rounded);
  return rounded;
}

function clampShare(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function plainPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}
