import { useEffect, useRef, useState } from "react";
import { CategoryBreakdown, CategoryGlyph } from "../components/CategoryBreakdown";
import { HabitControl } from "../components/HabitControl";
import { PhoneShell } from "../components/PhoneShell";
import { RecommendationCard } from "../components/RecommendationCard";
import { feel, habitsIn, homePresetOptions } from "../data/habits";
import {
  personalizedRecommendations,
  recommendationById,
  recommendationStillApplies,
  recommendationsIn,
  sortRecommendations,
  type RecId,
  type RecSort,
} from "../data/recommendations";
import { calculate } from "../model/calculate";
import { formatCarbon, savedEquivalence } from "../model/format";
import type { Answers, Category, HabitId } from "../model/types";
import { categories } from "../model/types";
import type { HabitMeta } from "../data/habits";

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
}: Props) {
  const [sort, setSort] = useState<RecSort>("savings");
  const baselineKey = JSON.stringify(baseline);
  const [draftKey, setDraftKey] = useState(baselineKey);
  const [draft, setDraft] = useState<Answers>(() => cloneAnswers(baseline));
  const sawFocus = useRef(false);
  const pendingScroll = useRef(false);
  if (draftKey !== baselineKey) {
    setDraftKey(baselineKey);
    setDraft(cloneAnswers(baseline));
  }

  const trial = experimentAnswers(baseline, draft);
  const original = calculate(baseline);
  const trialNext = calculate(trial);
  const changed = JSON.stringify(trial) !== JSON.stringify(baseline);
  const actions = sortRecommendations(
    baseline,
    recommendationsIn(category).filter((rec) => recommendationStillApplies(baseline, selected, rec)),
    sort,
  );
  const forYou = personalizedRecommendations(baseline, [], 3);
  const categoryLabel = categories.find((item) => item.id === category)?.label ?? "Food";
  const selectedNext = calculate(scenario);
  const savedKg = original.totals.carbon - selectedNext.totals.carbon;
  const equivalence = savedEquivalence(savedKg);
  const carbon = formatCarbon(Math.max(savedKg, 0));

  useEffect(() => {
    if (!sawFocus.current) {
      sawFocus.current = true;
      return;
    }
    pendingScroll.current = true;
  }, [focusNonce]);

  useEffect(() => {
    if (!active || !pendingScroll.current) return;
    pendingScroll.current = false;
    const node = document.getElementById(sectionId(focus));
    const pane = node?.closest(".view-pane");
    if (!(node instanceof HTMLElement) || !(pane instanceof HTMLElement)) return;
    const top = node.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
    pane.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
  }, [active, focus, focusNonce]);

  function update(id: HabitId, value: Answers[HabitId]) {
    setDraft((currentDraft) => ({ ...currentDraft, [id]: value }));
  }

  function scrollToSection(next: ExploreFocus) {
    const node = document.getElementById(sectionId(next));
    const pane = node?.closest(".view-pane");
    if (!(node instanceof HTMLElement) || !(pane instanceof HTMLElement)) return;
    const top = node.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
    pane.scrollTo({ top: Math.max(0, top - 8), behavior: "smooth" });
  }

  return (
    <PhoneShell onBack={onBack} backLabel="My Footprint" kicker="Explore">
      <section className="explore-block" id="explore-for-you">
        <h3>For You</h3>
        <p className="quiet">Largest cuts first. Adding one does not change your footprint.</p>
        {forYou.length === 0 ? (
          <p className="body-copy">None of the modeled actions apply to this footprint yet.</p>
        ) : (
          <div className="rec-list">
            {forYou.map((item) => (
              <RecommendationCard
                key={item.rec.id}
                rec={item.rec}
                baseline={baseline}
                added={selected.includes(item.rec.id)}
                savedKg={item.saved}
                onToggle={() => onToggle(item.rec.id)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="explore-block" id="explore-browse">
        <h3>Browse Changes</h3>
        <div className="category-tiles" role="group" aria-label="Category">
          {categories.map((item) => (
            <button
              key={item.id}
              className={`category-tile category-tile-${item.id} ${category === item.id ? "is-on" : ""}`}
              type="button"
              aria-pressed={category === item.id}
              onClick={() => onCategoryChange(item.id)}
            >
              <CategoryGlyph id={item.id} size={22} />
              {item.label}
            </button>
          ))}
        </div>
        <details className="trial-disclosure" data-no-swipe>
          <summary>
            <span className="trial-summary-copy">
              <span className="trial-summary-title">Try a different amount</span>
              <span className="trial-summary-note">A possible change only. Nothing here is saved.</span>
            </span>
          </summary>
          <div className="trial-disclosure-body">
            <div className="trial-list">
              {habitsIn(category).map((habit) => (
                <TrialField
                  key={habit.id}
                  habit={habit}
                  baseline={baseline}
                  value={draft[habit.id]}
                  onChange={(value) => update(habit.id, value)}
                />
              ))}
            </div>
            {changed ? (
              <button className="btn-secondary" type="button" onClick={() => setDraft(cloneAnswers(baseline))}>
                Reset this trial
              </button>
            ) : null}
          </div>
        </details>
        {changed ? <CategoryBreakdown title="If you tried this" footprint={trialNext} before={original} /> : null}
        <div className="section-head">
          <h3>Actions in {categoryLabel}</h3>
        </div>
        <label className="browse-field">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as RecSort)}>
            <option value="savings">Largest Reduction</option>
            <option value="ease">Easiest</option>
          </select>
        </label>
        <div className="rec-list">
          {actions.length === 0 ? (
            <p className="body-copy">None of these currently apply to the year you entered.</p>
          ) : (
            actions.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                baseline={baseline}
                added={selected.includes(rec.id)}
                onToggle={() => onToggle(rec.id)}
              />
            ))
          )}
        </div>
      </section>

      <section className="explore-block" id="explore-changes">
        <h3>Your Changes</h3>
        {selected.length === 0 ? (
          <>
            <p className="quiet">Nothing selected yet. Try a change above to see the potential savings.</p>
            <button className="btn-secondary" type="button" onClick={() => scrollToSection("for-you")}>
              See actions for you
            </button>
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
                <p className="potential-line">
                  {equivalence.heading} {equivalence.unit}
                </p>
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

function sectionId(focus: ExploreFocus): string {
  if (focus === "browse") return "explore-browse";
  if (focus === "changes") return "explore-changes";
  return "explore-for-you";
}

function TrialField({
  habit,
  baseline,
  value,
  onChange,
}: {
  habit: HabitMeta;
  baseline: Answers;
  value: Answers[HabitId];
  onChange: (value: Answers[HabitId]) => void;
}) {
  const control = habit.control;
  return (
    <div className="trial-field" data-no-swipe>
      <p className="trial-label">{habit.name}</p>
      {control.type === "choice" ? (
        <select
          aria-label={habit.name}
          value={String(value)}
          onChange={(event) => onChange(event.target.value as Answers[HabitId])}
        >
          {control.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : control.type === "home" ? (
        <HomeSelect value={String(value ?? "")} onChange={(next) => onChange(next)} />
      ) : control.type === "diet" ? (
        <HabitControl id={habit.id} value={value} baseline={baseline[habit.id]} onChange={onChange} showFeel={false} />
      ) : (
        <TrialNumber
          label={habit.name}
          value={typeof value === "number" ? value : null}
          baseline={typeof baseline[habit.id] === "number" ? (baseline[habit.id] as number) : 0}
          suffix={control.type === "temperature" ? "°F" : control.type === "entry" ? control.suffix : ""}
          min={control.type === "temperature" ? 50 : 0}
          onChange={(next) => onChange(next)}
        />
      )}
      <p className="quiet">{feel(habit.id, baseline[habit.id], value)}</p>
    </div>
  );
}

function HomeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const known = homePresetOptions.some((option) => option.value === value);
  return (
    <select aria-label="Home type" value={value} onChange={(event) => onChange(event.target.value)}>
      {!known && value ? <option value={value}>{value}</option> : null}
      {homePresetOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TrialNumber({
  label,
  value,
  baseline,
  suffix,
  min,
  onChange,
}: {
  label: string;
  value: number | null;
  baseline: number;
  suffix: string;
  min: number;
  onChange: (value: number) => void;
}) {
  const shown = value ?? baseline;
  const cap = Math.max(min + 10, Math.ceil(Math.max(baseline, 1) * 2));
  const max = Math.max(cap, Math.ceil(shown));
  const [text, setText] = useState(value === null ? "" : String(value));

  useEffect(() => {
    setText(value === null ? "" : String(value));
  }, [value]);

  return (
    <div className="trial-number">
      <input
        className="trial-slider"
        type="range"
        min={min}
        max={max}
        step={1}
        aria-label={`${label} slider`}
        value={Math.min(max, Math.max(min, shown))}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <label className="entry-block">
        <input
          className="entry-field value-input"
          type="text"
          inputMode="decimal"
          aria-label={label}
          value={text}
          onChange={(event) => {
            const next = event.target.value;
            if (next !== "" && !/^\d*\.?\d*$/.test(next)) return;
            setText(next);
            if (next === "") return;
            const parsed = Number(next);
            if (Number.isFinite(parsed) && parsed >= 0) onChange(parsed);
          }}
          onBlur={() => {
            if (text.trim() === "") {
              onChange(baseline);
              setText(String(baseline));
              return;
            }
            const parsed = Number(text);
            if (!Number.isFinite(parsed) || parsed < 0) {
              setText(String(shown));
              return;
            }
            onChange(parsed);
            setText(String(parsed));
          }}
        />
        <span className="entry-suffix">{suffix}</span>
      </label>
    </div>
  );
}

function cloneAnswers(answers: Answers): Answers {
  return { ...answers, dietShare: { ...answers.dietShare } };
}

function experimentAnswers(baseline: Answers, draft: Answers): Answers {
  const next = cloneAnswers(draft);
  if (next.milesPerWeek === null) next.milesPerWeek = baseline.milesPerWeek;
  if (next.flightsPerYear === null) next.flightsPerYear = baseline.flightsPerYear;
  if (next.winterTempF === null) next.winterTempF = baseline.winterTempF;
  if (next.clothesPerSeason === null) next.clothesPerSeason = baseline.clothesPerSeason;
  if (next.ordersPerMonth === null) next.ordersPerMonth = baseline.ordersPerMonth;
  if (!next.homeType) next.homeType = baseline.homeType;
  return next;
}
