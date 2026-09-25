import { factors } from "../data/factors";
import { formatMetric, subtractImpacts } from "../model/format";
import type { Confidence, Footprint, ImpactLine, Impacts } from "../model/types";
import { ENERGY_MIX_NOTE } from "../model/types";

type Props = {
  title: string;
  intro: string;
  footprint: Footprint;
  baseline?: Footprint;
  onClose: () => void;
};

const confidenceLabel: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function SourceSheet({ title, intro, footprint, baseline, onClose }: Props) {
  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="source-title">
      <header className="hero sheet-hero">
        <div className="topbar">
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            ‹
          </button>
          <span className="topbar-spacer" />
          <span className="topbar-spacer" />
        </div>
        <div className="hero-copy">
          <p className="kicker">Math and sources</p>
          <h2 id="source-title">{title}</h2>
          <p className="lede">{intro}</p>
        </div>
      </header>
      <div className="sheet-scroll">
        <p className="disclaimer">{ENERGY_MIX_NOTE}</p>
        {footprint.lines.map((line) => {
          const before = baseline?.lines.find((item) => item.id === line.id);
          return <LineBlock key={line.id} line={line} before={before} />;
        })}
      </div>
    </div>
  );
}

function LineBlock({ line, before }: { line: ImpactLine; before?: ImpactLine }) {
  const delta = before
    ? subtractImpacts(
        { carbon: line.carbon, water: line.water, energy: line.energy },
        impacts(before),
      )
    : null;
  return (
    <article className="calc">
      <h3>{line.title}</h3>
      <p className="quiet">
        {figure("carbon", line.carbon)} · {figure("water", line.water)} · {figure("energy", line.energy)}
      </p>
      {delta ? (
        <p className="quiet">
          Compared with how you live now: {figure("carbon", delta.carbon, true)} carbon,{" "}
          {figure("water", delta.water, true)} water, {figure("energy", delta.energy, true)} energy.
          A negative number is a reduction.
        </p>
      ) : null}
      <p className="quiet">
        {line.waterKind === "virtual"
          ? "This water is virtual — mostly rain and irrigation grown into food or fiber, not water from your tap."
          : "No tap-water total on this row."}{" "}
        {energyKindCopy(line.energyKind)}
      </p>
      <ol className="steps">
        {line.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {line.factorIds.map((id) => {
        const factor = factors[id];
        if (!factor) return null;
        return (
          <section key={id} className="factor">
            <h4>{factor.name}</h4>
            <p>{factor.valueLabel}</p>
            <p>
              {factor.source}, {factor.year}. {factor.region}.
            </p>
            <p>Includes: {factor.includes}</p>
            <p>Leaves out: {factor.excludes}</p>
            <a href={factor.url} target="_blank" rel="noreferrer">
              Open the source
            </a>
            <div className={`confidence confidence-${factor.confidence}`}>
              {confidenceLabel[factor.confidence]}
            </div>
          </section>
        );
      })}
    </article>
  );
}

function figure(metric: "carbon" | "water" | "energy", amount: number, signed = false): string {
  const parts = formatMetric(metric, Math.abs(amount));
  const sign = signed && amount < 0 ? "−" : signed && amount > 0 ? "+" : "";
  return `${sign}${parts.value} ${parts.unit}`;
}

function impacts(line: ImpactLine): Impacts {
  return { carbon: line.carbon, water: line.water, energy: line.energy };
}

function energyKindCopy(kind: ImpactLine["energyKind"]): string {
  if (kind === "site") return "Energy here is site energy: fuel or electricity used in the home.";
  if (kind === "fuel") return "Energy here is the fuel itself, not electricity at home.";
  if (kind === "embodied") return "Energy here is embodied: a rough estimate of energy used to produce the food, not your stove.";
  if (kind === "derived") return "Energy here is translated from a carbon figure so it can be compared. It is a rough reading.";
  return "Energy is not counted on this row.";
}
