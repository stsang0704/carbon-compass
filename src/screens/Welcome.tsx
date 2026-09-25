import { PhoneShell } from "../components/PhoneShell";

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <PhoneShell
      hero={
        <>
          <p className="kicker">Carbon Compass</p>
          <h2>Small changes, measurable impact.</h2>
          <p className="lede">
            Have you ever wondered how small lifestyle changes could lower your carbon footprint?
          </p>
        </>
      }
      overlap={
        <div className="plant-card welcome-card">
          <span className="glyph" aria-hidden="true">
            🌱
          </span>
          <span className="plant-copy">
            <span className="plant-title">Even simple changes can make a meaningful difference.</span>
            <span className="plant-sub">
              Explore your impact and discover realistic steps you can take to reduce it.
            </span>
          </span>
        </div>
      }
    >
      <button className="btn-primary" type="button" onClick={onStart}>
        Next.
      </button>
    </PhoneShell>
  );
}
