import { useState, type FormEvent } from "react";
import { Leaf } from "lucide-react";
import { BrandLockup } from "../components/Illustrations";
import { PhoneShell } from "../components/PhoneShell";
import { supabase } from "../lib/supabase";
import { useAuth } from "../state/auth";

type View = "login" | "signup" | "forgot" | "check-email";

export function AuthGate({ initialView = "login", onBack }: { initialView?: "login" | "signup"; onBack: () => void }) {
  const { configured } = useAuth();
  const [view, setView] = useState<View>(initialView);
  const [notice, setNotice] = useState("");
  const atWelcome = view === "login" || view === "signup";

  return (
    <PhoneShell
      onBack={atWelcome ? () => { setNotice(""); onBack(); } : () => { setNotice(""); setView("login"); }}
      backLabel={atWelcome ? "Back" : "Back to log in"}
      hero={
        <>
          <BrandLockup />
          <h2>{heading(view)}</h2>
          <p className="lede">{lede(view)}</p>
        </>
      }
    >
      {configured ? null : (
        <p className="auth-note">
          Add your Supabase URL and anon key to a file named .env.local, then restart the app. Use the public anon key. Do not put the service-role key in the app.
        </p>
      )}
      {view === "login" ? (
        <LoginForm
          disabled={!configured}
          notice={notice}
          onSignup={() => { setNotice(""); setView("signup"); }}
          onForgot={() => { setNotice(""); setView("forgot"); }}
        />
      ) : null}
      {view === "signup" ? (
        <SignupForm
          disabled={!configured}
          onSent={() => setView("check-email")}
          onLogin={() => setView("login")}
        />
      ) : null}
      {view === "forgot" ? (
        <ForgotForm
          disabled={!configured}
          onSent={(address) => {
            setNotice(`If an account exists for ${address}, a reset link is on its way.`);
            setView("login");
          }}
        />
      ) : null}
      {view === "check-email" ? (
        <div className="stack">
          <p className="auth-note">Open the confirmation link in your email, then come back and log in. The link expires if it sits too long.</p>
          <button className="btn-primary" type="button" onClick={() => setView("login")}>
            Back to log in
          </button>
        </div>
      ) : null}
    </PhoneShell>
  );
}

export function ResetPassword({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    window.history.replaceState(null, "", window.location.pathname);
    onDone();
  }

  return (
    <PhoneShell
      hero={
        <>
          <BrandLockup />
          <h2>Choose a new password.</h2>
          <p className="lede">Use at least 6 characters. You’ll stay signed in on this device.</p>
        </>
      }
    >
      <form className="auth-form" onSubmit={onSubmit}>
        <label>
          New password
          <input
            className="auth-field"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </PhoneShell>
  );
}

function LoginForm({
  disabled,
  notice,
  onSignup,
  onForgot,
}: {
  disabled: boolean;
  notice: string;
  onSignup: () => void;
  onForgot: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (!signInError) return;
    setError(signInError.message === "Email not confirmed" ? "Confirm your email before logging in. Check your inbox for the link." : signInError.message);
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <EmailField value={email} onChange={setEmail} />
      <PasswordField value={password} onChange={setPassword} autoComplete="current-password" />
      {notice ? <p className="auth-note">{notice}</p> : null}
      {error ? <p className="auth-error">{error}</p> : null}
      <button className="btn-primary" type="submit" disabled={disabled || busy}>
        {busy ? "Logging in…" : "Log in"}
      </button>
      <button className="btn-secondary" type="button" onClick={onSignup}>
        Create account
      </button>
      <button className="text-button auth-text-button" type="button" onClick={onForgot}>
        Forgot password
      </button>
    </form>
  );
}

function SignupForm({
  disabled,
  onSent,
  onLogin,
}: {
  disabled: boolean;
  onSent: () => void;
  onLogin: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const name = displayName.trim();
    if (!name) {
      setError("Add a display name.");
      return;
    }
    setBusy(true);
    setError("");
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError("An account with this email already exists. Log in instead.");
      return;
    }
    if (!data.session) onSent();
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
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
      <EmailField value={email} onChange={setEmail} />
      <PasswordField value={password} onChange={setPassword} autoComplete="new-password" />
      {error ? <p className="auth-error">{error}</p> : null}
      <button className="btn-primary" type="submit" disabled={disabled || busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>
      <button className="text-button auth-text-button" type="button" onClick={onLogin}>
        I already have an account
      </button>
    </form>
  );
}

function ForgotForm({ disabled, onSent }: { disabled: boolean; onSent: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError("");
    const address = email.trim();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: window.location.origin,
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    onSent(address);
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <EmailField value={email} onChange={setEmail} />
      {error ? <p className="auth-error">{error}</p> : null}
      <button className="btn-primary" type="submit" disabled={disabled || busy}>
        {busy ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}

function EmailField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label>
      Email
      <input
        className="auth-field"
        type="email"
        autoComplete="email"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function PasswordField({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label>
      Password
      <input
        className="auth-field"
        type="password"
        autoComplete={autoComplete}
        minLength={6}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function heading(view: View) {
  if (view === "signup") return "Create your account.";
  if (view === "forgot") return "Reset your password.";
  if (view === "check-email") return "Check your email.";
  return "Welcome back.";
}

function lede(view: View) {
  if (view === "signup") return "Use your email, a password, and the name you want on your profile.";
  if (view === "forgot") return "We’ll email you a link to choose a new password.";
  if (view === "check-email") return "Confirm your address before you sign in.";
  return "Log in to open your footprint. Small changes, measurable impact.";
}

export function AuthStatus({ label }: { label: string }) {
  return (
    <div className="phone">
      <div className="stage">
        <span className="glyph welcome-glyph" aria-hidden="true">
          <Leaf size={22} strokeWidth={1.75} absoluteStrokeWidth />
        </span>
        <p className="quiet">{label}</p>
      </div>
    </div>
  );
}
