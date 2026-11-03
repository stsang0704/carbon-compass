import { beforeEach, describe, expect, it } from "vitest";
import { starterAnswers } from "../data/habits";
import { buildSnapshot } from "../model/checkin";
import { clearProfile, loadProfile, recordCheckIn, saveProfile, type Profile } from "./profile";

function installMemoryStorage() {
  const memory = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return memory.size;
    },
    clear() {
      memory.clear();
    },
    getItem(key) {
      return memory.get(key) ?? null;
    },
    key(index) {
      return [...memory.keys()][index] ?? null;
    },
    removeItem(key) {
      memory.delete(key);
    },
    setItem(key, value) {
      memory.set(key, value);
    },
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
}

function profile(checkIns: Profile["checkIns"] = []): Profile {
  return {
    baseline: starterAnswers,
    overrides: {},
    selectedRecIds: [],
    history: [],
    checkIns,
    baselineMonth: null,
  };
}

describe("profile check-in storage", () => {
  beforeEach(() => {
    installMemoryStorage();
    clearProfile();
  });

  it("loads an older profile with an empty check-in list", () => {
    localStorage.setItem(
      "carbon-compass-profile",
      JSON.stringify({
        baseline: starterAnswers,
        overrides: {},
        selectedRecIds: [],
        history: [],
      }),
    );
    expect(loadProfile()?.checkIns).toEqual([]);
    expect(loadProfile()?.baselineMonth).toBeNull();
  });

  it("uses the earliest recorded month when the survey month was not stored", () => {
    localStorage.setItem(
      "carbon-compass-profile",
      JSON.stringify({
        baseline: starterAnswers,
        overrides: {},
        selectedRecIds: [],
        history: [
          { month: "2026-10", scenarioKg: 1000 },
          { month: "2026-09", scenarioKg: 1100 },
        ],
      }),
    );
    expect(loadProfile()?.baselineMonth).toBe("2026-09");
  });

  it("replaces the current month and keeps the previous snapshot", () => {
    const september = buildSnapshot({
      month: "2026-09",
      answers: starterAnswers,
      selectedRecIds: ["home-showers"],
      reflections: { "home-showers": "not-yet" },
    });
    const october = buildSnapshot({
      month: "2026-10",
      answers: { ...starterAnswers, clothesPerSeason: 2 },
      selectedRecIds: ["clothes-repair"],
      reflections: { "clothes-repair": "trying" },
    });
    const edited = buildSnapshot({
      month: "2026-10",
      answers: { ...starterAnswers, clothesPerSeason: 1 },
      selectedRecIds: ["clothes-repair"],
      reflections: { "clothes-repair": "habit" },
    });

    saveProfile(recordCheckIn(recordCheckIn(recordCheckIn(profile(), september), october), edited));
    const loaded = loadProfile();

    expect(loaded?.checkIns).toHaveLength(2);
    expect(loaded?.checkIns[0].month).toBe("2026-09");
    expect(loaded?.checkIns[0].reflections["home-showers"]).toBe("not-yet");
    expect(loaded?.checkIns[1].answers.clothesPerSeason).toBe(1);
    expect(loaded?.checkIns[1].reflections["clothes-repair"]).toBe("habit");
    expect(loaded?.baseline).toEqual(starterAnswers);
  });
});
