export type Category = "food" | "travel" | "home" | "stuff";

export type Metric = "carbon" | "water" | "energy";

export type Confidence = "high" | "medium" | "low";

export type WaterKind = "virtual" | "none";

export type EnergyKind = "site" | "embodied" | "fuel" | "derived" | "none";

export type Waste = "rarely" | "sometimes" | "often";

export type HomeSize = "apartment" | "small" | "larger";

export type HeatSource = "gas" | "resistance" | "heatPump" | "unknown";

export type HeatingHabit = "warmer" | "typical" | "cooler";

export type HabitId =
  | "meatMealsPerWeek"
  | "foodWaste"
  | "milesPerWeek"
  | "flightsPerYear"
  | "homeSize"
  | "heatSource"
  | "heatingHabit"
  | "clothesPerSeason"
  | "ordersPerMonth";

export type Answers = {
  meatMealsPerWeek: number;
  foodWaste: Waste;
  milesPerWeek: number;
  flightsPerYear: number;
  homeSize: HomeSize;
  heatSource: HeatSource;
  heatingHabit: HeatingHabit;
  clothesPerSeason: number;
  ordersPerMonth: number;
};

export type Impacts = {
  carbon: number;
  water: number;
  energy: number;
};

export type ImpactLine = {
  id: string;
  habitIds: HabitId[];
  category: Category;
  title: string;
  carbon: number;
  water: number;
  energy: number;
  waterKind: WaterKind;
  energyKind: EnergyKind;
  steps: string[];
  factorIds: string[];
};

export type Footprint = {
  lines: ImpactLine[];
  totals: Impacts;
  byCategory: Record<Category, Impacts>;
};

export type Factor = {
  id: string;
  name: string;
  valueLabel: string;
  source: string;
  year: string;
  url: string;
  region: string;
  includes: string;
  excludes: string;
  confidence: Confidence;
};

export type Depth = "close" | "ease" | "further";

export const categories: { id: Category; label: string; bearing: string }[] = [
  { id: "food", label: "Food", bearing: "N" },
  { id: "travel", label: "Travel", bearing: "E" },
  { id: "home", label: "Home", bearing: "S" },
  { id: "stuff", label: "Stuff", bearing: "W" },
];

export const habitOrder: HabitId[] = [
  "meatMealsPerWeek",
  "foodWaste",
  "milesPerWeek",
  "flightsPerYear",
  "homeSize",
  "heatSource",
  "heatingHabit",
  "clothesPerSeason",
  "ordersPerMonth",
];

export const AVERAGES_NOTE =
  "These are averages for a typical case, not a personal audit.";

export const ENERGY_MIX_NOTE =
  "The energy total mixes electricity, fuel, and rough embodied energy. Open a row to see which is which.";
