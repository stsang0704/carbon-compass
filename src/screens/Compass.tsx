import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { PhoneShell } from "../components/PhoneShell";
import { calculate } from "../model/calculate";
import { formatCarbon } from "../model/format";
import { footprintInsight } from "../model/insight";
import type { Answers, Category } from "../model/types";
import { Sources } from "./Sources";

type Props = {
  baseline: Answers;
  scenario: Answers;
  onExplore: () => void;
  onBrowse: (category: Category) => void;
  onEdit: () => void;
  sourcesOpen?: boolean;
  onSourcesOpenChange?: (open: boolean) => void;
};

export function Compass({
  baseline,
  scenario,
  onExplore,
  onBrowse,
  onEdit,
  sourcesOpen,
  onSourcesOpenChange,
}: Props) {
  const current = calculate(baseline);
  const carbon = formatCarbon(current.totals.carbon);

  return (
    <PhoneShell
      heroTone="teal"
      hero={
        <>
          <p className="kicker">My Footprint</p>
          <p className="hero-count">Estimated annual footprint</p>
          <h2 className="hero-gallons">
            {carbon.value} {carbon.unit} CO₂e / year
          </h2>
        </>
      }
    >
      <p className="footprint-insight">{footprintInsight(current)}</p>
      <Sources
        embedded
        baseline={baseline}
        scenario={scenario}
        onClose={() => undefined}
        sourcesOpen={sourcesOpen}
        onSourcesOpenChange={onSourcesOpenChange}
      />
      <CategoryBreakdown title="By category" footprint={current} onOpenCategory={onBrowse} />
      <button className="plant-card plan-cta" type="button" onClick={onExplore}>
        <span className="plan-cta-copy">
          <span className="plan-cta-title">Explore</span>
          <span className="plan-cta-sub">See changes that fit this footprint</span>
        </span>
        <span className="category-chevron" aria-hidden="true">
          →
        </span>
      </button>
      <button className="btn-secondary" type="button" onClick={onEdit}>
        Edit My Footprint
      </button>
    </PhoneShell>
  );
}
