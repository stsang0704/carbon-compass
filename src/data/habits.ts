import { assumptions } from "./factors";
import {
  dietFromMeatDiet,
  emptyDietShare,
  formatDietShare,
  isDietShare,
  shiftTowardPlants,
  typicalDietShare,
} from "./diet";
import type { Answers, Category, DietShare, HabitId, OptionalNumber, Waste } from "../model/types";
import { habitOrder } from "../model/types";

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

export type ScaleMark = { value: number; label: string };

export type HabitControl =
  | { type: "diet" }
  | { type: "entry"; suffix: string }
  | { type: "text"; placeholder: string }
  | { type: "home" }
  | { type: "temperature" }
  | { type: "choice"; options: ChoiceOption<string>[] };

export type HabitMeta = {
  id: HabitId;
  category: Category;
  name: string;
  question: string;
  detail: string;
  why: string;
  control: HabitControl;
};

export const numericPlaceholder = "Input your value";

const wasteOptions: ChoiceOption<Waste>[] = [
  { value: "rarely", label: "Rarely", hint: "Almost everything gets eaten." },
  { value: "sometimes", label: "Sometimes", hint: "A container goes off now and then." },
  { value: "often", label: "Often", hint: "A noticeable share of food is tossed." },
];

export const homePresetOptions: ChoiceOption<string>[] = [
  { value: "Apartment", label: "Apartment", hint: "A smaller space, less to heat." },
  { value: "Small house", label: "Small house", hint: "A modest house or a large flat." },
  { value: "Larger house", label: "Larger house", hint: "More rooms, more winter fuel." },
];

export const habits: HabitMeta[] = [
  {
    id: "dietShare",
    category: "food",
    name: "Diet",
    question: "What does your diet usually consist of?",
    detail: "Split a typical week across these four groups. They should add up to 100% of what you eat.",
    why: "Beef and lamb land much higher than chicken, pork, fish, or plants. The mix you enter is weighted by those different factors, not treated as one kind of meat.",
    control: { type: "diet" },
  },
  {
    id: "foodWaste",
    category: "food",
    name: "Food tossed",
    question: "How often does food get thrown in the trash?",
    detail: "This only scales the diet above. Drinks and restaurant systems are not in the model.",
    why: "Food in the bin already took land, water, and energy to grow. Eating what you bought avoids producing that extra share.",
    control: { type: "choice", options: wasteOptions },
  },
  {
    id: "milesPerWeek",
    category: "travel",
    name: "Driving",
    question: "About how many miles do you drive in a week?",
    detail: "Your own car. Rides you take as a passenger can count if you want them in.",
    why: "A typical US gasoline car emits about 0.39 kg of CO2e every mile, almost all of it from the fuel. Fewer miles is a direct cut. An electric car is not in this version.",
    control: { type: "entry", suffix: "miles a week" },
  },
  {
    id: "flightsPerYear",
    category: "travel",
    name: "Flights",
    question: "How many round-trip flights do you take in a year?",
    detail: "Each one is treated as a typical US domestic round trip, about 1,000 miles each way.",
    why: "Moving one person a thousand miles each way is hundreds of kilograms of fuel. Skipping a trip you were unsure about is often the largest single travel change.",
    control: { type: "entry", suffix: "round trips a year" },
  },
  {
    id: "homeType",
    category: "home",
    name: "Home size",
    question: "What type of home do you live in?",
    detail: "Size stands in for how much heat the building needs. It is not your utility bill.",
    why: "A larger home usually takes more fuel through a winter. Moving is a big life change. It is here so you can see the scale, not as a suggestion to relocate.",
    control: { type: "home" },
  },
  {
    id: "winterTempF",
    category: "home",
    name: "Winter warmth",
    question: "In winter, how warm do you keep it?",
    detail: "Enter the temperature you usually keep in winter. You can use Celsius or Fahrenheit.",
    why: "A few degrees cooler is a sweater, not a new life. The estimate uses 3% of heating energy per degree Fahrenheit, the high end of a common 1–3% rule of thumb.",
    control: { type: "temperature" },
  },
  {
    id: "clothesPerSeason",
    category: "stuff",
    name: "New clothes",
    question: "How many new clothing items do you buy in a season?",
    detail: "A season is about three months. Shoes can count. Secondhand is outside this estimate.",
    why: "Most of a new garment's impact is in the fiber, before you wear it. Buying one fewer piece leaves the rest of the wardrobe alone.",
    control: { type: "entry", suffix: "new items a season" },
  },
  {
    id: "ordersPerMonth",
    category: "stuff",
    name: "Online orders",
    question: "How many online orders arrive in a month?",
    detail: "This is the trip the box takes, plus the delivery system. Not the product inside.",
    why: "Vans, hubs, and packaging have a cost even when the thing in the box is small. Combining two orders, or skipping one, is a modest cut.",
    control: { type: "entry", suffix: "orders a month" },
  },
];

export const starterAnswers: Answers = {
  dietShare: { ...typicalDietShare },
  foodWaste: "sometimes",
  milesPerWeek: assumptions.typicalMilesPerWeek,
  flightsPerYear: assumptions.typicalFlightsPerYear,
  homeType: "Small house",
  heatSource: "gas",
  winterTempF: assumptions.typicalWinterF,
  clothesPerSeason: assumptions.typicalClothesPerSeason,
  ordersPerMonth: assumptions.typicalOrdersPerMonth,
  showerMinutes: null,
  insulationFactor: 1,
  secondhandShare: 0,
};

export const blankAnswers: Answers = {
  dietShare: { ...emptyDietShare },
  foodWaste: "sometimes",
  milesPerWeek: null,
  flightsPerYear: null,
  homeType: "",
  heatSource: "gas",
  winterTempF: null,
  clothesPerSeason: null,
  ordersPerMonth: null,
  showerMinutes: null,
  insulationFactor: 1,
  secondhandShare: 0,
};

export function habitMeta(id: HabitId): HabitMeta {
  const habit = habits.find((item) => item.id === id);
  if (!habit) throw new Error(`Unknown habit ${id}`);
  return habit;
}

export function habitsIn(category: Category): HabitMeta[] {
  return habits.filter((habit) => habit.category === category);
}

export function formatAnswer(id: HabitId, value: Answers[HabitId]): string {
  switch (id) {
    case "dietShare":
      return formatDietShare(isDietShare(value) ? value : dietFromMeatDiet(value));
    case "foodWaste":
      return wasteOptions.find((option) => option.value === value)?.label ?? String(value);
    case "milesPerWeek":
      return formatOptionalNumber(
        value as OptionalNumber,
        assumptions.typicalMilesPerWeek,
        (amount) => (amount === 0 ? "No driving" : `${amount} miles a week`),
      );
    case "flightsPerYear":
      return formatOptionalNumber(
        value as OptionalNumber,
        assumptions.typicalFlightsPerYear,
        (amount) => (amount === 1 ? "1 round trip a year" : `${amount} round trips a year`),
      );
    case "homeType": {
      const text = String(value).trim();
      if (!text || text.toLowerCase() === "other") return "Typical home";
      return text;
    }
    case "winterTempF":
      return formatOptionalNumber(
        value as OptionalNumber,
        assumptions.typicalWinterF,
        (amount) => `${Math.round(amount)}°F / ${fahrenheitToCelsius(amount)}°C`,
      );
    case "clothesPerSeason":
      return formatOptionalNumber(
        value as OptionalNumber,
        assumptions.typicalClothesPerSeason,
        (amount) => `${amount} new items a season`,
      );
    case "ordersPerMonth":
      return formatOptionalNumber(
        value as OptionalNumber,
        assumptions.typicalOrdersPerMonth,
        (amount) => `${amount} orders a month`,
      );
  }
}

export function feel(id: HabitId, base: Answers[HabitId], next: Answers[HabitId]): string {
  if (sameAnswer(base, next)) return "This is what you do now.";
  switch (id) {
    case "dietShare":
      return "A different mix on the plate. Weekly meals stay the same count, with the carbon weighted by each food.";
    case "foodWaste":
      return "Less in the bin, same meals you meant to eat. Or the reverse, if you are testing that direction.";
    case "milesPerWeek":
      return mileFeel(resolvedNumber(base, assumptions.typicalMilesPerWeek), resolvedNumber(next, assumptions.typicalMilesPerWeek));
    case "flightsPerYear":
      return flightFeel(
        resolvedNumber(base, assumptions.typicalFlightsPerYear),
        resolvedNumber(next, assumptions.typicalFlightsPerYear),
      );
    case "homeType":
      return "A different kind of home. Useful for scale. Not a small weekly habit.";
    case "winterTempF":
      return resolvedNumber(next, assumptions.typicalWinterF) < resolvedNumber(base, assumptions.typicalWinterF)
        ? "A cooler winter setpoint. A sweater, the same rooms, the same winter."
        : "A warmer winter setpoint. Three percent of heating energy per degree is the step this estimate understands.";
    case "clothesPerSeason":
      return clothesFeel(
        resolvedNumber(base, assumptions.typicalClothesPerSeason),
        resolvedNumber(next, assumptions.typicalClothesPerSeason),
      );
    case "ordersPerMonth":
      return orderFeel(
        resolvedNumber(base, assumptions.typicalOrdersPerMonth),
        resolvedNumber(next, assumptions.typicalOrdersPerMonth),
      );
  }
}

export function easeValue<K extends HabitId>(id: K, value: Answers[K]): Answers[K] {
  switch (id) {
    case "flightsPerYear":
      return Math.max(0, resolvedNumber(value, assumptions.typicalFlightsPerYear) - 1) as Answers[K];
    case "clothesPerSeason":
      return Math.max(0, resolvedNumber(value, assumptions.typicalClothesPerSeason) - 1) as Answers[K];
    case "ordersPerMonth":
      return Math.max(0, resolvedNumber(value, assumptions.typicalOrdersPerMonth) - 1) as Answers[K];
    case "milesPerWeek":
      return scaleDown(resolvedNumber(value, assumptions.typicalMilesPerWeek), 0.8, 10) as Answers[K];
    case "foodWaste":
      return stepToward(value as Waste, ["often", "sometimes", "rarely"], 1) as Answers[K];
    case "dietShare":
      return shiftTowardPlants(asDietShare(value), 10) as Answers[K];
    case "homeType":
      return value;
    case "winterTempF":
      return (resolvedNumber(value, assumptions.typicalWinterF) - assumptions.thermostatDegrees) as Answers[K];
    default:
      return value;
  }
}

export function furtherValue<K extends HabitId>(id: K, value: Answers[K]): Answers[K] {
  switch (id) {
    case "clothesPerSeason":
      return Math.floor(resolvedNumber(value, assumptions.typicalClothesPerSeason) / 2) as Answers[K];
    case "ordersPerMonth":
      return Math.floor(resolvedNumber(value, assumptions.typicalOrdersPerMonth) / 2) as Answers[K];
    case "flightsPerYear":
      return Math.floor(resolvedNumber(value, assumptions.typicalFlightsPerYear) / 2) as Answers[K];
    case "milesPerWeek":
      return scaleDown(resolvedNumber(value, assumptions.typicalMilesPerWeek), 0.5, 10) as Answers[K];
    case "foodWaste":
      return "rarely" as Answers[K];
    case "dietShare":
      return shiftTowardPlants(asDietShare(value), 25) as Answers[K];
    case "homeType":
      return value;
    case "winterTempF":
      return Math.min(
        resolvedNumber(value, assumptions.typicalWinterF),
        assumptions.typicalWinterF - assumptions.thermostatDegrees,
      ) as Answers[K];
    default:
      return value;
  }
}

export function applyDepth(baseline: Answers, depth: "close" | "ease" | "further"): Answers {
  if (depth === "close") return { ...baseline };
  const next = { ...baseline };
  for (const id of habitOrder) {
    const current = baseline[id];
    const value = depth === "ease" ? easeValue(id, current) : furtherValue(id, current);
    assignAnswer(next, id, value);
  }
  return next;
}

export function overridesFor(baseline: Answers, scenario: Answers): Partial<Answers> {
  const overrides: Partial<Answers> = {};
  for (const id of habitOrder) {
    if (!sameAnswer(baseline[id], scenario[id])) assignAnswer(overrides, id, scenario[id]);
  }
  if (!sameAnswer(baseline.heatSource, scenario.heatSource)) overrides.heatSource = scenario.heatSource;
  if (!sameAnswer(baseline.showerMinutes, scenario.showerMinutes)) {
    overrides.showerMinutes = scenario.showerMinutes;
  }
  if (!sameAnswer(baseline.insulationFactor, scenario.insulationFactor)) {
    overrides.insulationFactor = scenario.insulationFactor;
  }
  if (!sameAnswer(baseline.secondhandShare, scenario.secondhandShare)) {
    overrides.secondhandShare = scenario.secondhandShare;
  }
  return overrides;
}

export function withOverrides(baseline: Answers, overrides: Partial<Answers>): Answers {
  return { ...baseline, ...overrides };
}

export function changedHabitIds(baseline: Answers, scenario: Answers): HabitId[] {
  return habitOrder.filter((id) => !sameAnswer(baseline[id], scenario[id]));
}

export function sameAnswer(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function resolvedNumber(value: unknown, typical: number): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return typical;
  return value;
}

export function fahrenheitToCelsius(tempF: number): number {
  return Math.round(((tempF - 32) * 5) / 9);
}

export function celsiusToFahrenheit(tempC: number): number {
  return (tempC * 9) / 5 + 32;
}

function formatOptionalNumber(
  value: OptionalNumber,
  typical: number,
  format: (amount: number) => string,
): string {
  if (value === null || value === undefined || (typeof value === "number" && !Number.isFinite(value))) {
    return `Typical · ${format(typical)}`;
  }
  return format(value);
}

function asDietShare(value: unknown): DietShare {
  return isDietShare(value) ? value : dietFromMeatDiet(value);
}

function assignAnswer<K extends HabitId>(target: Partial<Answers>, id: K, value: Answers[K]) {
  target[id] = value;
}

function scaleDown(value: number, fraction: number, step: number): number {
  if (value <= 0) return 0;
  const snapped = Math.round((value * fraction) / step) * step;
  if (snapped < value) return Math.max(0, snapped);
  return Math.max(0, value - step);
}

function stepToward<T extends string>(value: T, order: readonly T[], steps: number): T {
  const index = order.indexOf(value);
  const next = Math.min(order.length - 1, Math.max(0, (index < 0 ? 0 : index) + steps));
  return order[next];
}

function mileFeel(base: number, next: number): string {
  if (next === 0) return "No driving. Transit, walking, or a life that does not need the car.";
  const diff = Math.abs(base - next);
  if (next < base) {
    return `About ${diff} fewer miles a week. A shorter drive, a carpool, or one trip you skip.`;
  }
  return `About ${diff} more miles a week.`;
}

function flightFeel(base: number, next: number): string {
  const diff = Math.abs(base - next);
  if (next < base) {
    return diff === 1
      ? "One fewer round trip this year. The other trips stay on the calendar."
      : `${diff} fewer round trips this year.`;
  }
  return `${diff} more round trips this year.`;
}

function clothesFeel(base: number, next: number): string {
  const diff = Math.abs(base - next);
  if (next < base) {
    return diff === 1
      ? "One fewer new item each season. The clothes you already wear stay in rotation."
      : `${diff} fewer new items each season.`;
  }
  return `${diff} more new items each season.`;
}

function orderFeel(base: number, next: number): string {
  const diff = Math.abs(base - next);
  if (next < base) {
    return diff === 1
      ? "One fewer box each month. Combine an order, or let one wait."
      : `${diff} fewer boxes each month.`;
  }
  return `${diff} more boxes each month.`;
}

export const wasteExtraLabel = assumptions.wasteExtra;
