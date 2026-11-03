import { describe, expect, it } from "vitest";
import { starterAnswers } from "../data/habits";
import { calculate } from "./calculate";
import {
  answersForCheckIn,
  barShare,
  buildSnapshot,
  compareDirection,
  describePercent,
  effortMessage,
  footprintKg,
  percentChange,
  previousCheckIn,
  surveyProgress,
  upsertCheckIn,
} from "./checkin";

describe("monthly check-in snapshots", () => {
  it("keeps one snapshot per month and preserves earlier months", () => {
    const september = buildSnapshot({
      month: "2026-09",
      answers: starterAnswers,
      selectedRecIds: ["food-plant-meal"],
      reflections: { "food-plant-meal": "trying" },
    });
    const october = buildSnapshot({
      month: "2026-10",
      answers: { ...starterAnswers, milesPerWeek: 40 },
      selectedRecIds: ["travel-walk"],
      reflections: { "travel-walk": "not-yet" },
    });
    const edited = buildSnapshot({
      month: "2026-10",
      answers: { ...starterAnswers, milesPerWeek: 20 },
      selectedRecIds: ["travel-walk"],
      reflections: { "travel-walk": "habit" },
    });

    const saved = upsertCheckIn(upsertCheckIn([september], october), edited);

    expect(saved.map((item) => item.month)).toEqual(["2026-09", "2026-10"]);
    expect(saved[0].reflections["food-plant-meal"]).toBe("trying");
    expect(saved[1].answers.milesPerWeek).toBe(20);
    expect(saved[1].carbonKg).toBe(footprintKg(edited.answers));
  });

  it("calculates footprint from lifestyle answers, not from reflections", () => {
    const trying = buildSnapshot({
      month: "2026-10",
      answers: starterAnswers,
      selectedRecIds: ["food-plant-meal"],
      reflections: { "food-plant-meal": "trying" },
    });
    const habit = buildSnapshot({
      month: "2026-10",
      answers: starterAnswers,
      selectedRecIds: ["food-plant-meal"],
      reflections: { "food-plant-meal": "habit" },
    });

    expect(trying.carbonKg).toBe(habit.carbonKg);
    expect(trying.carbonKg).toBe(calculate(starterAnswers).totals.carbon);
  });

  it("drops reflection choices for changes that are not selected", () => {
    const snapshot = buildSnapshot({
      month: "2026-10",
      answers: starterAnswers,
      selectedRecIds: ["travel-walk"],
      reflections: { "travel-walk": "trying", "food-plant-meal": "habit" },
    });
    expect(snapshot.reflections).toEqual({ "travel-walk": "trying" });
  });

  it("compares a check-in with the original baseline and the earlier month", () => {
    const lower = { ...starterAnswers, flightsPerYear: 0, milesPerWeek: 20 };
    const september = buildSnapshot({
      month: "2026-09",
      answers: starterAnswers,
      selectedRecIds: [],
      reflections: {},
    });
    const october = buildSnapshot({
      month: "2026-10",
      answers: lower,
      selectedRecIds: [],
      reflections: {},
    });
    const progress = surveyProgress(starterAnswers, [october, september], "2026-08");

    expect(progress.points.map((point) => point.month)).toEqual(["2026-08", "2026-09", "2026-10"]);
    expect(progress.points.map((point) => point.kind)).toEqual(["baseline", "check-in", "check-in"]);
    expect(progress.points[0].carbonKg).toBe(calculate(starterAnswers).totals.carbon);
    expect(progress.originalKg).toBe(calculate(starterAnswers).totals.carbon);
    expect(progress.currentKg).toBe(calculate(lower).totals.carbon);
    expect(progress.currentKg).toBeLessThan(progress.originalKg);
    expect(describePercent(progress.percent).direction).toBe("decrease");
    expect(previousCheckIn([september, october], "2026-10")?.month).toBe("2026-09");
    expect(previousCheckIn([september, october], "2026-09")).toBeNull();
  });

  it("shows the original survey before any check-in is saved", () => {
    const progress = surveyProgress(starterAnswers, [], "2026-10");
    expect(progress.points).toEqual([
      { month: "2026-10", carbonKg: progress.originalKg, kind: "baseline" },
    ]);
    expect(progress.currentKg).toBe(progress.originalKg);
    expect(describePercent(progress.percent).label).toBe("No change");
    expect(describePercent(percentChange(1000, 800)).label).toBe("20% decrease");
    expect(describePercent(percentChange(1000, 1250)).label).toBe("25% increase");
    expect(percentChange(0, 10)).toBeNull();
  });

  it("keeps both bars on one scale, including when the updated footprint is higher", () => {
    expect(barShare(80, 100)).toBe(80);
    expect(barShare(100, 100)).toBe(100);
    expect(barShare(0, 100)).toBe(0);
    expect(compareDirection(1000, 800)).toBe("decrease");
    expect(compareDirection(1000, 1000)).toBe("same");
    expect(compareDirection(800, 1000)).toBe("increase");
    expect(effortMessage("decrease")).toBe(
      "Your efforts are adding up! Small changes can make a meaningful difference.",
    );
    expect(effortMessage("same")).toBe(
      "Every step counts. Change takes time, and there's always something new to explore.",
    );
    expect(effortMessage("increase")).toBe(
      "There's always room to grow. Every month is another opportunity to try something different.",
    );
    expect(effortMessage("unavailable")).toBe(effortMessage("same"));
  });

  it("fills a new month from the latest survey and an edit from that month", () => {
    const september = buildSnapshot({
      month: "2026-09",
      answers: { ...starterAnswers, ordersPerMonth: 1 },
      selectedRecIds: [],
      reflections: {},
    });
    const october = buildSnapshot({
      month: "2026-10",
      answers: { ...starterAnswers, ordersPerMonth: 3 },
      selectedRecIds: [],
      reflections: {},
    });
    const fresh = answersForCheckIn(starterAnswers, [september], "2026-10");
    const editing = answersForCheckIn(starterAnswers, [september, october], "2026-10");

    expect(fresh.ordersPerMonth).toBe(1);
    expect(editing.ordersPerMonth).toBe(3);
    fresh.dietShare.plant = 0;
    expect(september.answers.dietShare.plant).not.toBe(0);
  });
});
