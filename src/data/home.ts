import type { HomeSize } from "../model/types";

export const HOME_OTHER_VALUE = "Other";

const presetToSize: Record<string, HomeSize> = {
  apartment: "apartment",
  "small house": "small",
  "larger house": "larger",
};

/** Words that map a custom description onto the three heating-load sizes. */
const apartmentTerms = [
  "apartment",
  "apt",
  "flat",
  "condo",
  "condominium",
  "studio",
  "loft",
  "walk-up",
  "walkup",
  "high-rise",
  "highrise",
  "unit",
  "dorm",
  "dormitory",
  "residence hall",
  "res hall",
];

const largerTerms = [
  "mansion",
  "estate",
  "villa",
  "mc mansion",
  "mcmansion",
  "large house",
  "larger house",
  "big house",
  "huge house",
  "4 bed",
  "4-bed",
  "5 bed",
  "5-bed",
  "six bed",
];

const smallTerms = [
  "townhouse",
  "town house",
  "townhome",
  "town home",
  "duplex",
  "semi-detached",
  "semidetached",
  "cottage",
  "bungalow",
  "small house",
  "starter",
  "ranch",
  "split-level",
  "splitlevel",
  "single family",
  "sfh",
  "rowhouse",
  "row house",
  "terrace",
  "detached",
  "house",
  "home",
];

export function isHomePreset(value: string): boolean {
  return value === "Apartment" || value === "Small house" || value === "Larger house";
}

export function isHomeOtherSelection(value: string): boolean {
  const text = value.trim();
  return text !== "" && !isHomePreset(text);
}

export function homeLabel(size: HomeSize): string {
  if (size === "apartment") return "Apartment";
  if (size === "small") return "Small house";
  return "Larger house";
}

/**
 * Interpret a housing description, then map it to one of the three
 * established heating-load sizes. Never invents a carbon number.
 */
export function classifyHome(text: string): HomeSize {
  const value = text.trim().toLowerCase();
  if (!value || value === "other") return "small";

  const preset = presetToSize[value];
  if (preset) return preset;

  if (hasTerm(value, apartmentTerms)) return "apartment";
  if (hasTerm(value, largerTerms)) return "larger";
  if (hasTerm(value, smallTerms)) return "small";
  return "small";
}

function hasTerm(value: string, terms: readonly string[]): boolean {
  return terms.some((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
    return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(value);
  });
}
