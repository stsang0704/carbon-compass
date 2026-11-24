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
import { Methodology } from "./screens/Methodology";
import { Together } from "./screens/Together";
import { Welcome } from "./screens/Welcome";
import { fetchAccount, saveFootprint } from "./state/accountData";
import { useAuth } from "./state/auth";
import { loadProfilePhoto, type ProfilePhoto } from "./state/profilePhoto";
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
  const [methodFocus, setMethodFocus] = useState<string | null>(null);
  const [methodOpen, setMethodOpen] = useState(false);
  const seenUser = useRef<string | null | undefined>(undefined);
  const [entry, setEntry] = useState<"login" | "signup" | null>(null);
  const [entryUser, setEntryUser] = useState<string | null>(userId ?? null);
  const [avatar, setAvatar] = useState<ProfilePhoto>({ path: null, url: null });
  const [avatarUser, setAvatarUser] = useState<string | null>(userId ?? null);
  if ((userId ?? null) !== avatarUser) {
    setAvatarUser(userId ?? null);
    setAvatar({ path: null, url: null });
  }
  if ((userId ?? null) !== entryUser) {
    setEntryUser(userId ?? null);
    setEntry(null);
  }
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
        return next ? { name: "app" } : { name: "baseline", editing: false };
      });
      setLoadedFor(userId);
    })();
    return () => {
      cancel = true;
    };
  }, [ready, configured, userId]);

  useEffect(() => {
    if (!ready || !configured || !userId) return;
    let cancel = false;
    void loadProfilePhoto().then((photo) => {
      if (!cancel) setAvatar(photo);
    });
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

  function openMethod(focus: string | null) {
    setMethodFocus(focus);
    setMethodOpen(true);
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
  if (!session || !userId) {
    if (entry) return <AuthGate initialView={entry} onBack={() => setEntry(null)} />;
    return <Welcome onGetStarted={() => setEntry("signup")} onSignIn={() => setEntry("login")} />;
  }
  if (!accountReady) return <AuthStatus label="Loading your footprint…" />;

  return (
    <>
      {screen.name === "account" ? (
        <div hidden={methodOpen}>
          <Account
            userId={userId}
            email={session.user.email ?? ""}
            profile={profile}
            avatar={avatar}
            onAvatarChange={setAvatar}
            onBack={() => setScreen({ name: "app" })}
            onLoggedOut={() => {
              setProfile(null);
              setScreen({ name: "welcome" });
            }}
            onMethod={() => openMethod(null)}
          />
        </div>
      ) : null}
      {screen.name === "baseline" ? (
        <Baseline
          initial={profile?.baseline}
          backLabel={screen.editing ? "My Footprint" : "Back"}
          doneLabel={screen.editing ? "Update my footprint" : "See your results"}
          onBack={screen.editing ? () => openView("impact", 0) : undefined}
          onDone={screen.editing ? editBaseline : finishBaseline}
        />
      ) : null}
      {screen.name === "app" && profile && scenario ? (
        <div className="app-frame" hidden={methodOpen}>
        <AppShell
          destination={destination}
          panes={panes}
          onDestination={setDestination}
          onPane={(nextDestination, pane) =>
            setPanes((current) => ({ ...current, [nextDestination]: pane }))
          }
          avatarUrl={avatar.url}
          onAccount={() => setScreen({ name: "account" })}
          views={{
            together: [
              <Together
                key="together"
                selected={selected}
                onTry={toggleRec}
                profilePhotoUrl={avatar.url}
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
                onExplain={openMethod}
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
        </div>
      ) : null}
      {methodOpen && profile && scenario ? (
        <Methodology
          baseline={profile.baseline}
          focusId={methodFocus}
          onClose={() => setMethodOpen(false)}
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
