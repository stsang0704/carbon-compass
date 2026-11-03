import { useEffect, useState } from "react";
import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { HabitControl } from "../components/HabitControl";
import { PhoneShell } from "../components/PhoneShell";
import { RecommendationCard } from "../components/RecommendationCard";
import { feel, habitsIn, homePresetOptions } from "../data/habits";
import {
  recommendationStillApplies,
  recommendationsIn,
  sortRecommendations,
  type RecId,
  type RecSort,
} from "../data/recommendations";
import { calculate } from "../model/calculate";
import { formatPotentialKg } from "../model/potentialBar";
import type { Answers, Category, HabitId } from "../model/types";
import { categories } from "../model/types";
import type { HabitMeta } from "../data/habits";

type Props = {
  category: Category;
  baseline: Answers;
  selected: RecId[];
  onCategoryChange: (category: Category) => void;
  onToggle: (id: RecId) => void;
  onBack: () => void;
  onMix: () => void;
  onSources: () => void;
};

export function Explore({
  category,
  baseline,
  selected,
  onCategoryChange,
  onToggle,
  onBack,
  onMix,
  onSources,
}: Props) {
  const [sort, setSort] = useState<RecSort>("savings");
  const baselineKey = JSON.stringify(baseline);
  const [draftKey, setDraftKey] = useState(baselineKey);
  const [draft, setDraft] = useState<Answers>(() => cloneAnswers(baseline));
  if (draftKey !== baselineKey) {
    setDraftKey(baselineKey);
    setDraft(cloneAnswers(baseline));
  }

  const trial = experimentAnswers(baseline, draft);
  const original = calculate(baseline);
  const next = calculate(trial);
  const reductionKg = original.totals.carbon - next.totals.carbon;
  const changed = JSON.stringify(trial) !== JSON.stringify(baseline);
  const actions = sortRecommendations(
    baseline,
    recommendationsIn(category).filter((rec) => recommendationStillApplies(baseline, selected, rec)),
    sort,
  );

  function update(id: HabitId, value: Answers[HabitId]) {
    setDraft((current) => ({ ...current, [id]: value }));
  }

  return (
    <PhoneShell
      onBack={onBack}
      backLabel="My Footprint"
      kicker="Browse"
      action={
        <button className="text-button" type="button" onClick={onMix}>
          Potential Impact
        </button>
      }
    >
      <label className="browse-field">
        <span>Category</span>
        <select
          value={category}
          onChange={(event) => onCategoryChange(event.target.value as Category)}
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <section className="rec-section">
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
      </section>

      {changed ? (
        <>
          <p className="footprint-insight">
            {reductionKg > 0.5
              ? `Potential reduction: ${formatPotentialKg(reductionKg)} kg CO₂e/year`
              : reductionKg < -0.5
                ? `This trial is about ${formatPotentialKg(-reductionKg)} kg CO₂e/year higher than your footprint, so the bars show no reduction.`
                : "This matches your footprint, so there is no potential reduction yet."}
          </p>
          <CategoryBreakdown
            title="If you tried this"
            footprint={next}
            before={original}
            caption="A possible footprint for this trial, not a saved change or a confirmed reduction."
          />
        </>
      ) : null}

      <section className="rec-section">
        <h3>Actions in {categories.find((item) => item.id === category)?.label}</h3>
        <label className="browse-field">
          <span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as RecSort)}>
            <option value="savings">Biggest Carbon Reduction</option>
            <option value="ease">Easiest to Adopt</option>
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
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
    </PhoneShell>
  );
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
