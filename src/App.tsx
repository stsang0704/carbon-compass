import { useEffect, useState } from "react";
import { applyDepth, changedHabitIds, overridesFor } from "./data/habits";
import { Baseline } from "./screens/Baseline";
import { Compass } from "./screens/Compass";
import { Experiment } from "./screens/Experiment";
import { Mix } from "./screens/Mix";
import { Sources } from "./screens/Sources";
import { Welcome } from "./screens/Welcome";
import { clearProfile, loadProfile, saveProfile, scenarioOf, setHabitOverride } from "./state/profile";
import type { Profile } from "./state/profile";
import type { Answers, Depth, HabitId } from "./model/types";

type Screen =
  | { name: "welcome" }
  | { name: "baseline" }
  | { name: "compass" }
  | { name: "experiment"; habitId: HabitId; returnTo: "compass" | "mix" }
  | { name: "mix" };

type SourceRequest = { habitId?: HabitId } | null;

export function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [screen, setScreen] = useState<Screen>(() =>
    loadProfile() ? { name: "compass" } : { name: "welcome" },
  );
  const [source, setSource] = useState<SourceRequest>(null);

  useEffect(() => {
    if (profile) saveProfile(profile);
  }, [profile]);

  const scenario = profile ? scenarioOf(profile) : null;
  const depth = profile && scenario ? activeDepth(profile.baseline, scenario) : "close";

  function finishBaseline(baseline: Answers) {
    setProfile({ baseline, overrides: {} });
    setScreen({ name: "compass" });
  }

  function chooseDepth(next: Depth) {
    setProfile((current) => {
      if (!current) return current;
      if (next === "close") return { ...current, overrides: {} };
      const mixed = applyDepth(current.baseline, next);
      return { ...current, overrides: overridesFor(current.baseline, mixed) };
    });
  }

  function changeHabit(habitId: HabitId, value: Answers[HabitId]) {
    setProfile((current) => (current ? setHabitOverride(current, habitId, value) : current));
  }

  function reset() {
    clearProfile();
    setProfile(null);
    setSource(null);
    setScreen({ name: "welcome" });
  }

  return (
    <>
      {screen.name === "welcome" ? <Welcome onStart={() => setScreen({ name: "baseline" })} /> : null}
      {screen.name === "baseline" ? (
        <Baseline
          initial={profile?.baseline}
          onBack={() => setScreen({ name: "welcome" })}
          onDone={finishBaseline}
        />
      ) : null}
      {screen.name === "compass" && profile && scenario ? (
        <Compass
          baseline={profile.baseline}
          scenario={scenario}
          depth={depth}
          onDepth={chooseDepth}
          onTry={(habitId) => setScreen({ name: "experiment", habitId, returnTo: "compass" })}
          onMix={() => setScreen({ name: "mix" })}
          onSources={() => setSource({})}
          onReset={reset}
        />
      ) : null}
      {screen.name === "experiment" && profile && scenario ? (
        <Experiment
          habitId={screen.habitId}
          baseline={profile.baseline}
          scenario={scenario}
          onChange={(value) => changeHabit(screen.habitId, value)}
          onBack={() =>
            setScreen(screen.returnTo === "mix" ? { name: "mix" } : { name: "compass" })
          }
          onMix={() => setScreen({ name: "mix" })}
          onSources={() => setSource({ habitId: screen.habitId })}
        />
      ) : null}
      {screen.name === "mix" && profile && scenario ? (
        <Mix
          baseline={profile.baseline}
          scenario={scenario}
          depth={depth}
          onDepth={chooseDepth}
          onOpen={(habitId) => setScreen({ name: "experiment", habitId, returnTo: "mix" })}
          onBack={() => setScreen({ name: "compass" })}
          onSources={() => setSource({})}
        />
      ) : null}
      {source && profile && scenario ? (
        <Sources
          baseline={profile.baseline}
          scenario={scenario}
          focusHabitId={source.habitId}
          onClose={() => setSource(null)}
        />
      ) : null}
    </>
  );
}

function activeDepth(baseline: Answers, scenario: Answers): Depth | "custom" {
  if (changedHabitIds(baseline, scenario).length === 0) return "close";
  if (same(scenario, applyDepth(baseline, "ease"))) return "ease";
  if (same(scenario, applyDepth(baseline, "further"))) return "further";
  return "custom";
}

function same(left: Answers, right: Answers): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
