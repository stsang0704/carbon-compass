import { describe, expect, it } from "vitest";
import { starterAnswers } from "../data/habits";
import { calculate } from "./calculate";
import { footprintInsight } from "./insight";
import { categories } from "./types";

describe("footprint insight", () => {
  it("names the largest category in the estimate", () => {
    const footprint = calculate(starterAnswers);
    const top = categories
      .map((category) => ({ label: category.label, kg: footprint.byCategory[category.id].carbon }))
      .sort((left, right) => right.kg - left.kg)[0];
    expect(footprintInsight(footprint).startsWith(`${top.label} is the largest part of this estimate`)).toBe(true);
  });

  it("mentions flights when they are most of a travel-heavy estimate", () => {
    const text = footprintInsight(calculate({ ...starterAnswers, flightsPerYear: 80 }));
    expect(text).toContain("Travel is the largest part of this estimate");
    expect(text).toContain("Most of that is flights.");
  });
});
