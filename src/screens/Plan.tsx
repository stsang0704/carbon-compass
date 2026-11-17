import { PhoneShell } from "../components/PhoneShell";
import { RecommendationCard } from "../components/RecommendationCard";
import { personalizedRecommendations, type RecId } from "../data/recommendations";
import type { Answers } from "../model/types";

type Props = {
  baseline: Answers;
  selected: RecId[];
  onToggle: (id: RecId) => void;
  onBack: () => void;
  onMix: () => void;
  onSources: () => void;
};

export function Plan({ baseline, selected, onToggle, onBack, onMix, onSources }: Props) {
  const top = personalizedRecommendations(baseline, [], 3);

  return (
    <PhoneShell
      onBack={onBack}
      backLabel="My Footprint"
      kicker="For You"
      action={
        <button className="text-button" type="button" onClick={onMix}>
          Potential Impact
        </button>
      }
    >
      <section className="rec-section">
        <h3>Three actions for your footprint</h3>
        <p className="quiet">Largest cuts first. Adding one does not change your footprint.</p>
        <div className="rec-list">
          {top.length === 0 ? (
            <p className="body-copy">Every modeled action is already in your plan, or none currently apply to your habits.</p>
          ) : (
            top.map((item, index) => (
              <RecommendationCard
                key={item.rec.id}
                rec={item.rec}
                baseline={baseline}
                added={selected.includes(item.rec.id)}
                rank={index + 1}
                savedKg={item.saved}
                onToggle={() => onToggle(item.rec.id)}
              />
            ))
          )}
        </div>
      </section>
      <button className="btn-secondary" type="button" onClick={onSources}>
        Where the numbers come from
      </button>
    </PhoneShell>
  );
}
