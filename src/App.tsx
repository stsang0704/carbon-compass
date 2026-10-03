import { useEffect, useState } from "react";
import { overridesFor } from "./data/habits";
import { applyRecommendations, type RecId } from "./data/recommendations";
import { Baseline } from "./screens/Baseline";
import { Compass } from "./screens/Compass";
import { Explore } from "./screens/Explore";
import { Mix } from "./screens/Mix";
import { Sources } from "./screens/Sources";
import { Welcome } from "./screens/Welcome";
import { clearProfile, loadProfile, saveProfile, scenarioOf } from "./state/profile";
import type { Profile } from "./state/profile";
import type { Answers, Category } from "./model/types";

type Screen =
  | { name: "welcome" }
  | { name: "baseline" }
  | { name: "compass" }
  | { name: "explore"; category: Category }
  | { name: "mix" };

export function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [screen, setScreen] = useState<Screen>(() =>
    loadProfile() ? { name: "compass" } : { name: "welcome" },
  );
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    if (profile) saveProfile(profile);
  }, [profile]);

  const scenario = profile ? scenarioOf(profile) : null;
  const selected = profile?.selectedRecIds ?? [];

  function finishBaseline(baseline: Answers) {
    setProfile({ baseline, overrides: {}, selectedRecIds: [] });
    setScreen({ name: "compass" });
  }

  function toggleRec(id: RecId) {
    setProfile((current) => {
      if (!current) return current;
      const selectedRecIds = current.selectedRecIds.includes(id)
        ? current.selectedRecIds.filter((item) => item !== id)
        : [...current.selectedRecIds, id];
      const mixed = applyRecommendations(current.baseline, selectedRecIds);
      return {
        ...current,
        selectedRecIds,
        overrides: overridesFor(current.baseline, mixed),
      };
    });
  }

  function reset() {
    clearProfile();
    setProfile(null);
    setShowSources(false);
    setScreen({ name: "welcome" });
  }

  if (showSources && profile && scenario) {
    return (
      <Sources
        baseline={profile.baseline}
        scenario={scenario}
        onClose={() => setShowSources(false)}
      />
    );
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
          onExplore={(category) => setScreen({ name: "explore", category })}
          onMix={() => setScreen({ name: "mix" })}
          onSources={() => setShowSources(true)}
          onReset={reset}
        />
      ) : null}
      {screen.name === "explore" && profile && scenario ? (
        <Explore
          category={screen.category}
          baseline={profile.baseline}
          selected={selected}
          onToggle={toggleRec}
          onBack={() => setScreen({ name: "compass" })}
          onMix={() => setScreen({ name: "mix" })}
        />
      ) : null}
      {screen.name === "mix" && profile && scenario ? (
        <Mix
          baseline={profile.baseline}
          scenario={scenario}
          selected={selected}
          onRemove={toggleRec}
          onBack={() => setScreen({ name: "compass" })}
          onSources={() => setShowSources(true)}
        />
      ) : null}
    </>
  );
}
