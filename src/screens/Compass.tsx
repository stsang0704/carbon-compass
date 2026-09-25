import { PhoneShell } from "../components/PhoneShell";
import { SavingsBanner } from "../components/SavingsBanner";
import { habitsIn } from "../data/habits";
import { carbonPhrase, carbonShift, formatMetric } from "../model/format";
import { bestSmallMove, calculate } from "../model/calculate";
import type { Answers, Category, Depth, HabitId, Metric } from "../model/types";
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
  depth: Depth | "custom";
  onDepth: (depth: Depth) => void;
  onTry: (habitId: HabitId) => void;
  onMix: () => void;
  onSources: () => void;
  onReset: () => void;
};

export function Compass({
  baseline,
  scenario,
  depth,
  onDepth,
  onTry,
  onMix,
  onSources,
  onReset,
}: Props) {
  const current = calculate(baseline);
  const next = calculate(scenario);
  const move = bestSmallMove(baseline);
  const area = categories.find((item) => item.id === move.category);
  const carbon = formatMetric("carbon", next.totals.carbon);
  const compare = depth === "close" ? undefined : current.totals;
  return (
    <PhoneShell
      action={
        <button className="text-button" type="button" onClick={onMix}>
          Your Impact
        </button>
      }
      hero={
        <>
          <p className="kicker">Your year</p>
          {depth === "close" ? (
            <>
              <h2>
                {carbon.value}
                <span className="hero-unit"> {carbon.unit}</span>
              </h2>
              <p className="lede">
                {move.categorySaved > 0
                  ? `A small step in ${area?.label.toLowerCase()} does the most — ${carbonPhrase(-move.categorySaved)}.`
                  : `${area?.label} is the largest share of this year. These habits are already at the low end of the scale.`}
              </p>
            </>
          ) : (
            <SavingsBanner baselineKg={current.totals.carbon} scenarioKg={next.totals.carbon} />
          )}
        </>
      }
      overlap={
        <div className="metric-strips">
          <MetricStrip
            id="carbon"
            label="Carbon"
            mark="🌱"
            amount={next.totals.carbon}
            before={compare?.carbon}
          />
          <MetricStrip
            id="water"
            label="Water"
            mark="💧"
            amount={next.totals.water}
            before={compare?.water}
          />
          <MetricStrip
            id="energy"
            label="Energy"
            mark="⚡"
            amount={next.totals.energy}
            before={compare?.energy}
          />
        </div>
      }
    >
      <p className="disclaimer">{AVERAGES_NOTE}</p>

      <div className="section-head">
        <h3>Try a change</h3>
        <div className="preset-row">
          <Preset label="Current" pressed={depth === "close"} onClick={() => onDepth("close")} />
          <Preset label="Small Changes" pressed={depth === "ease"} onClick={() => onDepth("ease")} />
          <Preset label="Bigger Changes" pressed={depth === "further"} onClick={() => onDepth("further")} />
        </div>
      </div>
      {depth === "custom" ? <p className="body-copy">This is your own impact, not one of the three presets.</p> : null}

      <div className="category-list">
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            category={category.id}
            label={category.label}
            carbon={next.byCategory[category.id].carbon}
            barPercent={barPercent(
              next.byCategory[category.id].carbon,
              current.byCategory[category.id].carbon,
            )}
            onOpen={() => onTry(bestHabit(baseline, category.id))}
          />
        ))}
      </div>
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
      <button className="text-button ghost-link" type="button" onClick={onReset}>
        Start over
      </button>
    </PhoneShell>
  );
}

function MetricStrip({
  id,
  label,
  mark,
  amount,
  before,
}: {
  id: Metric;
  label: string;
  mark: string;
  amount: number;
  before?: number;
}) {
  const parts = formatMetric(id, amount);
  const unit = id === "carbon" ? `${parts.unit} CO₂e` : parts.unit;
  const shift = before === undefined ? null : carbonShift(before, amount);
  const note =
    !shift || shift.direction === "same"
      ? null
      : `${shift.percent}% ${shift.direction} than your current footprint.`;
  return (
    <div className={`metric-strip metric-strip-${id}`}>
      <span className="metric-strip-mark" aria-hidden="true">
        {mark}
      </span>
      <span className="metric-strip-copy">
        <span className="metric-strip-value">
          {parts.value} {unit} this year
        </span>
        {note && shift ? <span className={`metric-strip-note ${shift.direction}`}>{note}</span> : null}
      </span>
      <span className="metric-strip-label">{label}</span>
    </div>
  );
}

function Preset({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button className="preset" type="button" aria-pressed={pressed} onClick={onClick}>
      {label}
    </button>
  );
}

function CategoryRow({
  category,
  label,
  carbon,
  barPercent,
  onOpen,
}: {
  category: Category;
  label: string;
  carbon: number;
  barPercent: number;
  onOpen: () => void;
}) {
  const parts = formatMetric("carbon", carbon);
  return (
    <button className={`plant-card category-card category-${category}`} type="button" onClick={onOpen}>
      <span className={`glyph glyph-${category}`} aria-hidden="true">
        {marks[category]}
      </span>
      <span className="plant-copy">
        <span className="plant-top">
          <span className="plant-title">{label}</span>
          <span className="status-pill">
            {parts.value} {parts.unit}
          </span>
        </span>
        <span className={`bar bar-${category}`} aria-hidden="true">
          <span style={{ width: `${barPercent}%` }} />
        </span>
      </span>
      <span className="category-chevron" aria-hidden="true">
        ›
      </span>
    </button>
  );
}

function barPercent(scenarioKg: number, currentKg: number): number {
  if (currentKg <= 0) return scenarioKg > 0 ? 100 : 0;
  return Math.min(100, (scenarioKg / currentKg) * 100);
}

function bestHabit(baseline: Answers, category: Category): HabitId {
  const move = bestSmallMove(baseline);
  if (move.category === category) return move.habitId;
  const base = calculate(baseline);
  let best = habitsIn(category)[0]?.id ?? "meatMealsPerWeek";
  let saved = -Infinity;
  for (const habit of habitsIn(category)) {
    const line = base.lines.find((item) => item.habitIds.includes(habit.id));
    const amount = line?.carbon ?? 0;
    if (amount > saved) {
      saved = amount;
      best = habit.id;
    }
  }
  return best;
}
