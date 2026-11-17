import { useState } from "react";
import { CategoryGlyph } from "../components/CategoryBreakdown";
import { FootprintBars } from "../components/FootprintBars";
import { HabitControl } from "../components/HabitControl";
import { PhoneShell } from "../components/PhoneShell";
import { dietIsComplete } from "../data/diet";
import { formatAnswer, habits } from "../data/habits";
import { recommendationById, type RecId } from "../data/recommendations";
import {
  answersForCheckIn,
  buildSnapshot,
  checkInForMonth,
  describePercent,
  effortMessage,
  footprintKg,
  percentChange,
  reflectionOptions,
  type CheckInSnapshot,
  type ReflectionChoice,
} from "../model/checkin";
import { formatCarbonPerYear } from "../model/format";
import { monthKey, monthLabel } from "../model/progress";
import type { Answers } from "../model/types";
import { categories } from "../model/types";

type Phase = "survey" | "reflect" | "results" | "saved";

type Props = {
  baseline: Answers;
  checkIns: CheckInSnapshot[];
  selected: RecId[];
  onSave: (snapshot: CheckInSnapshot) => void;
  onBack: () => void;
  onDone: () => void;
};

export function CheckIn({ baseline, checkIns, selected, onSave, onBack, onDone }: Props) {
  const [month] = useState(() => monthKey());
  const [editing] = useState(() => checkInForMonth(checkIns, month) !== null);
  const [phase, setPhase] = useState<Phase>("survey");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Answers>(() => answersForCheckIn(baseline, checkIns, month));
  const [startingKg] = useState(() => footprintKg(draft));
  const [reflections, setReflections] = useState<Partial<Record<RecId, ReflectionChoice>>>(
    () => checkInForMonth(checkIns, month)?.reflections ?? {},
  );
  const [saved, setSaved] = useState<CheckInSnapshot | null>(null);

  const habit = habits[step];
  const category = categories.find((item) => item.id === habit.category);
  const dietBlocked = phase === "survey" && habit.id === "dietShare" && !dietIsComplete(draft.dietShare);
  const reflectionReady = selected.length === 0 || selected.every((id) => reflections[id]);
  const nextKg = footprintKg(draft);
  const originalKg = footprintKg(baseline);
  const versusBaseline = describePercent(percentChange(originalKg, nextKg));

  function handleBack() {
    if (phase === "saved") {
      onDone();
      return;
    }
    if (phase === "results") {
      setPhase("reflect");
      return;
    }
    if (phase === "reflect") {
      setPhase("survey");
      setStep(habits.length - 1);
      return;
    }
    if (step === 0) onBack();
    else setStep((current) => current - 1);
  }

  function save() {
    const snapshot = buildSnapshot({ month, answers: draft, selectedRecIds: selected, reflections });
    onSave(snapshot);
    setSaved(snapshot);
    setPhase("saved");
  }

  const hero = (() => {
    if (phase === "survey") {
      return (
        <>
          <p className="kicker">
            Monthly Check-in · Step 1 of 4 · {category?.label} · {step + 1} of {habits.length}
          </p>
          <h2>{habit.question}</h2>
          <p className="lede">Your previous answer is filled in. Change it only if this has shifted.</p>
        </>
      );
    }
    if (phase === "reflect") {
      return (
        <>
          <p className="kicker">Monthly Check-in · Step 2 of 4</p>
          <h2>Have you tried any of these changes?</h2>
          <p className="lede">
            This is for your own reflection. These answers do not change your footprint estimate.
          </p>
        </>
      );
    }
    if (phase === "results") {
      return (
        <>
          <p className="kicker">Monthly Check-in · Step 3 of 4</p>
          <p className="hero-count">Estimated annual footprint</p>
          <h2>{formatCarbonPerYear(nextKg)}</h2>
        </>
      );
    }
    return (
      <>
        <p className="kicker">Monthly Check-in · Step 4 of 4</p>
        <h2>Saved for {monthLabel(month)}.</h2>
        <p className="lede">
          {editing
            ? "This month's snapshot is updated. Earlier months are still here."
            : "This month's snapshot is stored with your check-ins."}
        </p>
      </>
    );
  })();

  return (
    <PhoneShell
      onBack={handleBack}
      backLabel={phase === "survey" && step === 0 ? "Your Impact" : phase === "saved" ? "Your Impact" : "Back"}
      hero={hero}
      overlap={
        phase === "survey" ? (
          <HabitControl
            id={habit.id}
            value={draft[habit.id]}
            baseline={draft[habit.id]}
            onChange={(value) => setDraft((current) => ({ ...current, [habit.id]: value }))}
            showFeel={false}
          />
        ) : null
      }
    >
      {phase === "survey" ? (
        <>
          <FootprintBars previousKg={startingKg} updatedKg={nextKg} />
          <button
            className="btn-primary"
            type="button"
            disabled={dietBlocked}
            onClick={() => {
              if (step === habits.length - 1) setPhase("reflect");
              else setStep((current) => current + 1);
            }}
          >
            {step === habits.length - 1 ? "Continue" : "Next"}
          </button>
        </>
      ) : null}

      {phase === "reflect" ? (
        <>
          {selected.length === 0 ? (
            <p className="body-copy">
              No changes are selected yet. You can still save this month's lifestyle update.
            </p>
          ) : (
            selected.map((id) => {
              const rec = recommendationById(id);
              const area = categories.find((item) => item.id === rec.category);
              return (
                <article key={id} className="plant-card reflect-card">
                  <div className="reflect-head">
                    <CategoryGlyph id={rec.category} />
                    <div className="plant-copy">
                      <span className="plant-title">{rec.title}</span>
                      <span className="plant-sub">{area?.label}</span>
                    </div>
                  </div>
                  <div className="stack">
                    {reflectionOptions.map((option) => (
                      <button
                        key={option.id}
                        className="choice"
                        type="button"
                        aria-pressed={reflections[id] === option.id}
                        onClick={() => setReflections((current) => ({ ...current, [id]: option.id }))}
                      >
                        <strong>{option.label}</strong>
                      </button>
                    ))}
                  </div>
                </article>
              );
            })
          )}
          <button
            className="btn-primary"
            type="button"
            disabled={!reflectionReady}
            onClick={() => setPhase("results")}
          >
            See updated footprint
          </button>
        </>
      ) : null}

      {phase === "results" ? (
        <>
          <FootprintBars previousKg={startingKg} updatedKg={nextKg} />
          <p className="quiet">
            {editing ? `Updates ${monthLabel(month)}.` : `Saves one snapshot for ${monthLabel(month)}.`}
          </p>
          <button className="btn-primary" type="button" onClick={save}>
            Save this month
          </button>
        </>
      ) : null}

      {phase === "saved" && saved ? (
        <>
          <article className="plant-card progress-card">
            <h3>Estimated annual footprint</h3>
            <p className="progress-figure">{formatCarbonPerYear(footprintKg(saved.answers))}</p>
            <p className="compare-bar-message">{effortMessage(versusBaseline.direction)}</p>
          </article>
          <div className="section-head">
            <h3>Lifestyle answers saved</h3>
          </div>
          <ul className="checkin-answers">
            {habits.map((item) => (
              <li key={item.id}>
                <span>{item.name}</span>
                <strong>{formatAnswer(item.id, saved.answers[item.id])}</strong>
              </li>
            ))}
          </ul>
          {saved.selectedRecIds.length > 0 ? (
            <>
              <div className="section-head">
                <h3>Your reflections</h3>
              </div>
              <ul className="checkin-answers">
                {saved.selectedRecIds.map((id) => {
                  const choice = saved.reflections[id];
                  const label = reflectionOptions.find((option) => option.id === choice)?.label ?? "Not answered";
                  return (
                    <li key={id}>
                      <span>{recommendationById(id).title}</span>
                      <strong>{label}</strong>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : null}
          <button className="btn-primary" type="button" onClick={onDone}>
            Back to Your Impact
          </button>
        </>
      ) : null}
    </PhoneShell>
  );
}
