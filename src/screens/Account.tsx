import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { LogOut, Mail, UserRound } from "lucide-react";
import { PhoneShell } from "../components/PhoneShell";
import { ProfileMark } from "../components/ProfileMark";
import { supabase } from "../lib/supabase";
import { fetchAccount, saveDisplayName, saveFootprint } from "../state/accountData";
import { profilePhotoError, removeProfilePhoto, saveProfilePhoto, type ProfilePhoto } from "../state/profilePhoto";
import { clearProfile, type Profile } from "../state/profile";

export function Account({
  userId,
  email,
  profile,
  avatar,
  onAvatarChange,
  onBack,
  onLoggedOut,
  onMethod,
}: {
  userId: string;
  email: string;
  profile: Profile | null;
  avatar: ProfilePhoto;
  onAvatarChange: (photo: ProfilePhoto) => void;
  onBack: () => void;
  onLoggedOut: () => void;
  onMethod: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [savedName, setSavedName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoNotice, setPhotoNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pending, setPending] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const previewUrl = useRef<string | null>(null);
  const photoInputId = useId();

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

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  function replacePreview(next: string | null) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = next;
    setPreview(next);
  }

  function choosePhoto(file: File | null) {
    if (!file) return;
    const problem = profilePhotoError(file);
    if (problem) {
      setPhotoError(problem);
      setPhotoNotice("");
      return;
    }
    replacePreview(URL.createObjectURL(file));
    setPending(file);
    setPhotoError("");
    setPhotoNotice("");
  }

  function cancelPreview() {
    replacePreview(null);
    setPending(null);
  }

  async function onSavePhoto() {
    if (!pending) return;
    setPhotoBusy(true);
    setPhotoError("");
    setPhotoNotice("");
    const result = await saveProfilePhoto(userId, pending, avatar.path);
    setPhotoBusy(false);
    if (result.error) {
      setPhotoError(result.error);
      return;
    }
    onAvatarChange(result.photo);
    cancelPreview();
    setPhotoNotice("Profile photo saved.");
  }

  async function onRemovePhoto() {
    setPhotoBusy(true);
    setPhotoError("");
    setPhotoNotice("");
    const removeError = await removeProfilePhoto(userId, avatar.path);
    setPhotoBusy(false);
    if (removeError) {
      setPhotoError(removeError);
      return;
    }
    onAvatarChange({ path: null, url: null });
    setPhotoNotice("Profile photo removed.");
  }

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
      <section className="profile-photo" aria-label="Profile photo">
        <span className="profile-photo-frame">
          <ProfileMark
            url={preview ?? avatar.url}
            className="profile-photo-image"
            alt={preview ? "Profile photo preview" : "Your profile photo"}
            fallback={<UserRound size={32} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />}
          />
        </span>
        <input
          id={photoInputId}
          className="profile-photo-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={photoBusy || loggingOut}
          onChange={(event) => {
            choosePhoto(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <label className="btn-secondary profile-photo-choose" htmlFor={photoInputId}>
          Change profile photo
        </label>
        {pending ? (
          <>
            <button className="btn-primary" type="button" onClick={onSavePhoto} disabled={photoBusy || loggingOut}>
              {photoBusy ? "Saving…" : "Save photo"}
            </button>
            <button className="btn-secondary" type="button" onClick={cancelPreview} disabled={photoBusy || loggingOut}>
              Cancel
            </button>
          </>
        ) : null}
        {avatar.path && !pending ? (
          <button className="btn-secondary" type="button" onClick={onRemovePhoto} disabled={photoBusy || loggingOut}>
            {photoBusy ? "Removing…" : "Remove photo"}
          </button>
        ) : null}
        {photoNotice ? <p className="auth-note">{photoNotice}</p> : null}
        {photoError ? <p className="auth-error">{photoError}</p> : null}
        <p className="quiet">JPEG, PNG, or WebP, up to 5 MB.</p>
      </section>
      <section className="account-card">
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
      <button className="btn-secondary" type="button" onClick={onMethod}>
        Where the numbers come from
      </button>
      <button className="btn-primary account-logout" type="button" onClick={onLogOut} disabled={loggingOut || busy || photoBusy}>
        <LogOut size={18} strokeWidth={1.75} absoluteStrokeWidth aria-hidden="true" />
        {loggingOut ? "Logging out…" : "Log out"}
      </button>
    </PhoneShell>
  );
}
