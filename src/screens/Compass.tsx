import { ImpactTrio } from "../components/ImpactTrio";
import { PhoneShell } from "../components/PhoneShell";
import { SavingsBanner } from "../components/SavingsBanner";
import { habitsIn } from "../data/habits";
import { carbonPhrase, formatMetric } from "../model/format";
import { bestSmallMove, calculate } from "../model/calculate";
import type { Answers, Category, Depth, HabitId } from "../model/types";
import { categories } from "../model/types";

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
  const maxCarbon = Math.max(...categories.map((item) => next.byCategory[item.id].carbon), 1);

  return (
    <PhoneShell kicker="Your year" action={<button className="text-button" type="button" onClick={onMix}>Mix</button>}>
      <div className="stack stack-lg">
        <p className="lede">
          {move.categorySaved > 0
            ? `A small step in ${area?.label.toLowerCase()} does the most — ${carbonPhrase(-move.categorySaved)}.`
            : `${area?.label} is the largest share of this year. These habits are already at the low end of the scale.`}
        </p>
        {depth === "close" ? null : (
          <SavingsBanner baselineKg={current.totals.carbon} scenarioKg={next.totals.carbon} />
        )}
        <ImpactTrio
          totals={next.totals}
          baseline={depth === "close" ? undefined : current.totals}
          onOpen={onSources}
        />
        <div className="preset-row">
          <Preset label="Keep close" pressed={depth === "close"} onClick={() => onDepth("close")} />
          <Preset label="Ease off" pressed={depth === "ease"} onClick={() => onDepth("ease")} />
          <Preset label="Go further" pressed={depth === "further"} onClick={() => onDepth("further")} />
        </div>
        {depth === "custom" ? <p className="detail">This is your own mix, not one of the three presets.</p> : null}
        <div className="category-list">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category.id}
              label={category.label}
              carbon={next.byCategory[category.id].carbon}
              width={next.byCategory[category.id].carbon / maxCarbon}
              onOpen={() => onTry(bestHabit(baseline, category.id))}
            />
          ))}
        </div>
        <button className="btn-primary" type="button" onClick={() => onTry(move.habitId)}>
          Try a change
        </button>
        <button className="btn-secondary" type="button" onClick={onSources}>
          Where the numbers come from
        </button>
        <button className="text-button" type="button" onClick={onReset}>
          Start over
        </button>
      </div>
    </PhoneShell>
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
  width,
  onOpen,
}: {
  category: Category;
  label: string;
  carbon: number;
  width: number;
  onOpen: () => void;
}) {
  const parts = formatMetric("carbon", carbon);
  return (
    <button className={`category category-${category}`} type="button" onClick={onOpen}>
      <span className="row-title">
        <span>{label}</span>
        <span>
          {parts.value} {parts.unit}
        </span>
      </span>
      <span className={`bar bar-${category}`} aria-hidden="true">
        <span style={{ width: `${Math.min(100, Math.max(6, width * 100))}%` }} />
      </span>
      <p className="quiet">{habitsIn(category).map((habit) => habit.name).join(" · ")}</p>
    </button>
  );
}

function bestHabit(baseline: Answers, category: Category): HabitId {
  const move = bestSmallMove(baseline);
  if (move.category === category) return move.habitId;
  const base = calculate(baseline);
  let best = habitsIn(category)[0].id;
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
