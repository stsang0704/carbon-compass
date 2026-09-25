import { changePhrase, formatMetric } from "../model/format";
import type { Impacts, Metric } from "../model/types";
import { AVERAGES_NOTE } from "../model/types";

const catalog: { id: Metric; label: string; mark: string }[] = [
  { id: "carbon", label: "Carbon", mark: "🌱" },
  { id: "water", label: "Water", mark: "💧" },
  { id: "energy", label: "Energy", mark: "⚡" },
];

type Props = {
  totals: Impacts;
  baseline?: Impacts;
  onOpen: () => void;
  layout?: "pair" | "full";
};

export function ImpactTrio({ totals, baseline, onOpen, layout = "full" }: Props) {
  const shown = layout === "pair" ? catalog.slice(0, 2) : catalog;
  return (
    <div className={`impact impact-${layout}`}>
      <div className="metrics">
        {shown.map((metric) => (
          <MetricTile
            key={metric.id}
            id={metric.id}
            label={metric.label}
            mark={metric.mark}
            amount={totals[metric.id]}
            before={baseline?.[metric.id]}
            onOpen={onOpen}
          />
        ))}
      </div>
      {layout === "pair" ? null : (
        <>
          {baseline ? (
            <p className="body-copy">
              {changePhrase("carbon", totals.carbon - baseline.carbon)}.{" "}
              {changePhrase("water", totals.water - baseline.water)}.{" "}
              {changePhrase("energy", totals.energy - baseline.energy)}.
            </p>
          ) : null}
          <p className="disclaimer">{AVERAGES_NOTE}</p>
        </>
      )}
    </div>
  );
}

function MetricTile({
  id,
  label,
  mark,
  amount,
  before,
  onOpen,
}: {
  id: Metric;
  label: string;
  mark: string;
  amount: number;
  before?: number;
  onOpen: () => void;
}) {
  const parts = formatMetric(id, amount);
  const delta = before === undefined ? 0 : amount - before;
  const tone = before === undefined || Math.abs(delta) < 0.5 ? "same" : delta < 0 ? "less" : "more";
  return (
    <button className={`metric metric-${id}`} type="button" onClick={onOpen}>
      <span className="metric-value">
        {parts.value}
        <span className="metric-unit">{parts.unit}</span>
      </span>
      <span className="metric-label">
        <span className="metric-mark" aria-hidden="true">
          {mark}
        </span>
        {label}
        {before === undefined ? null : <span className={`metric-delta ${tone}`}>{tone === "same" ? "same" : tone}</span>}
      </span>
    </button>
  );
}
