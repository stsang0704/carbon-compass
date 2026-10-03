import { useEffect, useRef, useState } from "react";
import {
  dietCategories,
  dietIsComplete,
  dietRemainder,
  dietSum,
  emptyDietShare,
  isDietShare,
  sanitizeDietShare,
} from "../data/diet";
import type { DietCategory, DietShare } from "../model/types";

export function DietControl({
  value,
  onChange,
}: {
  value: DietShare;
  onChange: (value: DietShare) => void;
}) {
  const share = isDietShare(value) ? sanitizeDietShare(value) : emptyDietShare;
  const shareRef = useRef(share);
  shareRef.current = share;
  const [drafts, setDrafts] = useState<Record<DietCategory, string>>(() => draftsFrom(share));

  useEffect(() => {
    setDrafts(draftsFrom(share));
  }, [share.plant, share.chickenPork, share.fish, share.beef]);

  const total = dietSum(share);
  const remaining = dietRemainder(share);
  const complete = dietIsComplete(share);

  function setCategory(id: DietCategory, raw: string) {
    if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
    setDrafts((current) => ({ ...current, [id]: raw }));
    const parsed = raw.trim() === "" ? 0 : Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    const next = { ...shareRef.current, [id]: parsed };
    shareRef.current = next;
    onChange(next);
  }

  return (
    <div className="stack diet-control">
      <DietDonut share={share} />
      <p className={`diet-status ${complete ? "ok" : remaining < 0 ? "over" : "remain"}`}>
        {complete
          ? "These add up to 100% of your diet."
          : remaining > 0
            ? `${plainPercent(remaining)}% remaining to reach 100% of your diet.`
            : `${plainPercent(Math.abs(remaining))}% over 100%. Reduce one or more categories to continue.`}
      </p>
      <div className="diet-rows">
        {dietCategories.map((category) => (
          <label key={category.id} className="diet-row">
            <span className="diet-swatch" style={{ background: category.color }} aria-hidden="true" />
            <span className="diet-copy">
              <span className="diet-label">{category.label}</span>
              <strong className="diet-live">{plainPercent(share[category.id])}%</strong>
            </span>
            <input
              className="diet-percent"
              type="text"
              inputMode="decimal"
              value={drafts[category.id]}
              placeholder="0"
              aria-label={`${category.label} percentage`}
              onChange={(event) => setCategory(category.id, event.target.value)}
              onBlur={() => setDrafts(draftsFrom(share))}
            />
          </label>
        ))}
      </div>
      <p className="quiet diet-total">Total {plainPercent(total)}%</p>
    </div>
  );
}

function DietDonut({ share }: { share: DietShare }) {
  const size = 168;
  const stroke = 26;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = dietSum(share);
  const scale = total > 100 ? 100 / total : 1;
  let offset = 0;
  const slices = dietCategories.map((category) => {
    const length = (share[category.id] * scale * circumference) / 100;
    const slice = { ...category, length, dashOffset: -offset };
    offset += length;
    return slice;
  });

  return (
    <svg className="diet-donut" viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`Diet mix totaling ${plainPercent(total)} percent`}>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#efe8dc"
        strokeWidth={stroke}
      />
      {slices
        .filter((slice) => slice.length > 0.2)
        .map((slice) => (
          <circle
            key={slice.id}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={slice.color}
            strokeWidth={stroke}
            strokeDasharray={`${slice.length} ${circumference}`}
            strokeDashoffset={slice.dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
          />
        ))}
      <text className="diet-donut-value" x={center} y={center - 6} textAnchor="middle">
        {plainPercent(total)}%
      </text>
      <text className="diet-donut-caption" x={center} y={center + 16} textAnchor="middle">
        of diet
      </text>
    </svg>
  );
}

function draftsFrom(share: DietShare): Record<DietCategory, string> {
  return {
    plant: share.plant === 0 ? "" : String(share.plant),
    chickenPork: share.chickenPork === 0 ? "" : String(share.chickenPork),
    fish: share.fish === 0 ? "" : String(share.fish),
    beef: share.beef === 0 ? "" : String(share.beef),
  };
}

function plainPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
