import { useEffect, useRef, useState } from "react";
import { CategoryBreakdown, CategoryGlyph } from "../components/CategoryBreakdown";
import { PhoneShell } from "../components/PhoneShell";
import { RecommendationCard } from "../components/RecommendationCard";
import {
  methodSectionFor,
  recommendationById,
  recommendationStillApplies,
  recommendationsIn,
  type RecId,
  type Recommendation,
} from "../data/recommendations";
import { calculate } from "../model/calculate";
import { formatCarbon, savedEquivalence } from "../model/format";
import type { Answers, Category } from "../model/types";
import { categories } from "../model/types";

export type ExploreFocus = "for-you" | "browse" | "changes";

type Props = {
  category: Category;
  baseline: Answers;
  scenario: Answers;
  selected: RecId[];
  focus: ExploreFocus;
  focusNonce: number;
  active: boolean;
  onCategoryChange: (category: Category) => void;
  onToggle: (id: RecId) => void;
  onBack: () => void;
  onSources: () => void;
  onExplain: (sectionId: string) => void;
};

export function Explore({
  category,
  baseline,
  scenario,
  selected,
  focus,
  focusNonce,
  active,
  onCategoryChange,
  onToggle,
  onBack,
  onSources,
  onExplain,
}: Props) {
  const [openIds, setOpenIds] = useState<Category[]>([]);
  const handledJump = useRef(focusNonce);
  const pendingScroll = useRef(false);
  const original = calculate(baseline);
  const selectedNext = calculate(scenario);
  const savedKg = original.totals.carbon - selectedNext.totals.carbon;
  const equivalence = savedEquivalence(savedKg);
  const carbon = formatCarbon(Math.max(savedKg, 0));

  useEffect(() => {
    if (handledJump.current === focusNonce) return;
    handledJump.current = focusNonce;
    if (focus === "browse") {
      setOpenIds((current) => (current.includes(category) ? current : [...current, category]));
    }
    pendingScroll.current = true;
  }, [focusNonce, focus, category]);

  useEffect(() => {
    if (!active || !pendingScroll.current) return;
    pendingScroll.current = false;
    const node = document.getElementById(focus === "browse" ? `explore-category-${category}` : sectionId(focus));
    const pane = node?.closest(".view-pane");
    if (!(node instanceof HTMLElement) || !(pane instanceof HTMLElement)) return;
    const top = node.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
    pane.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
  }, [active, focus, focusNonce, category]);

  function toggleCategory(id: Category) {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
    onCategoryChange(id);
  }

  return (
    <PhoneShell onBack={onBack} backLabel="My Footprint" kicker="Explore">
      <section className="explore-block" id="explore-browse">
        <h3>Browse Changes</h3>
        <div className="explore-categories">
          {categories.map((item) => {
            const open = openIds.includes(item.id);
            const visible = recommendationsIn(item.id).filter((rec) =>
              recommendationStillApplies(baseline, selected, rec),
            );
            const small = visible.filter((rec) => rec.depth === "ease");
            const bigger = visible.filter((rec) => rec.depth === "further");
            return (
              <article
                key={item.id}
                id={`explore-category-${item.id}`}
                className={`explore-category category-tile-${item.id} ${open ? "is-open" : ""}`}
              >
                <button
                  className="explore-category-toggle"
                  type="button"
                  aria-expanded={open}
                  onClick={() => toggleCategory(item.id)}
                >
                  <CategoryGlyph id={item.id} size={22} />
                  <span className="explore-category-name">{item.label}</span>
                  <span className="explore-category-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
                {open ? (
                  <div className="explore-category-body">
                    <SuggestionGroup
                      title="Small changes"
                      recs={small}
                      baseline={baseline}
                      selected={selected}
                      onToggle={onToggle}
                      onExplain={onExplain}
                    />
                    <SuggestionGroup
                      title="Bigger changes"
                      recs={bigger}
                      baseline={baseline}
                      selected={selected}
                      onToggle={onToggle}
                      onExplain={onExplain}
                    />
                    {visible.length === 0 ? (
                      <p className="body-copy">None of these currently apply to the year you entered.</p>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      <section className="explore-block" id="explore-changes">
        <h3>Your Changes</h3>
        {selected.length === 0 ? (
          <>
            <p className="quiet">Nothing selected yet. Try a change above to see the potential savings.</p>
          </>
        ) : (
          <div className="habit-list">
            {selected.map((id) => {
              const rec = recommendationById(id);
              const area = categories.find((item) => item.id === rec.category);
              return (
                <div key={id} className="plant-card habit-row changed rec-mix-row">
                  <CategoryGlyph id={rec.category} />
                  <span className="plant-copy">
                    <span className="plant-title">{rec.title}</span>
                    <span className="plant-sub">{area?.label}</span>
                  </span>
                  <button className="text-button rec-remove" type="button" onClick={() => onToggle(id)}>
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
        {selected.length > 0 ? (
          <>
            <article className="potential-summary">
              <p className="potential-kicker">Potential savings</p>
              {savedKg > 0 ? (
                <p className="potential-figure">
                  {carbon.value} {carbon.unit} CO₂e / year
                </p>
              ) : (
                <p className="potential-line">These selections do not lower this estimate.</p>
              )}
              {equivalence.kind === "trees" ? <p className="potential-line">{equivalence.heading}</p> : null}
              {equivalence.kind === "miles" ? (
                <>
                  <p className="potential-line">
                    {equivalence.heading} {equivalence.unit}
                  </p>
                  <button
                    className="method-link"
                    type="button"
                    onClick={() => onExplain("driving-equivalencies")}
                  >
                    How was this calculated?
                  </button>
                </>
              ) : null}
              <p className="potential-count">
                {selected.length} selected {selected.length === 1 ? "change" : "changes"}
              </p>
            </article>
            <CategoryBreakdown title="Your Potential Savings" footprint={selectedNext} before={original} />
          </>
        ) : null}
      </section>

      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
    </PhoneShell>
  );
}

function SuggestionGroup({
  title,
  recs,
  baseline,
  selected,
  onToggle,
  onExplain,
}: {
  title: string;
  recs: Recommendation[];
  baseline: Answers;
  selected: RecId[];
  onToggle: (id: RecId) => void;
  onExplain: (sectionId: string) => void;
}) {
  if (recs.length === 0) return null;
  return (
    <div className="explore-group">
      <h4>{title}</h4>
      <div className="rec-list">
        {recs.map((rec) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            baseline={baseline}
            added={selected.includes(rec.id)}
            showDifficulty={false}
            showCategory={false}
            impactAsPill
            onMethod={() => onExplain(methodSectionFor(rec.id))}
            onToggle={() => onToggle(rec.id)}
          />
        ))}
      </div>
    </div>
  );
}

function sectionId(focus: ExploreFocus): string {
  if (focus === "changes") return "explore-changes";
  return "explore-browse";
}
