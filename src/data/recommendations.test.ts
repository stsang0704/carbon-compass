import { describe, expect, it } from "vitest";
import { starterAnswers } from "./habits";
import {
  applyRecommendations,
  recommendationById,
  recommendationNote,
  recommendationSavedKg,
  recommendations,
} from "./recommendations";
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
});
