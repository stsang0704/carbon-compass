import { ImpactTrio } from "../components/ImpactTrio";
import { PhoneShell } from "../components/PhoneShell";
import { SavingsBanner } from "../components/SavingsBanner";
import { changedHabitIds, formatAnswer, habits } from "../data/habits";
import { calculate, replaceAnswer } from "../model/calculate";
import { carbonPhrase } from "../model/format";
import type { Answers, Depth, HabitId } from "../model/types";

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
    <PhoneShell kicker="Your mix" onBack={onBack}>
      <div className="stack stack-lg">
        <div>
          <h2>
            {count === 0
              ? "You changed 0 habits."
              : `You changed ${count} ${count === 1 ? "habit" : "habits"}.`}
          </h2>
          <p className="detail">
            {count === 0
              ? "This matches how you live now. Ease off fills in a modest shift. Any row can be tuned on its own."
              : "Untouched habits stay as they are now. The total is everything together. A row is that habit on its own."}
          </p>
        </div>
        <SavingsBanner baselineKg={current.totals.carbon} scenarioKg={next.totals.carbon} />
        <ImpactTrio totals={next.totals} baseline={count === 0 ? undefined : current.totals} onOpen={onSources} />
        <div className="preset-row">
          <Preset label="Keep close" pressed={depth === "close"} onClick={() => onDepth("close")} />
          <Preset label="Ease off" pressed={depth === "ease"} onClick={() => onDepth("ease")} />
          <Preset label="Go further" pressed={depth === "further"} onClick={() => onDepth("further")} />
        </div>
        <div className="habit-list">
          {habits.map((habit) => {
            const solo = calculate(replaceAnswer(baseline, habit.id, scenario[habit.id]));
            const delta = solo.totals.carbon - current.totals.carbon;
            const edited = baseline[habit.id] !== scenario[habit.id];
            return (
              <button
                key={habit.id}
                className={`habit-row ${edited ? "changed" : ""}`}
                type="button"
                onClick={() => onOpen(habit.id)}
              >
                <span className="row-title">
                  <span>{habit.name}</span>
                  <span>{carbonPhrase(delta)}</span>
                </span>
                <p className="quiet">
                  Now {formatAnswer(habit.id, baseline[habit.id])}
                  {edited ? ` → ${formatAnswer(habit.id, scenario[habit.id])}` : ""}
                </p>
              </button>
            );
          })}
        </div>
        <button className="btn-secondary" type="button" onClick={onSources}>
          Where the numbers come from
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
