import { useState } from "react";
import { PhoneShell } from "../components/PhoneShell";
import {
  recommendationNote,
  recommendationSavedKg,
  recommendationsIn,
  type RecId,
  type Recommendation,
} from "../data/recommendations";
import type { Answers, Category } from "../model/types";
import { categories } from "../model/types";

type Props = {
  category: Category;
  baseline: Answers;
  selected: RecId[];
  onToggle: (id: RecId) => void;
  onBack: () => void;
  onMix: () => void;
};

export function Explore({ category, baseline, selected, onToggle, onBack, onMix }: Props) {
  const area = categories.find((item) => item.id === category);
  const [openId, setOpenId] = useState<RecId | null>(null);
  const small = recommendationsIn(category, "ease");
  const bigger = recommendationsIn(category, "further");

  return (
    <PhoneShell
      onBack={onBack}
      backLabel="Ways to lower your emissions"
      kicker={area?.label ?? "Explore"}
      action={
        <button className="text-button" type="button" onClick={onMix}>
          Your Impact
        </button>
      }
    >
      <section className="rec-section">
        <h3>Small changes</h3>
        <p className="quiet">Simple changes you can start with.</p>
        <div className="rec-list">
          {small.map((rec) => (
            <RecommendationRow
              key={rec.id}
              rec={rec}
              baseline={baseline}
              open={openId === rec.id}
              added={selected.includes(rec.id)}
              onToggleOpen={() => setOpenId((current) => (current === rec.id ? null : rec.id))}
              onToggleAdd={() => onToggle(rec.id)}
            />
          ))}
        </div>
      </section>
      <section className="rec-section">
        <h3>Bigger changes</h3>
        <p className="quiet">Ready to go further?</p>
        <div className="rec-list">
          {bigger.map((rec) => (
            <RecommendationRow
              key={rec.id}
              rec={rec}
              baseline={baseline}
              open={openId === rec.id}
              added={selected.includes(rec.id)}
              onToggleOpen={() => setOpenId((current) => (current === rec.id ? null : rec.id))}
              onToggleAdd={() => onToggle(rec.id)}
            />
          ))}
        </div>
      </section>
    </PhoneShell>
  );
}

function RecommendationRow({
  rec,
  baseline,
  open,
  added,
  onToggleOpen,
  onToggleAdd,
}: {
  rec: Recommendation;
  baseline: Answers;
  open: boolean;
  added: boolean;
  onToggleOpen: () => void;
  onToggleAdd: () => void;
}) {
  const saved = recommendationSavedKg(baseline, rec);
  const note = recommendationNote(baseline, rec);
  return (
    <article className={`rec-card ${open ? "is-open" : ""} ${added ? "is-added" : ""}`}>
      <button className="rec-head" type="button" onClick={onToggleOpen} aria-expanded={open}>
        <span className="rec-title">{rec.title}</span>
        <span className="rec-arrow" aria-hidden="true">
          →
        </span>
      </button>
      <div className="rec-panel">
        <div className="rec-panel-inner">
          <h4>How to start</h4>
          <p>{rec.how}</p>
          <h4>Why it helps</h4>
          <p>{rec.why}</p>
          <h4>Your estimated impact</h4>
          <p className="rec-impact">↓ {Math.round(saved).toLocaleString("en-US")} kg CO₂e / year</p>
          {note ? <p>{note}</p> : null}
          <button
            className={`btn-primary rec-add ${added ? "is-added" : ""}`}
            type="button"
            onClick={onToggleAdd}
          >
            {added ? "Added ✓" : "Add to my changes"}
          </button>
          {added ? <p className="rec-confirm">Added to your impact scenario.</p> : null}
        </div>
      </div>
    </article>
  );
}
