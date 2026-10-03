import { describe, expect, it } from "vitest";
import {
  assumptions,
  chickenPorkKgCo2ePerKg,
  published,
} from "../data/factors";
import { typicalDietShare } from "../data/diet";
import { applyDepth, starterAnswers, withOverrides } from "../data/habits";
import { bestSmallMove, calculate, categorizeHome, replaceAnswer } from "./calculate";
import {
  carsFromCarbon,
  drivingMilesFromCarbon,
  formatCarCount,
  formatGasolineGallons,
  gallonsFromCarbon,
  subtractImpacts,
  formatCarbonSaved,
  savedEquivalence,
  treesFromCarbonSaved,
  treeEquivalenceLine,
} from "./format";

describe("calculate", () => {
  it("weights diet carbon by the four food shares", () => {
    const answers = starterAnswers;
    const kgYear =
      assumptions.typicalDietMealsPerWeek * assumptions.weeksPerYear * assumptions.meatPortionKg;
    const expected =
      kgYear * 0.5 * published.plantKgCo2ePerKg +
      kgYear * 0.25 * chickenPorkKgCo2ePerKg +
      kgYear * 0.15 * published.fishKgCo2ePerKg +
      kgYear * 0.1 * published.beefKgCo2ePerKg;
    const line = calculate(answers).lines.find((item) => item.id === "diet");
    expect(answers.dietShare).toEqual(typicalDietShare);
    expect(kgYear).toBeCloseTo(109.2, 6);
    expect(line?.carbon).toBeCloseTo(expected, 6);
  });

  it("does not treat chicken and beef as the same carbon", () => {
    const chicken = calculate(
      replaceAnswer(starterAnswers, "dietShare", { plant: 0, chickenPork: 100, fish: 0, beef: 0 }),
    );
    const beef = calculate(
      replaceAnswer(starterAnswers, "dietShare", { plant: 0, chickenPork: 0, fish: 0, beef: 100 }),
    );
    expect(beef.totals.carbon).toBeGreaterThan(chicken.totals.carbon);
  });

  it("gives a reduction a negative carbon delta", () => {
    const baseline = calculate(starterAnswers);
    const morePlants = calculate(
      replaceAnswer(starterAnswers, "dietShare", { plant: 80, chickenPork: 20, fish: 0, beef: 0 }),
    );
    expect(subtractImpacts(morePlants.totals, baseline.totals).carbon).toBeLessThan(0);
  });

  it("adds independent habit changes", () => {
    const baseline = calculate(starterAnswers);
    const morePlants = calculate(
      replaceAnswer(starterAnswers, "dietShare", { plant: 80, chickenPork: 20, fish: 0, beef: 0 }),
    );
    const fewerMiles = calculate(
      replaceAnswer(starterAnswers, "milesPerWeek", (starterAnswers.milesPerWeek ?? 0) - 20),
    );
    const both = calculate({
      ...starterAnswers,
      dietShare: { plant: 80, chickenPork: 20, fish: 0, beef: 0 },
      milesPerWeek: (starterAnswers.milesPerWeek ?? 0) - 20,
    });
    const stacked = subtractImpacts(both.totals, baseline.totals);
    const sum =
      subtractImpacts(morePlants.totals, baseline.totals).carbon +
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

  it("counts a plant-based diet much lower than a mixed diet", () => {
    const mix = calculate(starterAnswers);
    const plants = calculate({
      ...starterAnswers,
      dietShare: { plant: 100, chickenPork: 0, fish: 0, beef: 0 },
    });
    expect(plants.totals.carbon).toBeLessThan(mix.totals.carbon);
  });

  it("counts a beef-heavy diet higher than a mixed diet", () => {
    const mix = calculate(starterAnswers);
    const beef = calculate({
      ...starterAnswers,
      dietShare: { plant: 30, chickenPork: 20, fish: 0, beef: 50 },
    });
    expect(beef.totals.carbon).toBeGreaterThan(mix.totals.carbon);
  });

  it("uses a typical home when the typed home type is blank or unclear", () => {
    expect(categorizeHome("")).toBe("small");
    expect(categorizeHome("???")).toBe("small");
    expect(categorizeHome("Other")).toBe("small");
    expect(categorizeHome("studio apartment")).toBe("apartment");
    expect(categorizeHome("large house")).toBe("larger");
    const blank = calculate({ ...starterAnswers, homeType: "" });
    const typical = calculate({ ...starterAnswers, homeType: "Small house" });
    expect(blank.totals.carbon).toBeCloseTo(typical.totals.carbon, 6);
  });

  it("maps custom home descriptions onto the three established heating loads", () => {
    expect(categorizeHome("Apartment")).toBe("apartment");
    expect(categorizeHome("townhouse")).toBe("small");
    expect(categorizeHome("duplex")).toBe("small");
    expect(categorizeHome("dorm")).toBe("apartment");
    expect(categorizeHome("condo")).toBe("apartment");
    expect(categorizeHome("mansion")).toBe("larger");
    const townhouse = calculate({ ...starterAnswers, homeType: "Townhouse" });
    const small = calculate({ ...starterAnswers, homeType: "Small house" });
    const apartment = calculate({ ...starterAnswers, homeType: "Apartment" });
    expect(townhouse.totals.carbon).toBeCloseTo(small.totals.carbon, 6);
    expect(apartment.totals.carbon).toBeLessThan(small.totals.carbon);
  });

  it("uses typical averages when optional numbers are blank, and zero when the user entered 0", () => {
    const blank = calculate({
      ...starterAnswers,
      milesPerWeek: null,
      flightsPerYear: null,
      clothesPerSeason: null,
      ordersPerMonth: null,
    });
    const typical = calculate(starterAnswers);
    expect(blank.totals.carbon).toBeCloseTo(typical.totals.carbon, 6);
    const zeroMiles = calculate({ ...starterAnswers, milesPerWeek: 0 });
    expect(zeroMiles.lines.find((item) => item.id === "driving")?.carbon).toBe(0);
  });

  it("treats invalid numeric entries as the typical average", () => {
    const bad = calculate({
      ...starterAnswers,
      flightsPerYear: Number.NaN,
      clothesPerSeason: -3,
      ordersPerMonth: Number.POSITIVE_INFINITY,
    });
    const typical = calculate(starterAnswers);
    expect(bad.lines.find((item) => item.id === "flights")?.carbon).toBeCloseTo(
      typical.lines.find((item) => item.id === "flights")?.carbon ?? -1,
      6,
    );
    expect(bad.lines.find((item) => item.id === "clothes")?.carbon).toBeCloseTo(
      typical.lines.find((item) => item.id === "clothes")?.carbon ?? -1,
      6,
    );
    expect(bad.lines.find((item) => item.id === "orders")?.carbon).toBeCloseTo(
      typical.lines.find((item) => item.id === "orders")?.carbon ?? -1,
      6,
    );
  });

  it("scales heating from the entered winter temperature", () => {
    const typical = calculate(starterAnswers);
    const warmer = calculate({
      ...starterAnswers,
      winterTempF: assumptions.typicalWinterF + assumptions.thermostatDegrees,
    });
    expect(warmer.totals.carbon).toBeGreaterThan(typical.totals.carbon);
  });

  it("converts annual carbon into equivalent gasoline-car miles using the published factor", () => {
    const footprint = calculate(starterAnswers);
    const miles = drivingMilesFromCarbon(footprint.totals.carbon);
    expect(miles).toBeCloseTo(footprint.totals.carbon / published.vehicleKgCo2ePerMile, 6);
    const lighter = calculate(
      replaceAnswer(starterAnswers, "dietShare", { plant: 100, chickenPork: 0, fish: 0, beef: 0 }),
    );
    expect(drivingMilesFromCarbon(lighter.totals.carbon)).toBeLessThan(miles);
    expect(drivingMilesFromCarbon(0)).toBe(0);
  });

  it("converts the initial year into equivalent gasoline cars using the published annual factor", () => {
    expect(carsFromCarbon(4290)).toBeCloseTo(1, 6);
    expect(carsFromCarbon(15015)).toBeCloseTo(3.5, 6);
    expect(formatCarCount(15015)).toBe("3.5");
    expect(formatCarCount(42900)).toBe("10");
    expect(carsFromCarbon(0)).toBe(0);
    const footprint = calculate(starterAnswers);
    expect(carsFromCarbon(footprint.totals.carbon)).toBeCloseTo(
      footprint.totals.carbon / published.vehicleKgCo2ePerYear,
      6,
    );
  });

  it("converts the initial year into equivalent gallons of gasoline using the published per-gallon factor", () => {
    expect(gallonsFromCarbon(8.89)).toBeCloseTo(1, 6);
    expect(formatGasolineGallons(8890)).toBe("1,000");
    expect(gallonsFromCarbon(0)).toBe(0);
    const footprint = calculate(starterAnswers);
    expect(gallonsFromCarbon(footprint.totals.carbon)).toBeCloseTo(
      footprint.totals.carbon / published.gasolineKgCo2PerGallon,
      6,
    );
  });

  it("converts a carbon reduction into urban trees using the published sequestration factor", () => {
    expect(treesFromCarbonSaved(60)).toBeCloseTo(1, 6);
    expect(treesFromCarbonSaved(120)).toBeCloseTo(2, 6);
    expect(treesFromCarbonSaved(0)).toBe(0);
    expect(treeEquivalenceLine(60)).toBe(
      "Your changes could avoid as much CO₂ as approximately 1 tree absorbs in a year.",
    );
    expect(treeEquivalenceLine(180)).toBe(
      "Your changes could avoid as much CO₂ as approximately 3 trees absorb in a year.",
    );
  });

  it("uses miles for savings smaller than one tree and trees once the saving reaches one tree", () => {
    const small = savedEquivalence(30);
    expect(small.kind).toBe("miles");
    expect(small.heading).toBe("≈ 76 miles");
    expect(small.unit).toBe("of driving avoided");
    expect(formatCarbonSaved(30)).toBe("30 kg CO₂e saved");
    expect(JSON.stringify(small)).not.toMatch(/less than 1|0 trees|0\.\d trees/i);

    const threshold = savedEquivalence(60);
    expect(threshold.kind).toBe("trees");
    expect(threshold.heading).toBe("≈ 1 tree");

    const larger = savedEquivalence(180);
    expect(larger.kind).toBe("trees");
    expect(larger.heading).toBe("≈ 3 trees");
    expect(savedEquivalence(0).kind).toBe("none");
  });
});
