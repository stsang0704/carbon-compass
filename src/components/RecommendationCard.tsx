import { useState } from "react";
import { CategoryGlyph } from "./CategoryBreakdown";
import { difficultyLabel, recommendationNote, recommendationSavedKg, type Recommendation } from "../data/recommendations";
import { shareOfTypicalYear } from "../model/compare";
import type { Answers } from "../model/types";
import { categories } from "../model/types";

type Props = {
  rec: Recommendation;
  baseline: Answers;
  added: boolean;
  rank?: number;
  savedKg?: number;
  showDifficulty?: boolean;
  showCategory?: boolean;
  impactAsPill?: boolean;
  onMethod?: () => void;
  onToggle: () => void;
};

export function RecommendationCard({
  rec,
  baseline,
  added,
  rank,
  savedKg,
  showDifficulty = true,
  showCategory = true,
  impactAsPill = false,
  onMethod,
  onToggle,
}: Props) {
  const [open, setOpen] = useState(false);
  const saved = savedKg ?? recommendationSavedKg(baseline, rec);
  const share = shareOfTypicalYear(saved);
  const note = recommendationNote(baseline, rec);
  const shareTag = shortShare(share.percent);
  const categoryLabel = categories.find((item) => item.id === rec.category)?.label;
  const impactLabel = `↓ ${Math.round(saved).toLocaleString("en-US")} kg CO₂e / year`;
  return (
    <article className={`rec-card ${open ? "is-open" : ""} ${added ? "is-added" : ""}`}>
      <button className="rec-head" type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <CategoryGlyph id={rec.category} size={20} />
        <span className="rec-title">
          {rank ? <span className="rec-rank">{rank}</span> : null}
          {rec.title}
        </span>
        <span className="rec-details">{open ? "Hide" : "Details"}</span>
      </button>
      <div className="rec-tags">
        {showCategory && categoryLabel ? <p className="rec-category">{categoryLabel}</p> : null}
        {showDifficulty ? (
          <p className={`difficulty-pill difficulty-${rec.difficulty}`}>{difficultyLabel[rec.difficulty]}</p>
        ) : null}
        {shareTag ? <p className="rec-share-tag">{shareTag}</p> : null}
        {impactAsPill ? <p className="rec-share-tag">{impactLabel}</p> : null}
      </div>
      {impactAsPill ? null : <p className="rec-impact">{impactLabel}</p>}
      {added ? <p className="rec-added-label">Added to my changes</p> : null}
      <div className="rec-panel">
        <div className="rec-panel-inner" inert={!open}>
          <h4>How to start</h4>
          <p>{rec.how}</p>
          <h4>Why it helps</h4>
          <p>{rec.why}</p>
          {note ? <p>{note}</p> : null}
          <p>Overlapping cuts are counted once.</p>
          {onMethod ? (
            <button className="method-link" type="button" onClick={onMethod}>
              How was this calculated?
            </button>
          ) : null}
          <div className="rec-actions">
            <button
              className={`btn-primary rec-add ${added ? "is-added" : ""}`}
              type="button"
              aria-pressed={added}
              onClick={onToggle}
            >
              {added ? "Added to my changes" : "Try this change"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function shortShare(percent: number): string {
  if (!Number.isFinite(percent) || percent <= 0) return "";
  const shown = percent < 0.1 ? "<0.1" : String(percent);
  return `~${shown}% of a typical U.S. year`;
}
