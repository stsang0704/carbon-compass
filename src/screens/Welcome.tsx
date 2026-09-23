import { PhoneShell } from "../components/PhoneShell";

export function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <PhoneShell>
      <div className="stack welcome">
        <div>
          <p className="kicker">Carbon Compass</p>
          <h2>Small changes, measurable impact.</h2>
        </div>
        <p className="lede">
          Have you ever wondered how small lifestyle changes could lower your carbon footprint?
          Even simple changes can make a meaningful difference. Explore your impact and discover
          realistic steps you can take to reduce it.
        </p>
        <button className="btn-primary" type="button" onClick={onStart}>
          Next.
        </button>
      </div>
    </PhoneShell>
  );
}
