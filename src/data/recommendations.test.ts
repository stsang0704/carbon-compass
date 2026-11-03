import { describe, expect, it } from "vitest";
import { starterAnswers } from "./habits";
import {
  applyRecommendations,
  attributedSavedKg,
  eligibleRecommendations,
  personalizedRecommendations,
  recommendationById,
  recommendationNote,
  recommendationSavedKg,
  recommendations,
  sortRecommendations,
  stackedSavedKg,
} from "./recommendations";
import { shareOfTypicalYear, typicalUsLifestyleKg } from "../model/compare";
import { calculate } from "../model/calculate";

describe("recommendations", () => {
  it("gives every recommendation a modeled carbon estimate from a defined apply function", () => {
    for (const rec of recommendations) {
      const saved = recommendationSavedKg(starterAnswers, rec);
      expect(saved).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(saved)).toBe(true);
    }
  });

  it("lowers carbon when wasting less food", () => {
    const saved = recommendationSavedKg(starterAnswers, recommendationById("food-waste-less"));
    expect(saved).toBeGreaterThan(1);
  });

  it("personalizes a beef swap and does not invent savings when there is no beef to replace", () => {
    const withBeef = recommendationSavedKg(starterAnswers, recommendationById("food-one-beef"));
    const noBeef = {
      ...starterAnswers,
      dietShare: { plant: 50, chickenPork: 50, fish: 0, beef: 0 },
    };
    const withoutBeef = recommendationSavedKg(noBeef, recommendationById("food-one-beef"));
    expect(withBeef).toBeGreaterThan(1);
    expect(withoutBeef).toBe(0);
    expect(recommendationNote(noBeef, recommendationById("food-one-beef"))).toMatch(/beef or lamb/);
  });

  it("stacks selected recommendations onto the baseline", () => {
    const both = applyRecommendations(starterAnswers, ["food-waste-less", "travel-flights"]);
    const waste = applyRecommendations(starterAnswers, ["food-waste-less"]);
    const flights = applyRecommendations(starterAnswers, ["travel-flights"]);
    const base = calculate(starterAnswers).totals.carbon;
    const stacked = base - calculate(both).totals.carbon;
    const sum =
      base - calculate(waste).totals.carbon + (base - calculate(flights).totals.carbon);
    expect(stacked).toBeCloseTo(sum, 6);
  });

  it("treats Meatless Monday as a larger plant shift than one plant-based meal", () => {
    const oneMeal = recommendationSavedKg(starterAnswers, recommendationById("food-plant-meal"));
    const monday = recommendationSavedKg(starterAnswers, recommendationById("food-meatless-monday"));
    expect(oneMeal).toBeGreaterThan(1);
    expect(monday).toBeGreaterThan(oneMeal);
    expect(recommendationById("food-meatless-monday").depth).toBe("further");
    expect(recommendationById("food-plant-meal").depth).toBe("ease");
  });

  it("models showers, insulation, repair, and secondhand as real carbon changes", () => {
    const showers = recommendationSavedKg(starterAnswers, recommendationById("home-showers"));
    const insulation = recommendationSavedKg(starterAnswers, recommendationById("home-insulation"));
    const repair = recommendationSavedKg(starterAnswers, recommendationById("clothes-repair"));
    const secondhand = recommendationSavedKg(starterAnswers, recommendationById("clothes-secondhand"));
    expect(showers).toBeGreaterThan(0);
    expect(insulation).toBeGreaterThan(showers);
    expect(repair).toBeGreaterThan(0);
    expect(secondhand).toBeGreaterThan(repair);
  });

  it("uses a deeper thermostat cut for the bigger home change", () => {
    const slight = recommendationSavedKg(starterAnswers, recommendationById("home-thermostat"));
    const further = recommendationSavedKg(starterAnswers, recommendationById("home-thermostat-further"));
    expect(further).toBeGreaterThan(slight);
    expect(slight).toBeGreaterThan(0);
  });

  it("does not claim flight savings when the user already takes none", () => {
    const none = { ...starterAnswers, flightsPerYear: 0 };
    expect(recommendationSavedKg(none, recommendationById("travel-flights"))).toBe(0);
    expect(recommendationNote(none, recommendationById("travel-flights"))).toMatch(/no flights/);
  });

  it("ranks the top lifestyle actions by additional modeled savings for this user", () => {
    const top = personalizedRecommendations(starterAnswers, [], 3);
    expect(top).toHaveLength(3);
    expect(top.every((item) => item.saved >= 1)).toBe(true);
    expect(top.every((item) => item.rec.difficulty === "easy" || item.rec.difficulty === "moderate" || item.rec.difficulty === "hard")).toBe(true);
    const ids = top.map((item) => item.rec.id);
    const stacked = stackedSavedKg(starterAnswers, ids);
    const greedySum = top.reduce((sum, item) => sum + item.saved, 0);
    expect(stacked).toBeCloseTo(greedySum, 4);
    const isolatedSum = ids.reduce(
      (sum, id) => sum + recommendationSavedKg(starterAnswers, recommendationById(id)),
      0,
    );
    expect(stacked).toBeLessThanOrEqual(isolatedSum + 0.05);
    const withoutFirst = personalizedRecommendations(starterAnswers, [top[0].rec.id], 3);
    expect(withoutFirst.some((item) => item.rec.id === top[0].rec.id)).toBe(false);
  });

  it("does not recommend actions that do not apply to the user's survey", () => {
    const noBeef = {
      ...starterAnswers,
      dietShare: { plant: 50, chickenPork: 50, fish: 0, beef: 0 },
      milesPerWeek: 0,
      flightsPerYear: 0,
      clothesPerSeason: 0,
    };
    const ids = eligibleRecommendations(noBeef).map((rec) => rec.id);
    expect(ids).not.toContain("food-one-beef");
    expect(ids).not.toContain("food-occasional-beef");
    expect(ids).not.toContain("travel-flights");
    expect(ids).not.toContain("travel-transit");
    expect(ids).not.toContain("clothes-one-fewer");
    expect(personalizedRecommendations(noBeef).every((item) => item.saved >= 1)).toBe(true);
  });

  it("counts overlapping diet and clothing cuts once when several actions are selected", () => {
    const dietIds = ["food-mostly-plant", "food-meatless-monday", "food-occasional-beef"] as const;
    const dietStacked = stackedSavedKg(starterAnswers, dietIds);
    const dietIsolated = dietIds.reduce(
      (sum, id) => sum + recommendationSavedKg(starterAnswers, recommendationById(id)),
      0,
    );
    expect(dietStacked).toBeLessThan(dietIsolated - 1);
    const attributed = attributedSavedKg(starterAnswers, [...dietIds]);
    const attributedSum = dietIds.reduce((sum, id) => sum + (attributed[id] ?? 0), 0);
    expect(attributedSum).toBeCloseTo(dietStacked, 6);

    const clothesBoth = stackedSavedKg(starterAnswers, ["clothes-one-fewer", "clothes-repair"]);
    const clothesOne = stackedSavedKg(starterAnswers, ["clothes-one-fewer"]);
    expect(clothesBoth).toBeCloseTo(clothesOne, 6);

    const bothThermostats = stackedSavedKg(starterAnswers, ["home-thermostat", "home-thermostat-further"]);
    const further = stackedSavedKg(starterAnswers, ["home-thermostat-further"]);
    expect(bothThermostats).toBeCloseTo(further, 6);
  });

  it("sorts a category by biggest savings or easiest difficulty", () => {
    const travel = recommendations.filter((rec) => rec.category === "travel");
    const bySavings = sortRecommendations(starterAnswers, travel, "savings");
    const amounts = bySavings.map((rec) => recommendationSavedKg(starterAnswers, rec));
    expect(amounts).toEqual([...amounts].sort((left, right) => right - left));
    const byEase = sortRecommendations(starterAnswers, travel, "ease");
    const rank = { easy: 0, moderate: 1, hard: 2 };
    for (let index = 1; index < byEase.length; index += 1) {
      expect(rank[byEase[index].difficulty]).toBeGreaterThanOrEqual(rank[byEase[index - 1].difficulty]);
    }
  });

  it("expresses action savings as a percent of this model's typical U.S. year", () => {
    const typical = typicalUsLifestyleKg();
    const half = shareOfTypicalYear(typical / 2);
    expect(half.percent).toBe(50);
    expect(half.label).toMatch(/comparable average person/i);
    const saved = recommendationSavedKg(starterAnswers, recommendationById("food-waste-less"));
    expect(shareOfTypicalYear(saved).typicalKg).toBeCloseTo(typical, 6);
  });
});
