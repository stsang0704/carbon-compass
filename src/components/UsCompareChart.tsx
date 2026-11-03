import { barShare } from "../model/checkin";
import { lifestyleCompare } from "../model/compare";
import { formatCarbonPerYear } from "../model/format";

export function UsCompareChart({ carbonKg }: { carbonKg: number }) {
  const compare = lifestyleCompare(carbonKg);
  const max = Math.max(carbonKg, compare.typicalKg, 0);
  const yours = formatCarbonPerYear(carbonKg);
  const typical = formatCarbonPerYear(compare.typicalKg);

  return (
    <article className="calc calc-summary us-compare">
      <h3>U.S. comparison</h3>
      <p className="us-compare-sub">How your estimate compares</p>
      <div className="us-compare-chart">
        <Bar label="Your estimate" value={yours} share={barShare(carbonKg, max)} tone="yours" />
        <Bar label="Typical U.S. year" value={typical} share={barShare(compare.typicalKg, max)} tone="typical" />
      </div>
      <p className="us-compare-takeaway">{takeaway(compare.direction, compare.percent)}</p>
    </article>
  );
}

function Bar({
  label,
  value,
  share,
  tone,
}: {
  label: string;
  value: string;
  share: number;
  tone: "yours" | "typical";
}) {
  return (
    <div className="us-compare-row">
      <div className="us-compare-label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="us-compare-track" aria-hidden="true">
        <span className={`us-compare-fill is-${tone}`} style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function takeaway(direction: "above" | "below" | "near", percent: number): string {
  if (direction === "near") return "Your estimate is close to this model's typical U.S. year.";
  const word = direction === "above" ? "above" : "below";
  return `Your estimate is about ${percent}% ${word} this model's typical U.S. year.`;
}
