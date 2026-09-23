import { withOverrides } from "../data/habits";
import type { Answers, HabitId } from "../model/types";
import { habitOrder } from "../model/types";

export type Profile = {
  baseline: Answers;
  overrides: Partial<Answers>;
};

const KEY = "carbon-compass-profile";

export function loadProfile(): Profile | null {
  const storage = browserStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Profile;
    const profile = migrateProfile(parsed);
    if (!profile) return null;
    if (JSON.stringify(profile) !== JSON.stringify(parsed)) saveProfile(profile);
    return profile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: Profile) {
  browserStorage()?.setItem(KEY, JSON.stringify(profile));
}

export function clearProfile() {
  browserStorage()?.removeItem(KEY);
}

export function scenarioOf(profile: Profile): Answers {
  return withOverrides(profile.baseline, profile.overrides);
}

export function setHabitOverride<K extends HabitId>(
  profile: Profile,
  id: K,
  value: Answers[K],
): Profile {
  const overrides: Partial<Answers> = { ...profile.overrides };
  if (value === profile.baseline[id]) delete overrides[id];
  else overrides[id] = value;
  return { ...profile, overrides };
}

function browserStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

function isAnswers(value: unknown): value is Answers {
  if (!value || typeof value !== "object") return false;
  const answers = value as Answers;
  return habitOrder.every((id) => validField(id, answers[id]));
}

function isPartialAnswers(value: unknown): value is Partial<Answers> {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).every(([key, field]) =>
    habitOrder.includes(key as HabitId) ? validField(key as HabitId, field) : false,
  );
}

function migrateProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { baseline?: unknown; overrides?: unknown };
  const baseline = asRecord(raw.baseline);
  const overrides = asRecord(raw.overrides);
  if (!baseline || !overrides) return null;
  foldMeat(baseline, overrides);
  delete baseline.beefMealsPerWeek;
  delete baseline.otherMeatMealsPerWeek;
  delete overrides.beefMealsPerWeek;
  delete overrides.otherMeatMealsPerWeek;
  if (!isAnswers(baseline) || !isPartialAnswers(overrides)) return null;
  return { baseline, overrides: overrides as Partial<Answers> };
}

function foldMeat(baseline: Record<string, unknown>, overrides: Record<string, unknown>) {
  const hasOld =
    "beefMealsPerWeek" in baseline ||
    "otherMeatMealsPerWeek" in baseline ||
    "beefMealsPerWeek" in overrides ||
    "otherMeatMealsPerWeek" in overrides;
  if (!hasOld || typeof baseline.meatMealsPerWeek === "number") return;
  const baseBeef = count(baseline.beefMealsPerWeek);
  const baseOther = count(baseline.otherMeatMealsPerWeek);
  const scenarioBeef = "beefMealsPerWeek" in overrides ? count(overrides.beefMealsPerWeek) : baseBeef;
  const scenarioOther =
    "otherMeatMealsPerWeek" in overrides ? count(overrides.otherMeatMealsPerWeek) : baseOther;
  const baseMeat = capMeals(baseBeef + baseOther);
  const scenarioMeat = capMeals(scenarioBeef + scenarioOther);
  baseline.meatMealsPerWeek = baseMeat;
  if (scenarioMeat === baseMeat) delete overrides.meatMealsPerWeek;
  else overrides.meatMealsPerWeek = scenarioMeat;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return { ...(value as Record<string, unknown>) };
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function capMeals(value: number): number {
  return Math.min(21, Math.max(0, value));
}

function validField(id: HabitId, value: unknown): boolean {
  switch (id) {
    case "meatMealsPerWeek":
      return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 21;
    case "milesPerWeek":
    case "flightsPerYear":
    case "clothesPerSeason":
    case "ordersPerMonth":
      return typeof value === "number" && Number.isFinite(value) && value >= 0;
    case "foodWaste":
      return value === "rarely" || value === "sometimes" || value === "often";
    case "homeSize":
      return value === "apartment" || value === "small" || value === "larger";
    case "heatSource":
      return value === "gas" || value === "resistance" || value === "heatPump" || value === "unknown";
    case "heatingHabit":
      return value === "warmer" || value === "typical" || value === "cooler";
    default:
      return false;
  }
}
