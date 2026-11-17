import { useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import { PhoneShell } from "../components/PhoneShell";
import { SourceSheet } from "../components/SourceSheet";
import { UsCompareChart } from "../components/UsCompareChart";
import { habitMeta } from "../data/habits";
import { calculate, lineForHabit } from "../model/calculate";
import type { Answers, HabitId } from "../model/types";
import { AVERAGES_NOTE } from "../model/types";

type Props = {
  baseline: Answers;
  scenario: Answers;
  focusHabitId?: HabitId;
  onClose: () => void;
  sourcesOpen?: boolean;
  onSourcesOpenChange?: (open: boolean) => void;
  /** Renders the explanation inside My Footprint instead of as its own screen. */
  embedded?: boolean;
};

export function Sources({
  baseline,
  scenario,
  focusHabitId,
  onClose,
  sourcesOpen = false,
  onSourcesOpenChange,
  embedded = false,
}: Props) {
  const sourcesRef = useRef<HTMLDetailsElement>(null);
  const returnScroll = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!embedded || !sourcesOpen) return;
    sourcesRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [embedded, sourcesOpen]);
  useEffect(() => () => returnScroll.current?.abort(), []);

  function onSummaryClick(event: ReactMouseEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const summary = event.currentTarget;
    const details = summary.closest("details");
    if (!(details instanceof HTMLDetailsElement) || !details.open) return;
    const pane = details.closest(".view-pane");
    if (!(pane instanceof HTMLElement)) return;
    if (returnScroll.current) {
      event.preventDefault();
      return;
    }
    const target = inFlowTop(summary, pane);
    if (pane.scrollTop <= target + 8) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      pane.scrollTop = target;
      onSourcesOpenChange?.(false);
      return;
    }

    const controller = new AbortController();
    returnScroll.current = controller;
    let finished = false;
    let timer = 0;
    const stop = (close: boolean) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      returnScroll.current = null;
      controller.abort();
      if (close) onSourcesOpenChange?.(false);
    };
    controller.signal.addEventListener("abort", () => window.clearTimeout(timer));
    pane.addEventListener("pointerdown", () => stop(false), { signal: controller.signal });
    pane.addEventListener("wheel", () => stop(false), { signal: controller.signal, passive: true });
    pane.addEventListener(
      "scrollend",
      () => {
        if (Math.abs(pane.scrollTop - target) <= 2) stop(true);
      },
      { signal: controller.signal },
    );
    timer = window.setTimeout(() => {
      if (Math.abs(pane.scrollTop - target) > 2) pane.scrollTop = target;
      stop(true);
    }, 2000);
    pane.scrollTo({ top: target, behavior: "smooth" });
  }

  const current = calculate(baseline);
  const next = calculate(scenario);
  if (!focusHabitId) {
    const explanation = (
      <>
        {embedded ? null : <UsCompareChart carbonKg={current.totals.carbon} />}
        <details
          ref={sourcesRef}
          className="sources-disclosure"
          data-no-swipe
          open={sourcesOpen}
          onToggle={(event) => onSourcesOpenChange?.(event.currentTarget.open)}
        >
          <summary onClick={onSummaryClick}>Where the numbers come from</summary>
          <SourceSheet
            embedded
            omitRecommendationNotes
            title="Where the numbers come from"
            intro={`${AVERAGES_NOTE} Each row is one piece of the year you are looking at.`}
            footprint={current}
            comparisonKg={current.totals.carbon}
            onClose={onClose}
          />
        </details>
      </>
    );
    if (embedded) return explanation;
    return (
      <PhoneShell
        hero={
          <>
            <p className="kicker">My Footprint</p>
            <h2>Understand</h2>
          </>
        }
      >
        {explanation}
      </PhoneShell>
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

/** Layout position inside the scroll pane, ignoring a sticky offset. */
function inFlowTop(summary: HTMLElement, pane: HTMLElement): number {
  const previous = summary.style.position;
  summary.style.position = "static";
  try {
    const top = summary.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop;
    return Math.max(0, top);
  } finally {
    summary.style.position = previous;
  }
}
