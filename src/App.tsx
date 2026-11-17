import { useEffect, useRef, useState } from "react";
import { AppShell, type Destination, type PaneIndex } from "./components/AppShell";
import { overridesFor } from "./data/habits";
import { applyRecommendations, type RecId } from "./data/recommendations";
import { monthKey } from "./model/progress";
import type { CheckInSnapshot } from "./model/checkin";
import { Account } from "./screens/Account";
import { AuthGate, AuthStatus, ResetPassword } from "./screens/AuthGate";
import { Baseline } from "./screens/Baseline";
import { CheckIn } from "./screens/CheckIn";
import { Compass } from "./screens/Compass";
import { Explore, type ExploreFocus } from "./screens/Explore";
import { Together } from "./screens/Together";
import { Welcome } from "./screens/Welcome";
import { fetchAccount, saveFootprint } from "./state/accountData";
import { useAuth } from "./state/auth";
import { clearProfile, loadProfile, recordCheckIn, saveProfile, scenarioOf, withMonthRecord } from "./state/profile";
import type { Profile } from "./state/profile";
import type { Answers, Category } from "./model/types";

type Screen =
  | { name: "welcome" }
  | { name: "baseline"; editing: boolean }
  | { name: "app" }
  | { name: "check-in" }
  | { name: "account" };

const initialPanes: Record<Destination, PaneIndex> = {
  together: 0,
  explore: 0,
  impact: 0,
};

export function App() {
  const { ready, configured, session, recovery, clearRecovery } = useAuth();
  const userId = session?.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ name: "welcome" });
  const [destination, setDestination] = useState<Destination>("together");
  const [panes, setPanes] = useState<Record<Destination, PaneIndex>>(initialPanes);
  const [browseCategory, setBrowseCategory] = useState<Category>("food");
  const [exploreFocus, setExploreFocus] = useState<ExploreFocus>("for-you");
  const [exploreJump, setExploreJump] = useState(0);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const seenUser = useRef<string | null | undefined>(undefined);
  const accountReady = !userId || loadedFor === userId;

  useEffect(() => {
    if (!ready) return;
    const next = userId ?? null;
    if (seenUser.current && seenUser.current !== next) {
      clearProfile();
      setProfile(null);
      setScreen({ name: "welcome" });
    }
    seenUser.current = next;
  }, [ready, userId]);

  useEffect(() => {
    if (!ready || !configured || !userId) return;
    let cancel = false;
    void (async () => {
      const { record, error } = await fetchAccount(userId);
      if (cancel) return;
      let next = record?.footprint ?? null;
      if (!next && !error) {
        const local = loadProfile();
        if (local) {
          await saveFootprint(userId, local);
          next = local;
        }
      } else if (error) {
        next = loadProfile();
      }
      if (cancel) return;
      if (next) saveProfile(next);
      setProfile(next);
      setScreen((current) => {
        if (current.name === "baseline" || current.name === "check-in" || current.name === "account") return current;
        return next ? { name: "app" } : { name: "welcome" };
      });
      setLoadedFor(userId);
    })();
    return () => {
      cancel = true;
    };
  }, [ready, configured, userId]);

  useEffect(() => {
    if (!profile || !accountReady || !userId) return;
    const recorded = withMonthRecord(profile);
    if (recorded !== profile) {
      setProfile(recorded);
      return;
    }
    saveProfile(profile);
    void saveFootprint(userId, profile);
  }, [profile, accountReady, userId]);

  const scenario = profile ? scenarioOf(profile) : null;
  const selected = profile?.selectedRecIds ?? [];

  function finishBaseline(baseline: Answers) {
    setProfile({ baseline, overrides: {}, selectedRecIds: [], history: [], checkIns: [], baselineMonth: monthKey() });
    setDestination("impact");
    setPanes(initialPanes);
    setScreen({ name: "app" });
  }

  function openView(nextDestination: Destination, pane: PaneIndex) {
    setDestination(nextDestination);
    setPanes((current) => ({ ...current, [nextDestination]: pane }));
    setScreen({ name: "app" });
  }

  function openExplore(section: ExploreFocus) {
    setExploreFocus(section);
    setExploreJump((current) => current + 1);
    openView("explore", 0);
  }

  function showSources() {
    setSourcesOpen(true);
    openView("impact", 0);
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
    setDestination("impact");
    setPanes((current) => ({ ...current, impact: 0 }));
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

  if (!ready) return <AuthStatus label="Loading…" />;
  if (recovery && session) return <ResetPassword onDone={clearRecovery} />;
  if (!session || !userId) return <AuthGate />;
  if (!accountReady) return <AuthStatus label="Loading your footprint…" />;

  return (
    <>
      {screen.name === "account" ? (
        <Account
          userId={userId}
          email={session.user.email ?? ""}
          profile={profile}
          onBack={() => setScreen({ name: "app" })}
          onLoggedOut={() => {
            setProfile(null);
            setScreen({ name: "welcome" });
          }}
        />
      ) : null}
      {screen.name === "welcome" ? <Welcome onStart={() => setScreen({ name: "baseline", editing: false })} /> : null}
      {screen.name === "baseline" ? (
        <Baseline
          initial={profile?.baseline}
          backLabel={screen.editing ? "My Footprint" : "Back to welcome"}
          doneLabel={screen.editing ? "Update my footprint" : "See your results"}
          onBack={() => (screen.editing ? openView("impact", 0) : setScreen({ name: "welcome" }))}
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
          onAccount={() => setScreen({ name: "account" })}
          views={{
            together: [
              <Together
                key="together"
                selected={selected}
                onTry={toggleRec}
                onBrowse={(category) => {
                  setBrowseCategory(category);
                  openExplore("browse");
                }}
              />,
            ],
            explore: [
              <Explore
                key="explore"
                category={browseCategory}
                baseline={profile.baseline}
                scenario={scenario}
                selected={selected}
                focus={exploreFocus}
                focusNonce={exploreJump}
                active={destination === "explore"}
                onCategoryChange={setBrowseCategory}
                onToggle={toggleRec}
                onBack={() => openView("impact", 0)}
                onSources={showSources}
              />,
            ],
            impact: [
              <Compass
                key="footprint"
                baseline={profile.baseline}
                scenario={scenario}
                checkIns={profile.checkIns}
                baselineMonth={profile.baselineMonth}
                onEdit={() => setScreen({ name: "baseline", editing: true })}
                onCheckIn={() => setScreen({ name: "check-in" })}
                sourcesOpen={sourcesOpen}
                onSourcesOpenChange={setSourcesOpen}
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
