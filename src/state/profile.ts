import { dietFromMeatDiet, isDietShare } from "../data/diet";
import { assumptions } from "../data/factors";
import { sameAnswer, withOverrides } from "../data/habits";
import { isRecId, type RecId } from "../data/recommendations";
import type { Answers, HabitId, HeatSource } from "../model/types";
import { habitOrder } from "../model/types";

export type Profile = {
  baseline: Answers;
  overrides: Partial<Answers>;
  selectedRecIds: RecId[];
};

const KEY = "carbon-compass-profile";

const meatDiets = ["none", "fish", "chickenPork", "mix", "beef"] as const;

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
  if (sameAnswer(value, profile.baseline[id])) delete overrides[id];
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
  if (!habitOrder.every((id) => validField(id, answers[id]))) return false;
  if (!validHeat(answers.heatSource)) return false;
  if (!validOptionalNumber(answers.showerMinutes)) return false;
  if (!validFactor(answers.insulationFactor, 1)) return false;
  return validShare(answers.secondhandShare);
}

function isPartialAnswers(value: unknown): value is Partial<Answers> {
  if (!value || typeof value !== "object") return false;
  return Object.entries(value).every(([key, field]) => {
    if (key === "heatSource") return validHeat(field);
    if (key === "showerMinutes") return validOptionalNumber(field);
    if (key === "insulationFactor") return validFactor(field, 1);
    if (key === "secondhandShare") return validShare(field);
    return habitOrder.includes(key as HabitId) ? validField(key as HabitId, field) : false;
  });
}

function migrateProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { baseline?: unknown; overrides?: unknown };
  const baseline = asRecord(raw.baseline);
  const overrides = asRecord(raw.overrides);
  if (!baseline || !overrides) return null;
  foldMeat(baseline, overrides);
  migrateDietShare(baseline, overrides);
  migrateHome(baseline, overrides);
  migrateWinter(baseline, overrides);
  if (!validHeat(baseline.heatSource)) baseline.heatSource = "gas";
  if ("heatSource" in overrides && !validHeat(overrides.heatSource)) delete overrides.heatSource;
  if (!validOptionalNumber(baseline.showerMinutes)) baseline.showerMinutes = null;
  if (!validFactor(baseline.insulationFactor, 1)) baseline.insulationFactor = 1;
  if (!validShare(baseline.secondhandShare)) baseline.secondhandShare = 0;
  delete baseline.meatMealsPerWeek;
  delete baseline.meatDiet;
  delete baseline.homeSize;
  delete baseline.heatingHabit;
  delete baseline.beefMealsPerWeek;
  delete baseline.otherMeatMealsPerWeek;
  delete overrides.meatMealsPerWeek;
  delete overrides.meatDiet;
  delete overrides.homeSize;
  delete overrides.heatingHabit;
  delete overrides.beefMealsPerWeek;
  delete overrides.otherMeatMealsPerWeek;
  if (!isAnswers(baseline) || !isPartialAnswers(overrides)) return null;
  const selectedRecIds = readRecIds(value);
  return { baseline, overrides: overrides as Partial<Answers>, selectedRecIds };
}

function foldMeat(baseline: Record<string, unknown>, overrides: Record<string, unknown>) {
  const hasOld =
    "beefMealsPerWeek" in baseline ||
    "otherMeatMealsPerWeek" in baseline ||
    "beefMealsPerWeek" in overrides ||
    "otherMeatMealsPerWeek" in overrides;
  if (!hasOld || typeof baseline.meatMealsPerWeek === "number" || meatDiets.includes(baseline.meatDiet as (typeof meatDiets)[number])) {
    return;
  }
  const baseBeef = count(baseline.beefMealsPerWeek);
  const baseOther = count(baseline.otherMeatMealsPerWeek);
  const scenarioBeef = "beefMealsPerWeek" in overrides ? count(overrides.beefMealsPerWeek) : baseBeef;
  const scenarioOther =
    "otherMeatMealsPerWeek" in overrides ? count(overrides.otherMeatMealsPerWeek) : baseOther;
  baseline.meatMealsPerWeek = baseBeef + baseOther;
  if (scenarioBeef + scenarioOther !== baseBeef + baseOther) {
    overrides.meatMealsPerWeek = scenarioBeef + scenarioOther;
  }
}

function migrateDietShare(baseline: Record<string, unknown>, overrides: Record<string, unknown>) {
  if (!isDietShare(baseline.dietShare)) {
    baseline.dietShare = dietFromMeatDiet(baseline.meatDiet ?? baseline.meatMealsPerWeek);
  }
  const overrideSource =
    "dietShare" in overrides
      ? overrides.dietShare
      : "meatDiet" in overrides || "meatMealsPerWeek" in overrides
        ? overrides.meatDiet ?? overrides.meatMealsPerWeek
        : undefined;
  if (overrideSource !== undefined) {
    const next = isDietShare(overrideSource) ? overrideSource : dietFromMeatDiet(overrideSource);
    if (sameAnswer(next, baseline.dietShare)) delete overrides.dietShare;
    else overrides.dietShare = next;
  }
}

function migrateHome(baseline: Record<string, unknown>, overrides: Record<string, unknown>) {
  if (typeof baseline.homeType !== "string") {
    baseline.homeType = homeLabel(baseline.homeSize);
  }
  if ("homeType" in overrides && typeof overrides.homeType !== "string") {
    overrides.homeType = homeLabel(overrides.homeSize);
  } else if (!("homeType" in overrides) && "homeSize" in overrides) {
    overrides.homeType = homeLabel(overrides.homeSize);
  }
}

function migrateWinter(baseline: Record<string, unknown>, overrides: Record<string, unknown>) {
  if (!validTemp(baseline.winterTempF)) {
    baseline.winterTempF = tempFromHabit(baseline.heatingHabit);
  }
  if ("winterTempF" in overrides && !validTemp(overrides.winterTempF)) {
    overrides.winterTempF = tempFromHabit(overrides.heatingHabit);
  } else if (!("winterTempF" in overrides) && "heatingHabit" in overrides) {
    const next = tempFromHabit(overrides.heatingHabit);
    if (next === baseline.winterTempF) delete overrides.winterTempF;
    else overrides.winterTempF = next;
  }
}

function homeLabel(value: unknown): string {
  if (value === "apartment") return "Apartment";
  if (value === "larger") return "Larger house";
  if (value === "small") return "Small house";
  return "";
}

function tempFromHabit(value: unknown): number {
  if (value === "warmer") return assumptions.typicalWinterF + assumptions.thermostatDegrees;
  if (value === "cooler") return assumptions.typicalWinterF - assumptions.thermostatDegrees;
  return assumptions.typicalWinterF;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return { ...(value as Record<string, unknown>) };
}

function count(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function validTemp(value: unknown): value is number | null {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

function validHeat(value: unknown): value is HeatSource {
  return value === "gas" || value === "resistance" || value === "heatPump" || value === "unknown";
}

function validFactor(value: unknown, fallbackHigh: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 && value <= fallbackHigh;
}

function validShare(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1;
}

function validOptionalNumber(value: unknown): boolean {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

function validField(id: HabitId, value: unknown): boolean {
  switch (id) {
    case "dietShare":
      return isDietShare(value);
    case "milesPerWeek":
    case "flightsPerYear":
    case "clothesPerSeason":
    case "ordersPerMonth":
    case "winterTempF":
      return validOptionalNumber(value);
    case "foodWaste":
      return value === "rarely" || value === "sometimes" || value === "often";
    case "homeType":
      return typeof value === "string";
    default:
      return false;
  }
}

function readRecIds(value: unknown): RecId[] {
  if (!value || typeof value !== "object") return [];
  const raw = (value as { selectedRecIds?: unknown }).selectedRecIds;
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRecId);
}
