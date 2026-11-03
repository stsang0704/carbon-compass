import { useEffect, useState } from "react";
import { AppShell, type Destination, type PaneIndex } from "./components/AppShell";
import { overridesFor } from "./data/habits";
import { applyRecommendations, type RecId } from "./data/recommendations";
import { monthKey } from "./model/progress";
import type { CheckInSnapshot } from "./model/checkin";
import { Baseline } from "./screens/Baseline";
import { CheckIn } from "./screens/CheckIn";
import { Compass } from "./screens/Compass";
import { Explore } from "./screens/Explore";
import { Mix } from "./screens/Mix";
import { Plan } from "./screens/Plan";
import { Together } from "./screens/Together";
import { Welcome } from "./screens/Welcome";
import { loadProfile, recordCheckIn, saveProfile, scenarioOf, withMonthRecord } from "./state/profile";
import type { Profile } from "./state/profile";
import type { Answers, Category } from "./model/types";

type Screen =
  | { name: "welcome" }
  | { name: "baseline"; editing: boolean }
  | { name: "app" }
  | { name: "check-in" };

const initialPanes: Record<Destination, PaneIndex> = {
  footprint: 0,
  explore: 0,
  impact: 0,
  together: 0,
};

export function App() {
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [screen, setScreen] = useState<Screen>(() => (loadProfile() ? { name: "app" } : { name: "welcome" }));
  const [destination, setDestination] = useState<Destination>("footprint");
  const [panes, setPanes] = useState<Record<Destination, PaneIndex>>(initialPanes);
  const [browseCategory, setBrowseCategory] = useState<Category>("food");
  const [sourcesOpen, setSourcesOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const recorded = withMonthRecord(profile);
    if (recorded !== profile) {
      setProfile(recorded);
      return;
    }
    saveProfile(profile);
  }, [profile]);

  const scenario = profile ? scenarioOf(profile) : null;
  const selected = profile?.selectedRecIds ?? [];

  function finishBaseline(baseline: Answers) {
    setProfile({ baseline, overrides: {}, selectedRecIds: [], history: [], checkIns: [], baselineMonth: monthKey() });
    setDestination("footprint");
    setPanes(initialPanes);
    setScreen({ name: "app" });
  }

  function openView(nextDestination: Destination, pane: PaneIndex) {
    setDestination(nextDestination);
    setPanes((current) => ({ ...current, [nextDestination]: pane }));
    setScreen({ name: "app" });
  }

  function showSources() {
    setSourcesOpen(true);
    openView("footprint", 0);
  }

  function editBaseline(baseline: Answers) {
    setProfile((current) => {
      if (!current) return current;
      const mixed = applyRecommendations(baseline, current.selectedRecIds);
      return {
        ...current,
        baseline,
        overrides: overridesFor(baseline, mixed),
      };
    });
    setDestination("footprint");
    setPanes((current) => ({ ...current, footprint: 0 }));
    setScreen({ name: "app" });
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

  function saveCheckIn(snapshot: CheckInSnapshot) {
    setProfile((current) => (current ? recordCheckIn(current, snapshot) : current));
  }

  return (
    <>
      {screen.name === "welcome" ? <Welcome onStart={() => setScreen({ name: "baseline", editing: false })} /> : null}
      {screen.name === "baseline" ? (
        <Baseline
          initial={profile?.baseline}
          backLabel={screen.editing ? "My Footprint" : "Back to welcome"}
          doneLabel={screen.editing ? "Update my footprint" : "See your results"}
          onBack={() => (screen.editing ? openView("footprint", 0) : setScreen({ name: "welcome" }))}
          onDone={screen.editing ? editBaseline : finishBaseline}
        />
      ) : null}
      {screen.name === "app" && profile && scenario ? (
        <AppShell
          destination={destination}
          panes={panes}
          onDestination={setDestination}
          onPane={(nextDestination, pane) =>
            setPanes((current) => ({ ...current, [nextDestination]: pane }))
          }
          views={{
            footprint: [
              <Compass
                key="overview"
                baseline={profile.baseline}
                scenario={scenario}
                onExplore={() => openView("explore", 0)}
                onBrowse={(category) => {
                  setBrowseCategory(category);
                  openView("explore", 1);
                }}
                onEdit={() => setScreen({ name: "baseline", editing: true })}
                sourcesOpen={sourcesOpen}
                onSourcesOpenChange={setSourcesOpen}
              />,
            ],
            explore: [
              <Plan
                key="for-you"
                baseline={profile.baseline}
                selected={selected}
                onToggle={toggleRec}
                onBack={() => openView("footprint", 0)}
                onMix={() => openView("explore", 2)}
                onSources={showSources}
              />,
              <Explore
                key="browse"
                category={browseCategory}
                baseline={profile.baseline}
                selected={selected}
                onCategoryChange={setBrowseCategory}
                onToggle={toggleRec}
                onBack={() => openView("footprint", 0)}
                onMix={() => openView("explore", 2)}
                onSources={showSources}
              />,
              <Mix
                key="potential"
                view="potential"
                baseline={profile.baseline}
                scenario={scenario}
                selected={selected}
                checkIns={profile.checkIns}
                baselineMonth={profile.baselineMonth}
                onRemove={toggleRec}
                onBack={() => openView("footprint", 0)}
                onPlan={() => openView("explore", 0)}
                onCheckIn={() => setScreen({ name: "check-in" })}
                onSources={showSources}
              />,
            ],
            impact: [
              <Mix
                key="progress"
                view="progress"
                baseline={profile.baseline}
                scenario={scenario}
                selected={selected}
                checkIns={profile.checkIns}
                baselineMonth={profile.baselineMonth}
                onRemove={toggleRec}
                onBack={() => openView("footprint", 0)}
                onPlan={() => openView("explore", 0)}
                onCheckIn={() => setScreen({ name: "check-in" })}
                onSources={showSources}
              />,
            ],
            together: [
              <Together
                key="together"
                onSeeChange={(category) => {
                  setBrowseCategory(category);
                  openView("explore", 1);
                }}
              />,
            ],
          }}
        />
      ) : null}
      {screen.name === "check-in" && profile ? (
        <CheckIn
          baseline={profile.baseline}
          checkIns={profile.checkIns}
          selected={selected}
          onSave={saveCheckIn}
          onBack={() => openView("impact", 0)}
          onDone={() => openView("impact", 0)}
        />
      ) : null}
    </>
  );
}
