import { PhoneShell } from "../components/PhoneShell";
import { SourceSheet } from "../components/SourceSheet";
import { calculate } from "../model/calculate";
import type { Answers } from "../model/types";
import { AVERAGES_NOTE } from "../model/types";

type Props = {
  baseline: Answers;
  focusId: string | null;
  onClose: () => void;
};

export function Methodology({ baseline, focusId, onClose }: Props) {
  const current = calculate(baseline);
  return (
    <div className="method-page">
    <PhoneShell
      onBack={onClose}
      backLabel="Back"
      hero={
        <>
          <p className="kicker">About</p>
          <h2>Where the numbers come from</h2>
          <p className="lede">Open one topic at a time.</p>
        </>
      }
    >
      <SourceSheet
        embedded
        omitRecommendationNotes
        anchorPrefix="about"
        focusId={focusId}
        title="Where the numbers come from"
        intro={`${AVERAGES_NOTE} Each section is one piece of the year you are looking at.`}
        footprint={current}
        comparisonKg={current.totals.carbon}
        onClose={onClose}
      />
    </PhoneShell>
    </div>
  );
}
