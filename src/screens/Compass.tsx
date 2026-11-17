import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { PhoneShell } from "../components/PhoneShell";
import { ProgressChart } from "../components/ProgressChart";
import { UsCompareChart } from "../components/UsCompareChart";
import { calculate } from "../model/calculate";
import { describePercent, effortMessage, surveyProgress, barShare, type CheckInSnapshot, type ProgressPoint } from "../model/checkin";
import { formatCarbonPerYear } from "../model/format";
import { monthCompare, monthLabel } from "../model/progress";
import type { Answers } from "../model/types";
import { Sources } from "./Sources";

type Props = {
  baseline: Answers;
  scenario: Answers;
  checkIns: CheckInSnapshot[];
  baselineMonth: string | null;
  onEdit: () => void;
  onCheckIn: () => void;
  sourcesOpen?: boolean;
  onSourcesOpenChange?: (open: boolean) => void;
};

export function Compass({
  baseline,
  scenario,
  checkIns,
  baselineMonth,
  onEdit,
  onCheckIn,
  sourcesOpen,
  onSourcesOpenChange,
}: Props) {
  const current = calculate(baseline);
  const progress = surveyProgress(baseline, checkIns, baselineMonth);
  const progressChange = describePercent(progress.percent);
  const latestCheckIn = progress.points.filter((point) => point.kind === "check-in").at(-1);
  const month = previousCheckInCompare(progress.points);

  return (
    <PhoneShell
      heroTone="teal"
      hero={
        <>
          <p className="kicker">My Footprint</p>
          <h2 className="hero-gallons footprint-hero-title">Your Impact</h2>
        </>
      }
    >
      <UsCompareChart carbonKg={current.totals.carbon} />
      <article className="plant-card progress-card">
        <p className="progress-axis">Estimated annual t CO₂e</p>
        <ProgressChart points={progress.points} />
        {latestCheckIn ? null : <p className="progress-note">Check in to add the next point.</p>}
        <dl className="stat-grid">
          <div>
            <dt>Original</dt>
            <dd>{formatCarbonPerYear(progress.originalKg)}</dd>
          </div>
          <div>
            <dt>{latestCheckIn ? monthLabel(latestCheckIn.month) : "Current"}</dt>
            <dd>{formatCarbonPerYear(progress.currentKg)}</dd>
          </div>
          <div>
            <dt>Change</dt>
            <dd>{progressChange.label}</dd>
          </div>
        </dl>
        <p className="us-compare-takeaway">{effortMessage(progressChange.direction)}</p>
      </article>
      <button className="btn-primary" type="button" onClick={onCheckIn}>
        Monthly Check-in
      </button>
      <CategoryBreakdown title="By category" footprint={current} />
      {month ? (
        <article className="calc calc-summary us-compare">
          <h3>Previous month</h3>
          <div className="us-compare-chart">
            <MonthBar label={monthLabel(month.earlier.month)} kg={month.earlier.carbonKg} max={month.max} tone="typical" />
            <MonthBar label={monthLabel(month.latest.month)} kg={month.latest.carbonKg} max={month.max} tone="yours" />
          </div>
          <p className="us-compare-takeaway">{month.line}</p>
        </article>
      ) : null}
      <Sources
        embedded
        baseline={baseline}
        scenario={scenario}
        onClose={() => undefined}
        sourcesOpen={sourcesOpen}
        onSourcesOpenChange={onSourcesOpenChange}
      />
      <button className="btn-secondary" type="button" onClick={onEdit}>
        Edit My Footprint
      </button>
    </PhoneShell>
  );
}

function previousCheckInCompare(points: ProgressPoint[]) {
  const saved = points.filter((point) => point.kind === "check-in");
  const latest = saved.at(-1);
  const earlier = saved.length > 1 ? saved[saved.length - 2] : null;
  if (!latest || !earlier) return null;
  const compared = monthCompare(latest.carbonKg, { month: earlier.month, scenarioKg: earlier.carbonKg });
  return {
    earlier,
    latest,
    max: Math.max(earlier.carbonKg, latest.carbonKg, 0),
    line: compared.line,
  };
}

function MonthBar({
  label,
  kg,
  max,
  tone,
}: {
  label: string;
  kg: number;
  max: number;
  tone: "yours" | "typical";
}) {
  return (
    <div className="us-compare-row">
      <div className="us-compare-label">
        <span>{label}</span>
        <strong>{formatCarbonPerYear(kg)}</strong>
      </div>
      <div className="us-compare-track" aria-hidden="true">
        <span className={`us-compare-fill is-${tone}`} style={{ width: `${barShare(kg, max)}%` }} />
      </div>
    </div>
  );
}
