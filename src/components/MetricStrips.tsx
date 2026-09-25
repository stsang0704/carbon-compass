import { formatMetric } from "../model/format";
import type { Impacts, Metric } from "../model/types";

const catalog: { id: Metric; label: string; mark: string }[] = [
  { id: "carbon", label: "Carbon", mark: "🌱" },
  { id: "water", label: "Water", mark: "💧" },
  { id: "energy", label: "Energy", mark: "⚡" },
];

type Props = {
  totals: Impacts;
  baseline?: Impacts;
};

export function MetricStrips({ totals, baseline }: Props) {
  return (
    <div className="metric-strips">
      {catalog.map((metric) => {
        const amount = totals[metric.id];
        const parts = formatMetric(metric.id, amount);
        const unit = metric.id === "carbon" ? `${parts.unit} CO₂e` : parts.unit;
        const before = baseline?.[metric.id];
        const delta = before === undefined ? 0 : amount - before;
        const tone = before === undefined || Math.abs(delta) < 0.5 ? "same" : delta < 0 ? "less" : "more";
        return (
          <div key={metric.id} className={`metric-strip metric-strip-lead metric-strip-${metric.id}`}>
            <span className="metric-strip-mark" aria-hidden="true">
              {metric.mark}
            </span>
            <span className="metric-strip-copy">
              <span className="metric-strip-heading">{metric.label}</span>
              <span className="metric-strip-value">
                {parts.value} {unit}
                {before === undefined ? null : (
                  <>
                    {" · "}
                    <span className={`metric-strip-note ${tone}`}>{tone}</span>
                  </>
                )}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
