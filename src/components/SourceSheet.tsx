import { Car } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { factors, published, usPerCapitaKgCo2e } from "../data/factors";
import { lifestyleCompare, typicalUsLifestyleKg } from "../model/compare";
import {
  formatCarbon,
  formatDrivingMiles,
  formatMetric,
  formatTreeCount,
  plainNumber,
  savedEquivalence,
  subtractImpacts,
} from "../model/format";
import type { Footprint, ImpactLine, Impacts } from "../model/types";
import { ENERGY_MIX_NOTE } from "../model/types";

type Props = {
  title: string;
  intro: string;
  footprint: Footprint;
  baseline?: Footprint;
  comparisonKg?: number;
  savedKg?: number;
  onClose: () => void;
  /** Renders the method and source rows without the full-screen sheet chrome. */
  embedded?: boolean;
  /** Leaves out recommendation-share and selected-change notes. */
  omitRecommendationNotes?: boolean;
  /** Opens and scrolls to one existing section, such as "diet" or "driving". */
  focusId?: string | null;
  /** Keeps section ids unique when more than one sheet is mounted. */
  anchorPrefix?: string;
};

export function SourceSheet({
  title,
  intro,
  footprint,
  baseline,
  comparisonKg,
  savedKg,
  onClose,
  embedded = false,
  omitRecommendationNotes = false,
  focusId = null,
  anchorPrefix = "method",
}: Props) {
  const sectionIds = [
    comparisonKg !== undefined ? "us-comparison" : null,
    comparisonKg !== undefined && !omitRecommendationNotes ? "typical-share" : null,
    savedKg !== undefined && !omitRecommendationNotes ? "saved-compare" : null,
    ...footprint.lines.map((line) => line.id),
    "driving-equivalencies",
  ].filter((id): id is string => Boolean(id));
  const [openIds, setOpenIds] = useState<string[]>(() =>
    focusId && sectionIds.includes(focusId) ? [focusId] : sectionIds.length === 1 ? sectionIds : [],
  );

  useEffect(() => {
    if (!focusId) return;
    setOpenIds((current) => (current.includes(focusId) ? current : [...current, focusId]));
    document.getElementById(`${anchorPrefix}-${focusId}`)?.scrollIntoView({ block: "start" });
  }, [anchorPrefix, focusId]);

  function toggleSection(id: string, open: boolean) {
    setOpenIds((current) => {
      const has = current.includes(id);
      if (open === has) return current;
      return open ? [...current, id] : current.filter((item) => item !== id);
    });
  }

  const body = (
    <>
      {embedded ? <p className="sources-disclosure-intro">{intro}</p> : null}
      <p className="disclaimer">{ENERGY_MIX_NOTE}</p>
      {comparisonKg !== undefined ? (
          <MethodSection
          anchorPrefix={anchorPrefix}
          id="us-comparison"
          title="U.S. comparison"
          open={openIds.includes("us-comparison")}
          onToggle={(open) => toggleSection("us-comparison", open)}
        >
          <LifestyleCompare carbonKg={comparisonKg} />
        </MethodSection>
      ) : null}
      {comparisonKg !== undefined && !omitRecommendationNotes ? (
          <MethodSection
          anchorPrefix={anchorPrefix}
          id="typical-share"
          title="Share of a comparable average person"
          open={openIds.includes("typical-share")}
          onToggle={(open) => toggleSection("typical-share", open)}
        >
          <TypicalShareNote />
        </MethodSection>
      ) : null}
      {savedKg !== undefined && !omitRecommendationNotes ? (
          <MethodSection
          anchorPrefix={anchorPrefix}
          id="saved-compare"
          title="What your changes are worth"
          open={openIds.includes("saved-compare")}
          onToggle={(open) => toggleSection("saved-compare", open)}
        >
          <SavedCompare savedKg={savedKg} />
        </MethodSection>
      ) : null}
      {footprint.lines.map((line) => {
        const before = baseline?.lines.find((item) => item.id === line.id);
        return (
          <MethodSection
            key={line.id}
            anchorPrefix={anchorPrefix}
            id={line.id}
            title={line.title}
            open={openIds.includes(line.id)}
            onToggle={(open) => toggleSection(line.id, open)}
          >
            <LineBlock line={line} before={before} />
          </MethodSection>
        );
      })}
      <MethodSection
        anchorPrefix={anchorPrefix}
        id="driving-equivalencies"
        title="Driving equivalencies"
        icon={<Car size={22} strokeWidth={1.75} />}
        open={openIds.includes("driving-equivalencies")}
        onToggle={(open) => toggleSection("driving-equivalencies", open)}
      >
        <DrivingEquivalencies />
      </MethodSection>
    </>
  );

  if (embedded) return <div className="sheet sheet-embedded">{body}</div>;

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
      <div className="sheet-scroll">{body}</div>
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
      <h4 className="method-label">How it is calculated</h4>
      <ol className="steps">
        {line.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <h4 className="method-label">Sources and assumptions</h4>
      {line.factorIds.map((id) => (
        <FactorCard key={id} id={id} />
      ))}
      <h4 className="method-label">Driving equivalent</h4>
      <FactorCard id="driving-equivalent" />
    </article>
  );
}

function LifestyleCompare({ carbonKg }: { carbonKg: number }) {
  const compare = lifestyleCompare(carbonKg);
  return (
    <article className="calc">
      <h4 className="method-label">How it is calculated</h4>
      <p className="quiet">
        A typical U.S. year in this model is {compare.typicalLabel}. {compare.percentLine}
      </p>
      <ol className="steps">
        <li>Your starting year is {plainNumber(carbonKg, 0)} kg CO2e.</li>
        <li>
          The typical year uses this app's U.S. defaults: {plainNumber(compare.typicalKg, 0)} kg CO2e.
        </li>
        <li>
          Difference ÷ typical year × 100 ≈ {compare.percent}% {compare.direction === "near" ? "difference" : compare.direction}.
        </li>
        <li>
          This is context, not a verdict. The EPA national inventory is about{" "}
          {plainNumber(usPerCapitaKgCo2e / 1000, 1)} t CO2e per person, but that includes industry and
          power, so it is a wider picture than this lifestyle year.
        </li>
      </ol>
      <h4 className="method-label">Sources and assumptions</h4>
      <FactorCard id="us-typical-year" />
      <FactorCard id="us-inventory-capita" />
    </article>
  );
}

function TypicalShareNote() {
  const typicalKg = typicalUsLifestyleKg();
  const typical = formatCarbon(typicalKg);
  return (
    <article className="calc">
      <h4 className="method-label">How it is calculated</h4>
      <p className="quiet">
        Each recommendation's kg saving is divided by this model's typical U.S. year, the same scope as
        your survey.
      </p>
      <ol className="steps">
        <li>
          A typical U.S. year in this model is {plainNumber(typicalKg, 0)} kg CO2e ({typical.value}{" "}
          {typical.unit}).
        </li>
        <li>Action saving ÷ typical year × 100 is the percent on each recommendation card.</li>
        <li>
          If you try more than one change in the same area, they are applied in order so overlapping
          cuts are counted once.
        </li>
      </ol>
      <h4 className="method-label">Sources and assumptions</h4>
      <FactorCard id="us-typical-year" />
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
      <h4 className="method-label">How it is calculated</h4>
      {equivalence.kind === "miles" ? (
        <p className="quiet">≈ {miles} miles of driving avoided</p>
      ) : null}
      {equivalence.kind === "trees" ? (
        <p className="quiet">≈ {trees} {trees === "1" ? "tree" : "trees"}</p>
      ) : null}
      <ol className="steps">
        {equivalence.kind === "miles" ? (
          <>
            <li>
              If adopted, these selected changes would reduce the modeled year by{" "}
              {plainNumber(savedKg, 0)} kg CO2e.
            </li>
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
            <li>
              If adopted, these selected changes would reduce the modeled year by{" "}
              {plainNumber(savedKg, 0)} kg CO2e.
            </li>
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
              When selected changes would reduce carbon if adopted, that estimated saving is pictured with a published
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
      <h4 className="method-label">Driving equivalent</h4>
      <FactorCard id="driving-equivalent" />
      <FactorCard id="urban-tree" />
    </article>
  );
}

function DrivingEquivalencies() {
  const perMile = published.vehicleKgCo2ePerMile;
  const factor = factors["driving-equivalent"];
  const perMileLabel = plainNumber(perMile, 3);
  return (
    <article className="calc">
      <h4 className="method-label">Source</h4>
      <p className="quiet">U.S. Environmental Protection Agency (EPA), Greenhouse Gas Equivalencies Calculator.</p>
      <h4 className="method-label">Conversion factor</h4>
      <p className="method-factor">{perMileLabel} kg CO₂e</p>
      <p className="method-factor-note">per mile driven by an average gasoline-powered passenger vehicle.</p>
      <h4 className="method-label">Calculation</h4>
      <p className="method-formula">Miles driven equivalent = kg CO₂e saved ÷ {perMileLabel}</p>
      <h4 className="method-label">Explanation</h4>
      <p className="quiet">
        Carbon Compass converts estimated emissions reductions into equivalent miles driven by an average
        gasoline-powered vehicle to help users understand their potential environmental impact.
      </p>
      <h4 className="method-label">Disclaimer</h4>
      <p className="disclaimer">
        Driving equivalencies are illustrative comparisons, not actual miles of driving avoided. Values are
        estimates based on average U.S. gasoline-powered passenger vehicles.
      </p>
      <a className="method-source" href={factor.url} target="_blank" rel="noreferrer">
        Open the source
      </a>
    </article>
  );
}

function MethodSection({
  id,
  title,
  open,
  onToggle,
  children,
  anchorPrefix,
  icon,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: (open: boolean) => void;
  children: ReactNode;
  anchorPrefix: string;
  icon?: ReactNode;
}) {
  return (
    <details
      id={`${anchorPrefix}-${id}`}
      className="method-section"
      open={open}
      onToggle={(event) => onToggle(event.currentTarget.open)}
    >
      <summary>
        <span className="method-summary-label">
          {icon ? (
            <span className="method-summary-icon" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          <span>{title}</span>
        </span>
      </summary>
      <div className="method-body">{children}</div>
    </details>
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
