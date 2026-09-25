import { HabitControl } from "../components/HabitControl";
import { ImpactTrio } from "../components/ImpactTrio";
import { PhoneShell } from "../components/PhoneShell";
import { SavingsBanner } from "../components/SavingsBanner";
import { easeValue, formatAnswer, furtherValue, habitMeta } from "../data/habits";
import { calculate } from "../model/calculate";
import { categories } from "../model/types";
import type { Answers, HabitId } from "../model/types";

type Props = {
  habitId: HabitId;
  baseline: Answers;
  scenario: Answers;
  onChange: (value: Answers[HabitId]) => void;
  onBack: () => void;
  onMix: () => void;
  onSources: () => void;
};

export function Experiment({ habitId, baseline, scenario, onChange, onBack, onMix, onSources }: Props) {
  const habit = habitMeta(habitId);
  const area = categories.find((item) => item.id === habit.category);
  const current = calculate(baseline);
  const next = calculate(scenario);

  return (
    <PhoneShell
      onBack={onBack}
      action={
        <button className="text-button" type="button" onClick={onMix}>
          Your Impact
        </button>
      }
      hero={
        <>
          <p className="kicker">{area?.label}</p>
          <h2>{habit.name}</h2>
          <p className="lede">{habit.question}</p>
        </>
      }
      overlap={
        <div className="compare">
          <div className="compare-tile">
            <span className="compare-label">Current lifestyle</span>
            <strong>{formatAnswer(habitId, baseline[habitId])}</strong>
          </div>
          <div className="compare-tile compare-next">
            <span className="compare-label">If you try this</span>
            <strong>{formatAnswer(habitId, scenario[habitId])}</strong>
          </div>
        </div>
      }
    >
      <HabitControl
        id={habitId}
        value={scenario[habitId]}
        baseline={baseline[habitId]}
        onChange={onChange}
      />
      <SavingsBanner baselineKg={current.totals.carbon} scenarioKg={next.totals.carbon} />
      <div className="depth-row">
        <button className="depth" type="button" onClick={() => onChange(baseline[habitId])}>
          As now
        </button>
        <button
          className="depth"
          type="button"
          onClick={() => onChange(easeValue(habitId, baseline[habitId]))}
        >
          Ease off
        </button>
        <button
          className="depth"
          type="button"
          onClick={() => onChange(furtherValue(habitId, baseline[habitId]))}
        >
          Go further
        </button>
      </div>
      <p className="why">{habit.why}</p>
      <ImpactTrio totals={next.totals} baseline={current.totals} onOpen={onSources} />
      <button className="btn-secondary" type="button" onClick={onSources}>
        Why this number
      </button>
    </PhoneShell>
  );
}
