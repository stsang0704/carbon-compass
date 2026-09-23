import { changePhrase, formatMetric } from "../model/format";
import type { Impacts, Metric } from "../model/types";
import { AVERAGES_NOTE } from "../model/types";

const metrics: { id: Metric; label: string; mark: string }[] = [
  { id: "carbon", label: "Carbon", mark: "🌱" },
  { id: "water", label: "Water", mark: "💧" },
  { id: "energy", label: "Energy", mark: "⚡" },
];

type Props = {
  totals: Impacts;
  baseline?: Impacts;
  onOpen: () => void;
};

export function ImpactTrio({ totals, baseline, onOpen }: Props) {
  return (
    <div className="stack">
      <div className="metrics">
        {metrics.map((metric) => {
          const amount = totals[metric.id];
          const parts = formatMetric(metric.id, amount);
          const delta = baseline ? amount - baseline[metric.id] : 0;
          const tone = !baseline || Math.abs(delta) < 0.5 ? "same" : delta < 0 ? "less" : "more";
          const word = tone === "same" ? "same" : tone;
          return (
            <button key={metric.id} className={`metric metric-${metric.id}`} type="button" onClick={onOpen}>
              <span className="metric-label">
                <span className="metric-mark" aria-hidden="true">
                  {metric.mark}
                </span>
                {metric.label}
              </span>
              <span className="metric-value">{parts.value}</span>
              <span className="metric-unit">{parts.unit}</span>
              {baseline ? <span className={`metric-delta ${tone}`}>{word}</span> : null}
            </button>
          );
        })}
      </div>
      {baseline ? (
        <p className="detail">
          {changePhrase("carbon", totals.carbon - baseline.carbon)}.{" "}
          {changePhrase("water", totals.water - baseline.water)}.{" "}
          {changePhrase("energy", totals.energy - baseline.energy)}.
        </p>
      ) : null}
      <p className="disclaimer">{AVERAGES_NOTE}</p>
    </div>
  );
}
