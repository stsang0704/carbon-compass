import { useState } from "react";
import { HabitControl } from "../components/HabitControl";
import { PhoneShell } from "../components/PhoneShell";
import { habits, starterAnswers } from "../data/habits";
import { categories } from "../model/types";
import type { Answers, HabitId } from "../model/types";

export function Baseline({
  initial,
  onDone,
  onBack,
}: {
  initial?: Answers;
  onDone: (answers: Answers) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Answers>(initial ?? starterAnswers);
  const habit = habits[step];
  const category = categories.find((item) => item.id === habit.category);
  const last = step === habits.length - 1;

  function setValue(value: Answers[HabitId]) {
    setDraft((current) => ({ ...current, [habit.id]: value }));
  }

  return (
    <PhoneShell
      onBack={() => {
        if (step === 0) onBack();
        else setStep((current) => current - 1);
      }}
      backLabel={step === 0 ? "Back to welcome" : "Previous question"}
      hero={
        <>
          <p className="kicker">
            {category?.label ?? "Now"} · {step + 1} of {habits.length}
          </p>
          <h2>{habit.question}</h2>
          <p className="lede">{habit.detail}</p>
        </>
      }
      overlap={
        <HabitControl
          id={habit.id}
          value={draft[habit.id]}
          baseline={draft[habit.id]}
          onChange={setValue}
          showFeel={false}
        />
      }
    >
      <button
        className="btn-primary"
        type="button"
        onClick={() => {
          if (last) onDone(draft);
          else setStep((current) => current + 1);
        }}
      >
        {last ? "See your compass" : "Next"}
      </button>
    </PhoneShell>
  );
}
