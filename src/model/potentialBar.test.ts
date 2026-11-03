import { describe, expect, it } from "vitest";
import { formatPotentialKg, formatPotentialPair, formatPotentialTonnes, potentialCategoryBar } from "./potentialBar";

describe("potential category bar", () => {
  it("fills the original footprint with the new footprint and the reduction", () => {
    const bar = potentialCategoryBar(14122, 777);
    expect(bar.inconsistent).toBe(false);
    expect(bar.nextKg).toBeCloseTo(777);
    expect(bar.savingsKg).toBeCloseTo(13345);
    expect(bar.coloredPercent + bar.greyPercent).toBeCloseTo(100);
    expect(bar.coloredPercent).toBeCloseTo((777 / 14122) * 100);
    expect(bar.greyPercent).toBeCloseTo((13345 / 14122) * 100);
  });

  it("uses the whole bar as the remaining footprint when nothing is saved", () => {
    const bar = potentialCategoryBar(7800, 7800);
    expect(bar.savingsKg).toBe(0);
    expect(bar.nextKg).toBe(7800);
    expect(bar.coloredPercent).toBe(100);
    expect(bar.greyPercent).toBe(0);
    expect(bar.inconsistent).toBe(false);
  });

  it("flags a reduction larger than the original category instead of drawing past the bar", () => {
    const bar = potentialCategoryBar(1000, -200);
    expect(bar.inconsistent).toBe(true);
    expect(bar.savingsKg).toBeCloseTo(1200);
    expect(bar.nextKg).toBe(0);
    expect(bar.coloredPercent).toBe(0);
    expect(bar.greyPercent).toBe(100);
  });

  it("does not treat a higher scenario as a reduction", () => {
    const bar = potentialCategoryBar(1000, 1200);
    expect(bar.inconsistent).toBe(false);
    expect(bar.savingsKg).toBe(0);
    expect(bar.nextKg).toBe(1000);
    expect(bar.coloredPercent).toBe(100);
    expect(bar.greyPercent).toBe(0);
  });

  it("formats the before-and-after tonnes and the reduction in kilograms", () => {
    expect(formatPotentialTonnes(14122)).toBe("14 t");
    expect(formatPotentialTonnes(777)).toBe("0.78 t");
    expect(formatPotentialTonnes(7793)).toBe("7.8 t");
    expect(formatPotentialKg(13344.6)).toBe("13,345");
    expect(formatPotentialPair(14122, 777)).toEqual({ original: "14 t", next: "0.78 t" });
    expect(formatPotentialPair(28065, 27805)).toEqual({ original: "28.1 t", next: "27.8 t" });
    expect(formatPotentialPair(7793, 7793)).toEqual({ original: "7.8 t", next: "7.8 t" });
  });
});
