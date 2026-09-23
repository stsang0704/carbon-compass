import { SourceSheet } from "../components/SourceSheet";
import { habitMeta } from "../data/habits";
import { calculate, lineForHabit } from "../model/calculate";
import type { Answers, HabitId } from "../model/types";
import { AVERAGES_NOTE } from "../model/types";

type Props = {
  baseline: Answers;
  scenario: Answers;
  focusHabitId?: HabitId;
  onClose: () => void;
};

export function Sources({ baseline, scenario, focusHabitId, onClose }: Props) {
  const current = calculate(baseline);
  const next = calculate(scenario);
  if (!focusHabitId) {
    return (
      <SourceSheet
        title="Where the numbers come from"
        intro={`${AVERAGES_NOTE} Each row is one piece of the year you are looking at.`}
        footprint={next}
        baseline={same(baseline, scenario) ? undefined : current}
        onClose={onClose}
      />
    );
  }

  const habit = habitMeta(focusHabitId);
  const focus = {
    ...next,
    lines: [lineForHabit(next, focusHabitId)],
  };
  const before = {
    ...current,
    lines: [lineForHabit(current, focusHabitId)],
  };
  return (
    <SourceSheet
      title={habit.name}
      intro={habit.why}
      footprint={focus}
      baseline={same(baseline, scenario) ? undefined : before}
      onClose={onClose}
    />
  );
}

function same(left: Answers, right: Answers): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
