import { CategoryBreakdown, CategoryGlyph } from "../components/CategoryBreakdown";
import { PhoneShell } from "../components/PhoneShell";
import { attributedSavedKg, recommendationById, type RecId } from "../data/recommendations";
import { calculate } from "../model/calculate";
import type { CheckInSnapshot } from "../model/checkin";
import { formatCarbonSaved, savedEquivalence } from "../model/format";
import type { Answers } from "../model/types";
import { categories } from "../model/types";

type Props = {
  baseline: Answers;
  scenario: Answers;
  selected: RecId[];
  checkIns: CheckInSnapshot[];
  baselineMonth: string | null;
  onRemove: (id: RecId) => void;
  onBack: () => void;
  onPlan: () => void;
  onSources: () => void;
};

export function Mix(props: Props) {
  return <PotentialView {...props} />;
}

function PotentialView({ baseline, scenario, selected, onRemove, onBack, onPlan, onSources }: Props) {
  const current = calculate(baseline);
  const next = calculate(scenario);
  const count = selected.length;
  const savedKg = current.totals.carbon - next.totals.carbon;
  const equivalence = savedEquivalence(savedKg);
  const hasSaving = equivalence.kind !== "none";
  const attributed = attributedSavedKg(baseline, selected);

  return (
    <PhoneShell
      onBack={onBack}
      backLabel="My Footprint"
      hero={
        count === 0 ? (
          <>
            <p className="kicker">Potential Impact</p>
            <h2>Start with one change.</h2>
          </>
        ) : (
          <>
            <p className="kicker">Potential Impact</p>
            <p className="hero-count">{count} selected</p>
            {hasSaving ? (
              <>
                <h2 className={equivalence.kind === "miles" ? "hero-gallons" : "hero-trees"}>
                  {equivalence.heading}
                </h2>
                {equivalence.unit ? <p className="hero-gallons-unit">{equivalence.unit}</p> : null}
                <p className="hero-carbon">{formatCarbonSaved(savedKg)}</p>
              </>
            ) : (
              <h2>Selected</h2>
            )}
          </>
        )
      }
    >
      <div className="section-head">
        <h3>Your selected changes</h3>
      </div>
      {count === 0 ? (
        <p className="quiet">Nothing selected yet.</p>
      ) : (
        <div className="habit-list">
          {selected.map((id) => {
            const rec = recommendationById(id);
            const saved = attributed[id] ?? 0;
            const area = categories.find((item) => item.id === rec.category);
            return (
              <div key={id} className="plant-card habit-row changed rec-mix-row">
                <CategoryGlyph id={rec.category} />
                <span className="plant-copy">
                  <span className="plant-title">{rec.title}</span>
                  <span className="plant-sub">
                    {area?.label} · ↓ {Math.round(saved).toLocaleString("en-US")} kg
                  </span>
                </span>
                <button className="text-button rec-remove" type="button" onClick={() => onRemove(id)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
      {count > 0 ? (
        <CategoryBreakdown
          title="Your Potential Savings"
          footprint={next}
          before={current}
        />
      ) : (
        <button className="btn-primary" type="button" onClick={onPlan}>
          Open your action plan
        </button>
      )}
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
    </PhoneShell>
  );
}
