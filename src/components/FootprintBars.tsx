import { barShare, compareDirection, effortMessage, percentChange, describePercent } from "../model/checkin";
import { formatCarbon, formatCarbonPerYear } from "../model/format";

export function FootprintBars({ previousKg, updatedKg }: { previousKg: number; updatedKg: number }) {
  const max = Math.max(previousKg, updatedKg, 0);
  const direction = compareDirection(previousKg, updatedKg);
  const change = describePercent(percentChange(previousKg, updatedKg));
  const difference = differenceLabel(previousKg, updatedKg, direction);
  const summary = `Previous estimated annual footprint ${formatCarbonPerYear(previousKg)}. Updated estimated annual footprint ${formatCarbonPerYear(updatedKg)}. ${change.direction === "unavailable" ? difference : change.label}. ${difference}`;

  return (
    <article className="plant-card progress-card footprint-bars" aria-label={summary}>
      <h3>Before and after</h3>
      <BarRow label="Previous" kg={previousKg} share={barShare(previousKg, max)} tone="previous" />
      <BarRow label="Updated" kg={updatedKg} share={barShare(updatedKg, max)} tone="updated" />
      <p className="compare-bar-summary">
        {change.direction === "unavailable" ? difference : `${change.label}. ${difference}`}
      </p>
      <p className="compare-bar-message">{effortMessage(direction)}</p>
    </article>
  );
}

function BarRow({
  label,
  kg,
  share,
  tone,
}: {
  label: string;
  kg: number;
  share: number;
  tone: "previous" | "updated";
}) {
  return (
    <div className="compare-bar-row">
      <div className="compare-bar-name">
        <span>{label}</span>
        <strong>{formatCarbonPerYear(kg)}</strong>
      </div>
      <div className="compare-bar-track" aria-hidden="true">
        <span className={`compare-bar-fill is-${tone}`} style={{ width: `${share}%` }} />
      </div>
      <p className="compare-bar-caption">Estimated annual footprint</p>
    </div>
  );
}

function differenceLabel(fromKg: number, toKg: number, direction: ReturnType<typeof compareDirection>): string {
  if (direction === "same") return "No estimated annual difference.";
  const parts = formatCarbon(Math.abs(toKg - fromKg));
  const word = direction === "decrease" ? "lower" : "higher";
  return `${parts.value} ${parts.unit} CO₂e ${word} per year.`;
}
