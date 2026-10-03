import { PhoneShell } from "../components/PhoneShell";
import { calculate } from "../model/calculate";
import { formatCarbonPerYear, formatGasolineGallons, formatMetric } from "../model/format";
import type { Answers, Category, Metric } from "../model/types";
import { AVERAGES_NOTE, categories } from "../model/types";

const marks: Record<Category, string> = {
  food: "🌱",
  travel: "🚲",
  home: "🏠",
  stuff: "📦",
};

type Props = {
  baseline: Answers;
  scenario: Answers;
  onExplore: (category: Category) => void;
  onMix: () => void;
  onSources: () => void;
  onReset: () => void;
};

export function Compass({ baseline, scenario, onExplore, onMix, onSources, onReset }: Props) {
  const current = calculate(baseline);
  const next = calculate(scenario);
  const initialKg = current.totals.carbon;
  const changed = JSON.stringify(baseline) !== JSON.stringify(scenario);
  const compare = changed ? current.totals : undefined;

  return (
    <PhoneShell
      action={
        <button className="text-button" type="button" onClick={onMix}>
          Your Impact
        </button>
      }
      hero={
        <>
          <p className="kicker">Your year</p>
          <h2 className="hero-gallons">≈ {formatGasolineGallons(initialKg)} gallons</h2>
          <p className="hero-gallons-unit">of gasoline burned</p>
          <p className="lede">
            Your annual carbon footprint produces roughly as much CO₂ as burning this much gasoline.
          </p>
          <p className="hero-carbon">{formatCarbonPerYear(initialKg)}</p>
        </>
      }
      overlap={
        <div className="metric-strips">
          <MetricStrip id="carbon" label="Carbon" mark="🌱" amount={next.totals.carbon} before={compare?.carbon} />
          <MetricStrip id="water" label="Water" mark="💧" amount={next.totals.water} before={compare?.water} />
          <MetricStrip id="energy" label="Energy" mark="⚡" amount={next.totals.energy} before={compare?.energy} />
        </div>
      }
    >
      <p className="disclaimer">{AVERAGES_NOTE}</p>
      <div className="section-head">
        <h3>Ways to lower your emissions</h3>
        <p className="body-copy">Explore realistic changes you can make to lower your impact.</p>
      </div>
      <div className="category-list">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`plant-card way-row category-${category.id}`}
            type="button"
            onClick={() => onExplore(category.id)}
          >
            <span className={`glyph glyph-${category.id}`} aria-hidden="true">
              {marks[category.id]}
            </span>
            <span className="plant-title">{category.label}</span>
            <span className="category-chevron" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
      <button className="text-button ghost-link" type="button" onClick={onReset}>
        Start over
      </button>
    </PhoneShell>
  );
}

function MetricStrip({
  id,
  label,
  mark,
  amount,
  before,
}: {
  id: Metric;
  label: string;
  mark: string;
  amount: number;
  before?: number;
}) {
  const parts = formatMetric(id, amount);
  const unit = id === "carbon" ? `${parts.unit} CO₂e` : parts.unit;
  const note =
    before === undefined || Math.abs(amount - before) < 0.5
      ? null
      : amount < before
        ? "less than your current year"
        : "more than your current year";
  return (
    <div className={`metric-strip metric-strip-${id}`}>
      <span className="metric-strip-mark" aria-hidden="true">
        {mark}
      </span>
      <span className="metric-strip-copy">
        <span className="metric-strip-value">
          {parts.value} {unit} this year
        </span>
        {note ? <span className={`metric-strip-note ${amount < (before ?? amount) ? "less" : "more"}`}>{note}</span> : null}
      </span>
      <span className="metric-strip-label">{label}</span>
    </div>
  );
}
