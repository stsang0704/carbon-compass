import { assumptions } from "./factors";
import { resolvedDiet, shiftDietPoints, shiftTowardPlants } from "./diet";
import { resolvedNumber } from "./habits";
import { calculate } from "../model/calculate";
import type { Answers, Category, Waste } from "../model/types";

export type RecId =
  | "food-waste-less"
  | "food-one-beef"
  | "food-plant-meal"
  | "food-meatless-monday"
  | "food-mostly-plant"
  | "food-occasional-beef"
  | "travel-combine"
  | "travel-walk"
  | "travel-transit"
  | "travel-flights"
  | "home-showers"
  | "home-thermostat"
  | "home-thermostat-further"
  | "home-insulation"
  | "clothes-one-fewer"
  | "clothes-repair"
  | "clothes-fewer"
  | "clothes-secondhand";

export type Difficulty = "easy" | "moderate" | "hard";

export type Recommendation = {
  id: RecId;
  category: Category;
  depth: "ease" | "further";
  difficulty: Difficulty;
  title: string;
  how: string;
  why: string;
  apply: (current: Answers, baseline: Answers) => Answers;
};

export const difficultyLabel: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

const oneMealPoints = 100 / assumptions.typicalDietMealsPerWeek;
const meatlessMondayPoints = oneMealPoints * 3;

export const recommendations: Recommendation[] = [
  {
    id: "food-waste-less",
    category: "food",
    depth: "ease",
    difficulty: "easy",
    title: "Waste less food at home",
    how: "Plan a few meals before shopping, check what you already have, and freeze leftovers you won't eat soon.",
    why: "Wasting less food reduces the resources used to produce food that goes uneaten and the emissions from its disposal.",
    apply: (current) => setField(current, "foodWaste", stepWasteDown(current.foodWaste)),
  },
  {
    id: "food-one-beef",
    category: "food",
    depth: "ease",
    difficulty: "easy",
    title: "Replace one beef or lamb meal a week",
    how: "Swap one usual beef or lamb dinner for beans, eggs, chicken, or fish. If you already eat fewer than one of those meals a week, only the beef you do eat is moved.",
    why: "Beef and lamb have far higher greenhouse gases per serving than other proteins.",
    apply: (current) =>
      setField(current, "dietShare", shiftDietPoints(current.dietShare, "beef", "plant", oneMealPoints)),
  },
  {
    id: "food-plant-meal",
    category: "food",
    depth: "ease",
    difficulty: "easy",
    title: "Try a plant-based meal",
    how: "Pick one meal this week and build it from vegetables, grains, and legumes.",
    why: "Plant-based meals skip the farm emissions of raising animals.",
    apply: (current) =>
      setField(current, "dietShare", shiftTowardPlants(current.dietShare, oneMealPoints)),
  },
  {
    id: "food-meatless-monday",
    category: "food",
    depth: "further",
    difficulty: "moderate",
    title: "Try Meatless Monday",
    how: "Pick one day each week and skip meat and seafood at every meal. That is three meals, about a seventh of the week, built from plants.",
    why: "One meat-free day is a larger plant shift than swapping a single meal.",
    apply: (current) =>
      setField(current, "dietShare", shiftTowardPlants(current.dietShare, meatlessMondayPoints)),
  },
  {
    id: "food-mostly-plant",
    category: "food",
    depth: "further",
    difficulty: "hard",
    title: "Eat mostly plant-based meals",
    how: "Let plants be the default, with meat as a side or only a few meals a week.",
    why: "Most of a diet's climate impact sits in animal foods, especially beef and lamb.",
    apply: (current) => setField(current, "dietShare", shiftTowardPlants(current.dietShare, 40)),
  },
  {
    id: "food-occasional-beef",
    category: "food",
    depth: "further",
    difficulty: "hard",
    title: "Make beef and lamb an occasional choice",
    how: "Keep steaks and lamb for special days, not the weekly rotation. This model moves beef above 5% of the plate to plants.",
    why: "A small share of beef still dominates the carbon from a mixed diet.",
    apply: (current) => {
      const extra = Math.max(0, resolvedDiet(current.dietShare).beef - 5);
      return setField(current, "dietShare", shiftDietPoints(current.dietShare, "beef", "plant", extra));
    },
  },
  {
    id: "travel-combine",
    category: "travel",
    depth: "ease",
    difficulty: "easy",
    title: "Combine errands into one trip",
    how: "Batch nearby stops into one outing instead of several short drives. This model cuts weekly miles by 15%.",
    why: "Cold starts and extra miles add fuel use even when each trip feels small.",
    apply: (current) => {
      const miles = resolvedNumber(current.milesPerWeek, assumptions.typicalMilesPerWeek);
      return setField(current, "milesPerWeek", Math.max(0, Math.round(miles * 0.85)));
    },
  },
  {
    id: "travel-walk",
    category: "travel",
    depth: "ease",
    difficulty: "easy",
    title: "Walk or cycle for a short trip",
    how: "Choose a trip under a couple of miles and walk or bike it this week. This model drops 10 driving miles a week.",
    why: "Those short car hops still burn fuel, and swapping them cuts miles directly.",
    apply: (current) => {
      const miles = resolvedNumber(current.milesPerWeek, assumptions.typicalMilesPerWeek);
      return setField(current, "milesPerWeek", Math.max(0, miles - 10));
    },
  },
  {
    id: "travel-transit",
    category: "travel",
    depth: "further",
    difficulty: "moderate",
    title: "Replace regular car journeys with public transport",
    how: "Use bus, rail, or a carpool for a commute or regular errand you now drive. This model cuts weekly miles in half.",
    why: "Sharing a vehicle spreads the fuel across more people than driving alone.",
    apply: (current) => {
      const miles = resolvedNumber(current.milesPerWeek, assumptions.typicalMilesPerWeek);
      return setField(current, "milesPerWeek", Math.max(0, Math.round(miles * 0.5)));
    },
  },
  {
    id: "travel-flights",
    category: "travel",
    depth: "further",
    difficulty: "moderate",
    title: "Take fewer flights",
    how: "Skip one round trip you are unsure about, or choose a closer gathering. This model removes one typical US domestic round trip.",
    why: "A single domestic round trip is hundreds of kilograms of fuel.",
    apply: (current) => {
      const trips = resolvedNumber(current.flightsPerYear, assumptions.typicalFlightsPerYear);
      return setField(current, "flightsPerYear", Math.max(0, trips - 1));
    },
  },
  {
    id: "home-showers",
    category: "home",
    depth: "ease",
    difficulty: "easy",
    title: "Take shorter showers",
    how: "Set a timer and finish two minutes sooner, or skip a daily wash when you can. This model uses EPA's typical 8-minute shower and shortens it to 6.",
    why: "Heating water uses energy. Shorter showers mean less fuel or electricity at the heater.",
    apply: (current) => setField(current, "showerMinutes", assumptions.shorterShowerMinutes),
  },
  {
    id: "home-thermostat",
    category: "home",
    depth: "ease",
    difficulty: "easy",
    title: "Lower your winter thermostat slightly",
    how: "Turn the winter setpoint down 3°F (about 1–2°C) and use a sweater.",
    why: "Each degree you don't heat avoids a slice of furnace or heat-pump energy.",
    apply: (current, baseline) =>
      setField(current, "winterTempF", coolerWinter(baseline, assumptions.thermostatDegrees)),
  },
  {
    id: "home-thermostat-further",
    category: "home",
    depth: "further",
    difficulty: "moderate",
    title: "Reduce your winter thermostat further",
    how: "Settle 6°F cooler than you do now, or heat only the rooms you use. That is twice the small thermostat step.",
    why: "Heating is most of a home's winter carbon. A deeper cut compounds.",
    apply: (current, baseline) =>
      setField(current, "winterTempF", coolerWinter(baseline, assumptions.thermostatDegrees * 2)),
  },
  {
    id: "home-insulation",
    category: "home",
    depth: "further",
    difficulty: "hard",
    title: "Improve home insulation",
    how: "Seal drafts, add weatherstripping, or insulate the attic and windows if you can. This model applies ENERGY STAR's 15% average heating saving.",
    why: "A tighter envelope keeps heat in, so the furnace runs less.",
    apply: (current) =>
      setField(current, "insulationFactor", 1 - assumptions.insulationHeatingShare),
  },
  {
    id: "clothes-one-fewer",
    category: "stuff",
    depth: "ease",
    difficulty: "easy",
    title: "Buy one fewer new item this season",
    how: "Pause one planned purchase this season. Wear what you already have.",
    why: "Most of a garment's impact is in the fiber, before you put it on.",
    apply: (current) => {
      const items = resolvedNumber(current.clothesPerSeason, assumptions.typicalClothesPerSeason);
      return setField(current, "clothesPerSeason", Math.max(0, items - 1));
    },
  },
  {
    id: "clothes-repair",
    category: "stuff",
    depth: "ease",
    difficulty: "easy",
    title: "Repair an item you already own",
    how: "Mend a tear, replace a button, or take shoes to a cobbler instead of replacing them. This model avoids one new item this season.",
    why: "Extending a piece you own avoids the carbon of a new one.",
    apply: (current, baseline) => {
      const items = resolvedNumber(current.clothesPerSeason, assumptions.typicalClothesPerSeason);
      const start = resolvedNumber(baseline.clothesPerSeason, assumptions.typicalClothesPerSeason);
      if (items < start) return current;
      return setField(current, "clothesPerSeason", Math.max(0, items - 1));
    },
  },
  {
    id: "clothes-fewer",
    category: "stuff",
    depth: "further",
    difficulty: "moderate",
    title: "Buy fewer new clothes regularly",
    how: "Set a lower seasonal cap, or skip a sale you usually shop. This model halves the new items you buy each season.",
    why: "Fewer new items each season cuts fiber carbon year after year.",
    apply: (current) => {
      const items = resolvedNumber(current.clothesPerSeason, assumptions.typicalClothesPerSeason);
      return setField(current, "clothesPerSeason", Math.floor(items / 2));
    },
  },
  {
    id: "clothes-secondhand",
    category: "stuff",
    depth: "further",
    difficulty: "moderate",
    title: "Choose secondhand more often",
    how: "Check a thrift, swap, or resale listing before buying new. This model treats half of the items you still buy as secondhand, with no new fiber.",
    why: "Secondhand uses clothes that already exist, so the fiber isn't grown again.",
    apply: (current) => setField(current, "secondhandShare", assumptions.secondhandShare),
  },
];

const recIds = new Set(recommendations.map((item) => item.id));

export function isRecId(value: unknown): value is RecId {
  return typeof value === "string" && recIds.has(value as RecId);
}

export function recommendationById(id: RecId): Recommendation {
  const rec = recommendations.find((item) => item.id === id);
  if (!rec) throw new Error(`Unknown recommendation ${id}`);
  return rec;
}

export function recommendationsIn(category: Category, depth?: Recommendation["depth"]): Recommendation[] {
  return recommendations.filter(
    (item) => item.category === category && (depth === undefined || item.depth === depth),
  );
}

export type RecSort = "savings" | "ease";

const difficultyOrder: Record<Difficulty, number> = { easy: 0, moderate: 1, hard: 2 };

/** Biggest Carbon Reduction ranks by modeled annual savings. Easiest to Adopt ranks easy, then moderate, then hard. */
export function sortRecommendations(
  baseline: Answers,
  recs: readonly Recommendation[],
  sort: RecSort,
): Recommendation[] {
  return [...recs].sort((left, right) => {
    if (sort === "ease") {
      const ease = difficultyOrder[left.difficulty] - difficultyOrder[right.difficulty];
      if (ease !== 0) return ease;
    }
    const saved = recommendationSavedKg(baseline, right) - recommendationSavedKg(baseline, left);
    if (Math.abs(saved) > 0.05) return saved;
    return left.title.localeCompare(right.title);
  });
}

export function applyRecommendations(baseline: Answers, ids: readonly string[]): Answers {
  const selected = new Set(ids.filter(isRecId));
  if (selected.has("home-thermostat-further")) selected.delete("home-thermostat");
  if (selected.has("clothes-one-fewer")) selected.delete("clothes-repair");
  let next = { ...baseline, dietShare: { ...baseline.dietShare } };
  for (const rec of recommendations) {
    if (selected.has(rec.id)) next = rec.apply(next, baseline);
  }
  return next;
}

export function stackedSavedKg(baseline: Answers, ids: readonly string[]): number {
  return Math.max(0, calculate(baseline).totals.carbon - calculate(applyRecommendations(baseline, ids)).totals.carbon);
}

/** Extra kg this action still saves after the other selected actions are already applied. */
export function marginalSavedKg(baseline: Answers, selected: readonly string[], rec: Recommendation): number {
  const others = selected.filter((id) => id !== rec.id);
  return Math.max(0, stackedSavedKg(baseline, [...others, rec.id]) - stackedSavedKg(baseline, others));
}

/** Split a combined scenario into each selected action's additional cut, in selection order. */
export function attributedSavedKg(baseline: Answers, ids: readonly string[]): Partial<Record<RecId, number>> {
  const selected = ids.filter(isRecId);
  const result: Partial<Record<RecId, number>> = {};
  const running: RecId[] = [];
  let previous = calculate(baseline).totals.carbon;
  for (const id of selected) {
    running.push(id);
    const next = calculate(applyRecommendations(baseline, running)).totals.carbon;
    result[id] = Math.max(0, previous - next);
    previous = next;
  }
  return result;
}

export function recommendationSavedKg(baseline: Answers, rec: Recommendation): number {
  return stackedSavedKg(baseline, [rec.id]);
}

export function isRelevantRecommendation(baseline: Answers, rec: Recommendation): boolean {
  return recommendationSavedKg(baseline, rec) >= 1;
}

export function eligibleRecommendations(baseline: Answers): Recommendation[] {
  return recommendations.filter((rec) => isRelevantRecommendation(baseline, rec));
}

export function recommendationStillApplies(
  baseline: Answers,
  selected: readonly string[],
  rec: Recommendation,
): boolean {
  if (selected.includes(rec.id)) return true;
  return marginalSavedKg(baseline, selected, rec) >= 1;
}

export type RankedRec = {
  rec: Recommendation;
  saved: number;
};

/**
 * Three eligible actions with the greatest additional annual cuts for this survey.
 * Each pick is scored on remaining carbon after earlier picks, so overlapping diet or
 * travel changes are not counted twice.
 */
export function personalizedRecommendations(
  baseline: Answers,
  selected: readonly string[] = [],
  limit = 3,
): RankedRec[] {
  const taken = new Set(selected.filter(isRecId));
  const pool = eligibleRecommendations(baseline).filter((rec) => !taken.has(rec.id));
  const picked: RankedRec[] = [];
  const pickedIds: RecId[] = [];
  while (picked.length < limit) {
    let best: RankedRec | null = null;
    for (const rec of pool) {
      if (pickedIds.includes(rec.id)) continue;
      const saved = marginalSavedKg(baseline, pickedIds, rec);
      if (saved < 1) continue;
      if (!best || saved > best.saved + 0.05) best = { rec, saved };
    }
    if (!best) break;
    picked.push(best);
    pickedIds.push(best.rec.id);
  }
  return picked;
}

export function recommendationNote(baseline: Answers, rec: Recommendation): string | null {
  if (Math.round(recommendationSavedKg(baseline, rec)) > 0) return null;
  switch (rec.id) {
    case "food-one-beef":
    case "food-occasional-beef":
      return "You already eat little or no beef or lamb, so this swap does not change your year.";
    case "food-plant-meal":
    case "food-meatless-monday":
    case "food-mostly-plant":
      return "Your meals are already plant-based enough that this shift does not change your year.";
    case "food-waste-less":
      return "You already waste food rarely, so this step does not change your year.";
    case "travel-combine":
    case "travel-walk":
    case "travel-transit":
      return "You already drive little or not at all, so this trip change does not change your year.";
    case "travel-flights":
      return "You already take no flights, so skipping one does not change your year.";
    case "clothes-one-fewer":
    case "clothes-repair":
    case "clothes-fewer":
    case "clothes-secondhand":
      return "You already buy no new clothes, so this clothing change does not change your year.";
    default:
      return "This change does not currently apply to your habits.";
  }
}

function stepWasteDown(value: Waste): Waste {
  if (value === "often") return "sometimes";
  return "rarely";
}

function coolerWinter(baseline: Answers, degrees: number): number {
  const temp = resolvedNumber(baseline.winterTempF, assumptions.typicalWinterF);
  return Math.max(assumptions.minWinterF, temp - degrees);
}

function setField<K extends keyof Answers>(answers: Answers, id: K, value: Answers[K]): Answers {
  return { ...answers, [id]: value };
}
