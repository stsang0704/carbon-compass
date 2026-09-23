import { assumptions } from "./factors";
import type { Answers, Category, HabitId, HeatSource, HeatingHabit, HomeSize, Waste } from "../model/types";
import { habitOrder } from "../model/types";

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

export type ScaleMark = { value: number; label: string };

export type HabitControl =
  | {
      type: "number";
      min: number;
      max: number;
      step: number;
      zeroLabel?: string;
      marks?: ScaleMark[];
    }
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

const wasteOptions: ChoiceOption<Waste>[] = [
  { value: "rarely", label: "Rarely", hint: "Almost everything gets eaten." },
  { value: "sometimes", label: "Sometimes", hint: "A container goes off now and then." },
  { value: "often", label: "Often", hint: "A noticeable share of food is tossed." },
];

const homeOptions: ChoiceOption<HomeSize>[] = [
  { value: "apartment", label: "Apartment", hint: "A smaller space, less to heat." },
  { value: "small", label: "Small house", hint: "A modest house or a large flat." },
  { value: "larger", label: "Larger house", hint: "More rooms, more winter fuel." },
];

const heatOptions: ChoiceOption<HeatSource>[] = [
  { value: "gas", label: "Gas furnace", hint: "Fuel burned in the building." },
  { value: "resistance", label: "Electric resistance", hint: "Baseboards or a standard electric furnace." },
  { value: "heatPump", label: "Heat pump", hint: "Moves heat instead of making it." },
  { value: "unknown", label: "I don't know", hint: "We'll use a typical gas furnace for the estimate." },
];

const meatMarks = [
  { value: 0, label: "None" },
  { value: 7, label: "~ once a day" },
  { value: 14, label: "~ twice a day" },
  { value: 21, label: "Every meal" },
];

const heatingOptions: ChoiceOption<HeatingHabit>[] = [
  { value: "warmer", label: "over 68°F / 20°C", hint: "Warmer than typical" },
  { value: "typical", label: "64-68°F / 18-20°C", hint: "A usual winter setpoint." },
  { value: "cooler", label: "under 64°F / 18°C", hint: "Coolder than typical" },
];

export const habits: HabitMeta[] = [
  {
    id: "meatMealsPerWeek",
    category: "food",
    name: "Meat meals",
    question: "How many meals containing meat do you eat in a typical week?",
    detail: "Meat meals have a higher carbon and water footprint due to the resources required to raise livestock, including feed, land, water, and energy.",
    why: "Cutting out even one meat-based meal a week is a small change that can add up to a measurable impact over time.",
    control: { type: "number", min: 0, max: 21, step: 1, marks: meatMarks },
  },
  {
    id: "foodWaste",
    category: "food",
    name: "Food tossed",
    question: "How often does food get thrown out at home?",
    detail: "This only scales the meat meals above. The rest of a diet is not in the model.",
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
    control: { type: "number", min: 0, max: 400, step: 10, zeroLabel: "I don't drive" },
  },
  {
    id: "flightsPerYear",
    category: "travel",
    name: "Flights",
    question: "How many round-trip flights do you take in a year?",
    detail: "Each one is treated as a typical US domestic round trip, about 1,000 miles each way.",
    why: "Moving one person a thousand miles each way is hundreds of kilograms of fuel. Skipping a trip you were unsure about is often the largest single travel change.",
    control: { type: "number", min: 0, max: 12, step: 1 },
  },
  {
    id: "homeSize",
    category: "home",
    name: "Home size",
    question: "Which home is closest to yours?",
    detail: "Size stands in for how much heat the building needs. It is not your utility bill.",
    why: "A larger home usually takes more fuel through a winter. Moving is a big life change. It is here so you can see the scale, not as a suggestion to relocate.",
    control: { type: "choice", options: homeOptions },
  },
  {
    id: "heatSource",
    category: "home",
    name: "Heat source",
    question: "How is your home heated?",
    detail: "If you have more than one system, pick the one that does most of the winter work.",
    why: "Gas burns on site. Electric resistance turns grid power straight into heat. A heat pump moves heat, so the same warmth can take a fraction of the electricity.",
    control: { type: "choice", options: heatOptions },
  },
  {
    id: "heatingHabit",
    category: "home",
    name: "Winter warmth",
    question: "In winter, how warm do you keep it?",
    detail: "Compared with a usual setpoint, not with a number on a dial you have to remember.",
    why: "A few degrees cooler is a sweater, not a new life. The estimate uses 3% of heating energy per degree, the high end of a common 1–3% rule of thumb.",
    control: { type: "choice", options: heatingOptions },
  },
  {
    id: "clothesPerSeason",
    category: "stuff",
    name: "New clothes",
    question: "How many new clothing items do you buy in a season?",
    detail: "A season is about three months. Shoes can count. Secondhand is outside this estimate.",
    why: "Most of a new garment's impact is in the fiber, before you wear it. Buying one fewer piece leaves the rest of the wardrobe alone.",
    control: { type: "number", min: 0, max: 20, step: 1 },
  },
  {
    id: "ordersPerMonth",
    category: "stuff",
    name: "Online orders",
    question: "How many online orders arrive in a month?",
    detail: "This is the trip the box takes, plus the delivery system. Not the product inside.",
    why: "Vans, hubs, and packaging have a cost even when the thing in the box is small. Combining two orders, or skipping one, is a modest cut.",
    control: { type: "number", min: 0, max: 20, step: 1 },
  },
];

export const starterAnswers: Answers = {
  meatMealsPerWeek: 7,
  foodWaste: "sometimes",
  milesPerWeek: 100,
  flightsPerYear: 2,
  homeSize: "small",
  heatSource: "gas",
  heatingHabit: "typical",
  clothesPerSeason: 6,
  ordersPerMonth: 4,
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
    case "meatMealsPerWeek":
      return value === 1 ? "1 meal a week" : `${value} meals a week`;
    case "foodWaste":
      return wasteOptions.find((option) => option.value === value)?.label ?? String(value);
    case "milesPerWeek":
      return value === 0 ? "No driving" : `${value} miles a week`;
    case "flightsPerYear":
      return Number(value) === 1 ? "1 round trip a year" : `${value} round trips a year`;
    case "homeSize":
      return homeOptions.find((option) => option.value === value)?.label ?? String(value);
    case "heatSource":
      return heatOptions.find((option) => option.value === value)?.label ?? String(value);
    case "heatingHabit":
      return heatingOptions.find((option) => option.value === value)?.label ?? String(value);
    case "clothesPerSeason":
      return `${value} new items a season`;
    case "ordersPerMonth":
      return `${value} orders a month`;
  }
}

export function feel(id: HabitId, base: Answers[HabitId], next: Answers[HabitId]): string {
  if (base === next) return "This is what you do now.";
  switch (id) {
    case "meatMealsPerWeek":
      return mealFeel(Number(base), Number(next));
    case "foodWaste":
      return "Less in the bin, same meals you meant to eat. Or the reverse, if you are testing that direction.";
    case "milesPerWeek":
      return mileFeel(Number(base), Number(next));
    case "flightsPerYear":
      return flightFeel(Number(base), Number(next));
    case "homeSize":
      return "A different size of home. Useful for scale. Not a small weekly habit.";
    case "heatSource":
      if (next === "unknown") {
        return "We'll use a typical gas furnace, so you can still see what heating is worth.";
      }
      return next === "heatPump"
        ? "A heat pump is a real project, not a Tuesday habit. It is here so you can see the size of that one change."
        : "A different heating system. The rest of the winter routine stays put.";
    case "heatingHabit":
      return next === "cooler"
        ? "About three degrees cooler. A sweater, the same rooms, the same winter."
        : "A different winter setpoint. Three degrees is the step this estimate understands.";
    case "clothesPerSeason":
      return clothesFeel(Number(base), Number(next));
    case "ordersPerMonth":
      return orderFeel(Number(base), Number(next));
  }
}

export function easeValue<K extends HabitId>(id: K, value: Answers[K]): Answers[K] {
  switch (id) {
    case "meatMealsPerWeek":
    case "flightsPerYear":
    case "clothesPerSeason":
    case "ordersPerMonth":
      return Math.max(0, Number(value) - 1) as Answers[K];
    case "milesPerWeek":
      return scaleDown(Number(value), 0.8, 10) as Answers[K];
    case "foodWaste":
      return stepToward(value as Waste, ["often", "sometimes", "rarely"], 1) as Answers[K];
    case "homeSize":
      return value;
    case "heatSource":
      return value;
    case "heatingHabit":
      return stepToward(value as HeatingHabit, ["warmer", "typical", "cooler"], 1) as Answers[K];
    default:
      return value;
  }
}

export function furtherValue<K extends HabitId>(id: K, value: Answers[K]): Answers[K] {
  switch (id) {
    case "meatMealsPerWeek":
    case "clothesPerSeason":
    case "ordersPerMonth":
    case "flightsPerYear":
      return Math.floor(Number(value) / 2) as Answers[K];
    case "milesPerWeek":
      return scaleDown(Number(value), 0.5, 10) as Answers[K];
    case "foodWaste":
      return "rarely" as Answers[K];
    case "homeSize":
      return stepToward(value as HomeSize, ["larger", "small", "apartment"], 1) as Answers[K];
    case "heatSource":
      return "heatPump" as Answers[K];
    case "heatingHabit":
      return "cooler" as Answers[K];
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
    if (baseline[id] !== scenario[id]) assignAnswer(overrides, id, scenario[id]);
  }
  return overrides;
}

export function withOverrides(baseline: Answers, overrides: Partial<Answers>): Answers {
  return { ...baseline, ...overrides };
}

export function changedHabitIds(baseline: Answers, scenario: Answers): HabitId[] {
  return habitOrder.filter((id) => baseline[id] !== scenario[id]);
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
  const next = Math.min(order.length - 1, Math.max(0, index + steps));
  return order[next];
}

function mealFeel(base: number, next: number): string {
  const diff = Math.abs(base - next);
  if (next < base) {
    return diff === 1
      ? "One fewer meal with meat each week. The rest of the week stays the same."
      : `${diff} fewer meals with meat each week. The other meals stay.`;
  }
  return `${diff} more meals with meat each week. The other direction, if you want to see it.`;
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
