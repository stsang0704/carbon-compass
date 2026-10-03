import { MetricStrips } from "../components/MetricStrips";
import { PhoneShell } from "../components/PhoneShell";
import { recommendationById, recommendationSavedKg, type RecId } from "../data/recommendations";
import { calculate } from "../model/calculate";
import { formatCarbonSaved, savedEquivalence } from "../model/format";
import type { Answers, Category } from "../model/types";
import { AVERAGES_NOTE, categories } from "../model/types";

const marks: Record<Category, string> = {
  food: "🌱",
  travel: "🚲",
  home: "🏠",
  stuff: "📦",
};

type Props = {
  baseline: Answers;
  scenario: Answers;
  selected: RecId[];
  onRemove: (id: RecId) => void;
  onBack: () => void;
  onSources: () => void;
};

export function Mix({ baseline, scenario, selected, onRemove, onBack, onSources }: Props) {
  const current = calculate(baseline);
  const next = calculate(scenario);
  const count = selected.length;
  const savedKg = current.totals.carbon - next.totals.carbon;
  const equivalence = savedEquivalence(savedKg);
  const hasSaving = equivalence.kind !== "none";
  const changeLine = count === 1 ? "1 change. It adds up." : `${count} changes. They add up.`;

  return (
    <PhoneShell
      onBack={onBack}
      hero={
        count === 0 ? (
          <>
            <p className="kicker">Your Impact</p>
            <h2>Your impact starts with one change.</h2>
            <p className="lede">
              Explore Food, Travel, Home, and Clothing to find realistic changes that work for you.
            </p>
          </>
        ) : (
          <>
            <p className="kicker">Your Impact</p>
            <p className="hero-count">{changeLine}</p>
            {hasSaving ? (
              <>
                <h2 className={equivalence.kind === "miles" ? "hero-gallons" : "hero-trees"}>
                  {equivalence.heading}
                </h2>
                {equivalence.unit ? <p className="hero-gallons-unit">{equivalence.unit}</p> : null}
                <p className="lede">{equivalence.line}</p>
                <p className="hero-carbon">{formatCarbonSaved(savedKg)}</p>
              </>
            ) : null}
            <p className={hasSaving ? "hero-close" : "lede"}>
              Small individual choices add up. What you do matters.
            </p>
          </>
        )
      }
      overlap={
        <MetricStrips totals={next.totals} baseline={count > 0 ? current.totals : undefined} />
      }
    >
      <p className="disclaimer">{AVERAGES_NOTE}</p>
      <div className="habit-list">
        {selected.map((id) => {
          const rec = recommendationById(id);
          const saved = recommendationSavedKg(baseline, rec);
          const area = categories.find((item) => item.id === rec.category);
          return (
            <div key={id} className="plant-card habit-row changed rec-mix-row">
              <span className={`glyph glyph-${rec.category}`} aria-hidden="true">
                {marks[rec.category]}
              </span>
              <span className="plant-copy">
                <span className="plant-top">
                  <span className="plant-title">{rec.title}</span>
                  <span className={`status-pill ${saved > 0 ? "status-live" : ""}`}>
                    ↓ {Math.round(saved).toLocaleString("en-US")} kg
                  </span>
                </span>
                <span className="plant-sub">{area?.label}</span>
              </span>
              <button className="text-button rec-remove" type="button" onClick={() => onRemove(id)}>
                Remove
              </button>
            </div>
          );
        })}
      </div>
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
    </PhoneShell>
  );
}
