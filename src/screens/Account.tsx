import { useEffect, useState, type FormEvent } from "react";
import { LogOut, Mail, UserRound } from "lucide-react";
import { PhoneShell } from "../components/PhoneShell";
import { supabase } from "../lib/supabase";
import { fetchAccount, saveDisplayName, saveFootprint } from "../state/accountData";
import { clearProfile, type Profile } from "../state/profile";

export function Account({
  userId,
  email,
  profile,
  onBack,
  onLoggedOut,
}: {
  userId: string;
  email: string;
  profile: Profile | null;
  onBack: () => void;
  onLoggedOut: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancel = false;
    void fetchAccount(userId).then(({ record, error: loadError }) => {
      if (cancel) return;
      if (loadError) {
        setError(loadError);
        return;
      }
      const name = record?.displayName ?? "";
      setDisplayName(name);
      setSavedName(name);
    });
    return () => {
      cancel = true;
    };
  }, [userId]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    const name = displayName.trim();
    if (!name) {
      setError("Add a display name.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    const saveError = await saveDisplayName(userId, name);
    setBusy(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    setSavedName(name);
    setDisplayName(name);
    setNotice("Name saved.");
  }

  async function onLogOut() {
    if (!supabase) return;
    setLoggingOut(true);
    setError("");
    if (profile) {
      const saveError = await saveFootprint(userId, profile);
      if (saveError) {
        setLoggingOut(false);
        setError(`Your footprint could not be saved to your account, so you are still signed in. ${saveError}`);
        return;
      }
    }
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      setLoggingOut(false);
      setError(signOutError.message);
      return;
    }
    clearProfile();
    onLoggedOut();
  }

  const shownName = savedName || "Your profile";

  return (
    <PhoneShell
      onBack={onBack}
      backLabel="Back"
      hero={
        <>
          <p className="kicker">Profile</p>
          <h2>Settings</h2>
          <p className="lede">Your name and email stay with this account.</p>
        </>
      }
    >
      <section className="account-card">
        <span className="glyph welcome-glyph" aria-hidden="true">
          <UserRound size={22} strokeWidth={1.75} absoluteStrokeWidth />
        </span>
        <div>
          <p className="plant-title">{shownName}</p>
          <p className="account-email">
            <Mail size={16} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
            {email || "No email on this account"}
          </p>
        </div>
      </section>
      <form className="auth-form" onSubmit={onSave}>
        <label>
          Display name
          <input
            className="auth-field"
            type="text"
            autoComplete="nickname"
            maxLength={40}
            required
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        {notice ? <p className="auth-note">{notice}</p> : null}
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="btn-secondary" type="submit" disabled={busy || loggingOut}>
          {busy ? "Saving…" : "Save name"}
        </button>
      </form>
      <button className="btn-primary account-logout" type="button" onClick={onLogOut} disabled={loggingOut || busy}>
        <LogOut size={18} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </PhoneShell>
  );
}
