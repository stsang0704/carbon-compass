import { MetricStrips } from "../components/MetricStrips";
import { PhoneShell } from "../components/PhoneShell";
import { SavingsBanner } from "../components/SavingsBanner";
import { changedHabitIds, formatAnswer, habits } from "../data/habits";
import { calculate, replaceAnswer } from "../model/calculate";
import { carbonPhrase } from "../model/format";
import type { Answers, Category, Depth, HabitId } from "../model/types";
import { AVERAGES_NOTE } from "../model/types";

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
  onOpen: (habitId: HabitId) => void;
  onBack: () => void;
  onSources: () => void;
};

export function Mix({ baseline, scenario, depth, onDepth, onOpen, onBack, onSources }: Props) {
  const changed = changedHabitIds(baseline, scenario);
  const current = calculate(baseline);
  const next = calculate(scenario);
  const count = changed.length;

  return (
    <PhoneShell
      onBack={onBack}
      hero={
        <>
          <p className="kicker">Your Impact</p>
          <h2>
            {count === 0
              ? "You changed 0 habits."
              : `You changed ${count} ${count === 1 ? "habit" : "habits"}.`}
          </h2>
          <p className="lede">
            {count === 0
              ? "This matches how you live now. Ease off fills in a modest shift. Any row can be tuned on its own."
              : "See how your chosen changes add up. Each habit shows its individual impact, while your total combines them all."}
          </p>
        </>
      }
      overlap={
        count === 0 ? (
          <MetricStrips totals={next.totals} />
        ) : (
          <SavingsBanner baselineKg={current.totals.carbon} scenarioKg={next.totals.carbon} />
        )
      }
    >
      {count === 0 ? null : (
        <>
          <MetricStrips totals={next.totals} baseline={current.totals} />
          <p className="disclaimer">{AVERAGES_NOTE}</p>
        </>
      )}
      <div className="section-head">
        <h3>Habits</h3>
        <div className="preset-row">
          <Preset label="Keep close" pressed={depth === "close"} onClick={() => onDepth("close")} />
          <Preset label="Ease off" pressed={depth === "ease"} onClick={() => onDepth("ease")} />
          <Preset label="Go further" pressed={depth === "further"} onClick={() => onDepth("further")} />
        </div>
      </div>
      <div className="habit-list">
        {habits.map((habit) => {
          const solo = calculate(replaceAnswer(baseline, habit.id, scenario[habit.id]));
          const delta = solo.totals.carbon - current.totals.carbon;
          const edited = baseline[habit.id] !== scenario[habit.id];
          return (
            <button
              key={habit.id}
              className={`plant-card habit-row ${edited ? "changed" : ""}`}
              type="button"
              onClick={() => onOpen(habit.id)}
            >
              <span className={`glyph glyph-${habit.category}`} aria-hidden="true">
                {marks[habit.category]}
              </span>
              <span className="plant-copy">
                <span className="plant-top">
                  <span className="plant-title">{habit.name}</span>
                  <span className={`status-pill ${edited ? "status-live" : ""}`}>{carbonPhrase(delta)}</span>
                </span>
                <span className="plant-sub">
                  Now {formatAnswer(habit.id, baseline[habit.id])}
                  {edited ? ` → ${formatAnswer(habit.id, scenario[habit.id])}` : ""}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
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
