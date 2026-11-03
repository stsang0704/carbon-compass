import { useState } from "react";
import { difficultyLabel, recommendationNote, recommendationSavedKg, type Recommendation } from "../data/recommendations";
import { shareOfTypicalYear } from "../model/compare";
import type { Answers } from "../model/types";

type Props = {
  rec: Recommendation;
  baseline: Answers;
  added: boolean;
  rank?: number;
  savedKg?: number;
  showWhy?: boolean;
  onToggle: () => void;
};

export function RecommendationCard({ rec, baseline, added, rank, savedKg, showWhy = false, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const saved = savedKg ?? recommendationSavedKg(baseline, rec);
  const share = shareOfTypicalYear(saved);
  const note = recommendationNote(baseline, rec);
  return (
    <article className={`rec-card ${open ? "is-open" : ""} ${added ? "is-added" : ""}`}>
      <button className="rec-head" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        {rank ? <span className="rec-rank">{rank}</span> : null}
        <span className="rec-title">{rec.title}</span>
        <span className="rec-arrow" aria-hidden="true">
          →
        </span>
      </button>
      <div className="rec-stats">
        <p className={`difficulty-pill difficulty-${rec.difficulty}`}>{difficultyLabel[rec.difficulty]}</p>
        <p className="rec-impact">↓ {Math.round(saved).toLocaleString("en-US")} kg CO₂e / year</p>
        <p className="rec-share">{share.label}</p>
      </div>
      {showWhy ? <p className="rec-why">{rec.why}</p> : null}
      <div className="rec-panel">
        <div className="rec-panel-inner">
          <h4>How to start</h4>
          <p>{rec.how}</p>
          {showWhy ? null : (
            <>
              <h4>Why it helps</h4>
              <p>{rec.why}</p>
            </>
          )}
          {note ? <p>{note}</p> : null}
        </div>
      </div>
      <div className="rec-actions">
        <button className={`btn-primary rec-add ${added ? "is-added" : ""}`} type="button" onClick={onToggle}>
          {added ? "Trying this ✓" : "Try this change."}
        </button>
        {added ? <p className="rec-confirm">Added to your impact. Overlapping cuts are counted once.</p> : null}
      </div>
    </article>
  );
}
