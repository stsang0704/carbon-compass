import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  kicker?: string;
  onBack?: () => void;
  backLabel?: string;
  action?: ReactNode;
};

export function PhoneShell({ children, kicker, onBack, backLabel = "Back", action }: Props) {
  return (
    <div className="phone">
      {kicker || onBack || action ? (
        <div className="topbar">
          {onBack ? (
            <button className="icon-button" type="button" onClick={onBack} aria-label={backLabel}>
              ‹
            </button>
          ) : (
            <span className="topbar-spacer" />
          )}
          {kicker ? <p className="screen-kicker">{kicker}</p> : <span className="topbar-spacer" />}
          {action ?? <span className="topbar-spacer" />}
        </div>
      ) : null}
      <div className={kicker || onBack ? "phone-scroll with-header" : "phone-scroll"}>{children}</div>
    </div>
  );
}
