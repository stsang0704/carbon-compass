import { CategoryBreakdown, CategoryGlyph } from "../components/CategoryBreakdown";
import { PhoneShell } from "../components/PhoneShell";
import { ProgressChart } from "../components/ProgressChart";
import { attributedSavedKg, recommendationById, type RecId } from "../data/recommendations";
import { calculate } from "../model/calculate";
import { describePercent, effortMessage, surveyProgress, type CheckInSnapshot, type ProgressPoint } from "../model/checkin";
import { formatCarbonPerYear, formatCarbonSaved, savedEquivalence } from "../model/format";
import { monthCompare, monthLabel } from "../model/progress";
import type { Answers } from "../model/types";
import { AVERAGES_NOTE, categories } from "../model/types";

type Props = {
  view: "potential" | "progress";
  baseline: Answers;
  scenario: Answers;
  selected: RecId[];
  checkIns: CheckInSnapshot[];
  baselineMonth: string | null;
  onRemove: (id: RecId) => void;
  onBack: () => void;
  onPlan: () => void;
  onCheckIn: () => void;
  onSources: () => void;
};

export function Mix(props: Props) {
  if (props.view === "progress") return <ProgressView {...props} />;
  return <PotentialView {...props} />;
}

function PotentialView({ baseline, scenario, selected, onRemove, onBack, onPlan, onSources }: Props) {
  const current = calculate(baseline);
  const next = calculate(scenario);
  const count = selected.length;
  const savedKg = current.totals.carbon - next.totals.carbon;
  const equivalence = savedEquivalence(savedKg);
  const hasSaving = equivalence.kind !== "none";
  const changeLine =
    count === 1 ? "1 change selected. It could add up." : `${count} changes selected. They could add up.`;
  const attributed = attributedSavedKg(baseline, selected);

  return (
    <PhoneShell
      onBack={onBack}
      backLabel="My Footprint"
      hero={
        count === 0 ? (
          <>
            <p className="kicker">Potential Impact</p>
            <h2>Your impact starts with one change.</h2>
            <p className="lede">
              Open your action plan to find realistic changes that work for you. Progress over perfection.
            </p>
          </>
        ) : (
          <>
            <p className="kicker">Potential Impact</p>
            <p className="hero-count">{changeLine}</p>
            {hasSaving ? (
              <>
                <h2 className={equivalence.kind === "miles" ? "hero-gallons" : "hero-trees"}>
                  {equivalence.heading}
                </h2>
                {equivalence.unit ? <p className="hero-gallons-unit">{equivalence.unit}</p> : null}
                <p className="lede">{equivalence.line}</p>
                <p className="hero-carbon">{formatCarbonSaved(savedKg)}</p>
              </>
            ) : null}
            <p className={hasSaving ? "hero-close" : "lede"}>
              Small individual choices could add up. What you do matters.
            </p>
          </>
        )
      }
    >
      <p className="disclaimer">{AVERAGES_NOTE}</p>
      <div className="section-head">
        <h3>Your selected changes</h3>
      </div>
      {count === 0 ? (
        <p className="body-copy">Nothing selected yet. Your action plan can help you pick a first step.</p>
      ) : (
        <div className="habit-list">
          {selected.map((id) => {
            const rec = recommendationById(id);
            const saved = attributed[id] ?? 0;
            const area = categories.find((item) => item.id === rec.category);
            return (
              <div key={id} className="plant-card habit-row changed rec-mix-row">
                <CategoryGlyph id={rec.category} />
                <span className="plant-copy">
                  <span className="plant-title">{rec.title}</span>
                  <span className="plant-sub">
                    {area?.label} · ↓ {Math.round(saved).toLocaleString("en-US")} kg
                  </span>
                </span>
                <button className="text-button rec-remove" type="button" onClick={() => onRemove(id)}>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
      {count > 0 ? (
        <CategoryBreakdown
          title="Your Potential Savings"
          footprint={next}
          before={current}
        />
      ) : (
        <button className="btn-primary" type="button" onClick={onPlan}>
          Open your action plan
        </button>
      )}
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
    </PhoneShell>
  );
}

function ProgressView({ baseline, checkIns, baselineMonth, onBack, onCheckIn, onSources }: Props) {
  const progress = surveyProgress(baseline, checkIns, baselineMonth);
  const progressChange = describePercent(progress.percent);
  const latestCheckIn = progress.points.filter((point) => point.kind === "check-in").at(-1);
  const month = previousCheckInCompare(progress.points);

  return (
    <PhoneShell
      onBack={onBack}
      backLabel="My Footprint"
      hero={
        <>
          <p className="kicker">Your Impact</p>
          <h2>Your Progress</h2>
          <p className="lede">Estimated from your original survey and monthly check-ins.</p>
        </>
      }
    >
      <article className="plant-card progress-card">
        <p className="progress-axis">Estimated annual t CO₂e</p>
        <ProgressChart points={progress.points} />
        <p className="progress-note">
          {baselineMonth
            ? `The first point is your original survey, ${monthLabel(baselineMonth)}.`
            : "The first point is your original survey."}
        </p>
        {latestCheckIn ? null : (
          <p className="body-copy">
            Your journey starts here. Check in each month to see how your choices change over time.
          </p>
        )}
        <dl className="progress-stats">
          <div className="progress-stat">
            <dt>Original baseline</dt>
            <dd>{formatCarbonPerYear(progress.originalKg)}</dd>
          </div>
          <div className="progress-stat">
            <dt>Current footprint</dt>
            <dd>{formatCarbonPerYear(progress.currentKg)}</dd>
            <p className="progress-note">
              {latestCheckIn ? `From your ${monthLabel(latestCheckIn.month)} check-in.` : "From your first survey."}
            </p>
          </div>
          <div className="progress-stat">
            <dt>Percentage change</dt>
            <dd>{progressChange.label}</dd>
            <p className="progress-note">Compared with your original baseline.</p>
            <p className="compare-bar-message">{effortMessage(progressChange.direction)}</p>
          </div>
        </dl>
      </article>
      <button className="btn-primary" type="button" onClick={onCheckIn}>
        Monthly Check-in
      </button>
      {month ? (
        <article className="plant-card month-card">
          <h3>Compare your carbon footprint to previous month</h3>
          <p className="body-copy">{month.line}</p>
        </article>
      ) : null}
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
    </PhoneShell>
  );
}

/** Latest saved check-in against the check-in before it. Selected actions are not included. */
function previousCheckInCompare(points: ProgressPoint[]) {
  const saved = points.filter((point) => point.kind === "check-in");
  const latest = saved.at(-1);
  const earlier = saved.length > 1 ? saved[saved.length - 2] : null;
  if (!latest || !earlier) return null;
  return monthCompare(latest.carbonKg, { month: earlier.month, scenarioKg: earlier.carbonKg });
}
