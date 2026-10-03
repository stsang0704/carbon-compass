import { factors, published } from "../data/factors";
import {
  formatDrivingMiles,
  formatGasolineGallons,
  formatMetric,
  formatTreeCount,
  plainNumber,
  savedEquivalence,
  subtractImpacts,
} from "../model/format";
import type { Confidence, Footprint, ImpactLine, Impacts } from "../model/types";
import { ENERGY_MIX_NOTE } from "../model/types";

type Props = {
  title: string;
  intro: string;
  footprint: Footprint;
  baseline?: Footprint;
  comparisonKg?: number;
  savedKg?: number;
  onClose: () => void;
};

const confidenceLabel: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function SourceSheet({ title, intro, footprint, baseline, comparisonKg, savedKg, onClose }: Props) {
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
        {comparisonKg !== undefined ? <GasolineCompare carbonKg={comparisonKg} /> : null}
        {savedKg !== undefined ? <SavedCompare savedKg={savedKg} /> : null}
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
      {line.factorIds.map((id) => (
        <FactorCard key={id} id={id} />
      ))}
    </article>
  );
}

function GasolineCompare({ carbonKg }: { carbonKg: number }) {
  const gallons = formatGasolineGallons(carbonKg);
  const perGallon = published.gasolineKgCo2PerGallon;
  return (
    <article className="calc">
      <h3>Gasoline comparison</h3>
      <p className="quiet">≈ {gallons} gallons of gasoline burned</p>
      <ol className="steps">
        <li>Your starting year is {plainNumber(carbonKg, 0)} kg CO2e.</li>
        <li>
          EPA estimates burning one gallon of gasoline emits {plainNumber(perGallon, 2)} kg of CO2.
        </li>
        <li>
          {plainNumber(carbonKg, 0)} ÷ {plainNumber(perGallon, 2)} ≈ {gallons} gallons.
        </li>
        <li>
          This is an emissions equivalence. It does not mean you literally burned that amount of
          gasoline.
        </li>
      </ol>
      <FactorCard id="gasoline-equivalent" />
    </article>
  );
}

function SavedCompare({ savedKg }: { savedKg: number }) {
  const perMile = published.vehicleKgCo2ePerMile;
  const perTree = published.urbanTreeKgCo2ePerYear;
  const equivalence = savedEquivalence(savedKg);
  const miles = formatDrivingMiles(savedKg);
  const trees = formatTreeCount(savedKg);
  return (
    <article className="calc">
      <h3>What your changes are worth</h3>
      {equivalence.kind === "miles" ? (
        <p className="quiet">≈ {miles} miles of driving avoided</p>
      ) : null}
      {equivalence.kind === "trees" ? (
        <p className="quiet">≈ {trees} {trees === "1" ? "tree" : "trees"}</p>
      ) : null}
      <ol className="steps">
        {equivalence.kind === "miles" ? (
          <>
            <li>Your selected changes reduce the year by {plainNumber(savedKg, 0)} kg CO2e.</li>
            <li>
              EPA estimates a typical gasoline car emits {plainNumber(perMile, 3)} kg CO2e per mile.
            </li>
            <li>
              {plainNumber(savedKg, 0)} ÷ {plainNumber(perMile, 3)} ≈ {miles} miles of driving
              avoided.
            </li>
            <li>
              Trees are used only when the saving is at least one whole tree (
              {plainNumber(perTree, 0)} kg CO2e). This saving is smaller, so the app uses miles so a
              real cut is not shown as a fraction of a tree.
            </li>
            <li>
              This is an emissions equivalence. It does not mean you literally skipped that drive.
            </li>
          </>
        ) : null}
        {equivalence.kind === "trees" ? (
          <>
            <li>Your selected changes reduce the year by {plainNumber(savedKg, 0)} kg CO2e.</li>
            <li>
              EPA estimates an urban tree takes up {plainNumber(perTree, 0)} kg CO2 per year, on
              average over ten years of growth.
            </li>
            <li>
              {plainNumber(savedKg, 0)} ÷ {plainNumber(perTree, 0)} ≈ {trees}{" "}
              {trees === "1" ? "tree" : "trees"}.
            </li>
            <li>
              The app uses trees only when that quotient is at least 1. Smaller savings are shown as
              miles of driving avoided instead, using {plainNumber(perMile, 3)} kg CO2e per mile.
            </li>
            <li>This is a comparison. The app does not plant trees or sell offsets.</li>
          </>
        ) : null}
        {equivalence.kind === "none" ? (
          <>
            <li>
              When your selected changes reduce carbon, that saving is pictured with a published
              factor — never a larger invented number.
            </li>
            <li>
              If the saving is at least {plainNumber(perTree, 0)} kg CO2e, it is divided by{" "}
              {plainNumber(perTree, 0)} to picture urban trees.
            </li>
            <li>
              If the saving is smaller than one tree, it is divided by {plainNumber(perMile, 3)} kg
              CO2e per mile to picture miles of driving avoided.
            </li>
            <li>This is a comparison. The app does not plant trees or sell offsets.</li>
          </>
        ) : null}
      </ol>
      <FactorCard id="driving-equivalent" />
      <FactorCard id="urban-tree" />
    </article>
  );
}

function FactorCard({ id }: { id: string }) {
  const factor = factors[id];
  if (!factor) return null;
  return (
    <section className="factor">
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
