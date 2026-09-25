import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  kicker?: string;
  onBack?: () => void;
  backLabel?: string;
  action?: ReactNode;
  hero?: ReactNode;
  overlap?: ReactNode;
};

export function PhoneShell({
  children,
  kicker,
  onBack,
  backLabel = "Back",
  action,
  hero,
  overlap,
}: Props) {
  const nav = Boolean(onBack || action || (kicker && !hero));
  return (
    <div className={`phone ${hero ? "split" : "plain"}`}>
      <header className="hero">
        {nav ? (
          <div className="topbar">
            {onBack ? (
              <button className="icon-button" type="button" onClick={onBack} aria-label={backLabel}>
                ‹
              </button>
            ) : (
              <span className="topbar-spacer" />
            )}
            {kicker && !hero ? <p className="screen-kicker">{kicker}</p> : <span className="topbar-spacer" />}
            {action ?? <span className="topbar-spacer" />}
          </div>
        ) : null}
        {hero ? <div className="hero-copy">{hero}</div> : null}
      </header>
      <div className={`stage ${overlap ? "has-overlap" : ""}`}>
        {overlap ? <div className="overlap">{overlap}</div> : null}
        <div className="stage-body">{children}</div>
      </div>
    </div>
  );
}
