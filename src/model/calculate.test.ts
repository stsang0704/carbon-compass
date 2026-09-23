import { describe, expect, it } from "vitest";
import { assumptions, mixedMeatKgCo2ePerKg } from "../data/factors";
import { applyDepth, starterAnswers, withOverrides } from "../data/habits";
import { bestSmallMove, calculate, replaceAnswer } from "./calculate";
import { subtractImpacts } from "./format";

describe("calculate", () => {
  it("annualizes meat meals with the mixed per-kilogram factor", () => {
    const answers = starterAnswers;
    const meals = answers.meatMealsPerWeek * assumptions.weeksPerYear;
    const expected = meals * assumptions.meatPortionKg * mixedMeatKgCo2ePerKg;
    const line = calculate(answers).lines.find((item) => item.id === "meat");
    expect(answers.meatMealsPerWeek).toBe(7);
    expect(meals).toBe(364);
    expect(line?.carbon).toBeCloseTo(expected, 6);
  });

  it("gives a reduction a negative carbon delta", () => {
    const baseline = calculate(starterAnswers);
    const lessMeat = calculate(
      replaceAnswer(starterAnswers, "meatMealsPerWeek", starterAnswers.meatMealsPerWeek - 1),
    );
    expect(subtractImpacts(lessMeat.totals, baseline.totals).carbon).toBeLessThan(0);
  });

  it("adds independent habit changes", () => {
    const baseline = calculate(starterAnswers);
    const lessMeat = calculate(
      replaceAnswer(starterAnswers, "meatMealsPerWeek", starterAnswers.meatMealsPerWeek - 1),
    );
    const fewerMiles = calculate(
      replaceAnswer(starterAnswers, "milesPerWeek", starterAnswers.milesPerWeek - 20),
    );
    const both = calculate({
      ...starterAnswers,
      meatMealsPerWeek: starterAnswers.meatMealsPerWeek - 1,
      milesPerWeek: starterAnswers.milesPerWeek - 20,
    });
    const stacked = subtractImpacts(both.totals, baseline.totals);
    const sum =
      subtractImpacts(lessMeat.totals, baseline.totals).carbon +
      subtractImpacts(fewerMiles.totals, baseline.totals).carbon;
    expect(stacked.carbon).toBeCloseTo(sum, 6);
  });

  it("reproduces the baseline when nothing is edited", () => {
    const baseline = calculate(starterAnswers);
    const scenario = calculate(withOverrides(starterAnswers, {}));
    expect(scenario.totals).toEqual(baseline.totals);
    expect(scenario.byCategory).toEqual(baseline.byCategory);
  });

  it("keeps category totals equal to the year", () => {
    const footprint = calculate(starterAnswers);
    const summed = footprint.lines.reduce(
      (sum, line) => ({
        carbon: sum.carbon + line.carbon,
        water: sum.water + line.water,
        energy: sum.energy + line.energy,
      }),
      { carbon: 0, water: 0, energy: 0 },
    );
    expect(summed.carbon).toBeCloseTo(footprint.totals.carbon, 6);
    expect(summed.water).toBeCloseTo(footprint.totals.water, 6);
    expect(summed.energy).toBeCloseTo(footprint.totals.energy, 6);
  });

  it("treats often-wasted food as larger than rarely wasted food", () => {
    const often = calculate({ ...starterAnswers, foodWaste: "often" });
    const rarely = calculate({ ...starterAnswers, foodWaste: "rarely" });
    expect(often.totals.carbon).toBeGreaterThan(rarely.totals.carbon);
  });

  it("gives a heat pump less carbon than a gas furnace in the same house", () => {
    const gas = calculate({ ...starterAnswers, heatSource: "gas" });
    const pump = calculate({ ...starterAnswers, heatSource: "heatPump" });
    expect(pump.totals.carbon).toBeLessThan(gas.totals.carbon);
  });

  it("uses the gas furnace when heating is unknown", () => {
    const gas = calculate({ ...starterAnswers, heatSource: "gas" });
    const unknown = calculate({ ...starterAnswers, heatSource: "unknown" });
    expect(unknown.totals).toEqual(gas.totals);
    expect(unknown.lines.find((line) => line.id === "heating")?.factorIds).toContain("unknown-heat");
  });

  it("lowers carbon when the modest preset is applied to a typical year", () => {
    const baseline = calculate(starterAnswers);
    const eased = calculate(applyDepth(starterAnswers, "ease"));
    expect(subtractImpacts(eased.totals, baseline.totals).carbon).toBeLessThan(0);
    expect(bestSmallMove(starterAnswers).categorySaved).toBeGreaterThan(0);
  });
});
