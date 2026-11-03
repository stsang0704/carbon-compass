import { useState } from "react";
import { Car, House, Leaf, Shirt, type LucideIcon } from "lucide-react";
import { formatCarbon } from "../model/format";
import { formatPotentialKg, formatPotentialPair, potentialCategoryBar } from "../model/potentialBar";
import type { Category, Footprint } from "../model/types";
import { categories } from "../model/types";

const outlineIcons: Record<Category, LucideIcon> = {
  travel: Car,
  food: Leaf,
  home: House,
  stuff: Shirt,
};

const iconSize = 40;
const iconStroke = 1.75;

type Props = {
  title: string;
  footprint: Footprint;
  before?: Footprint;
  caption?: string;
  onOpenCategory?: (category: Category) => void;
};

export function CategoryBreakdown({
  title,
  footprint,
  before,
  caption,
  onOpenCategory,
}: Props) {
  if (before) return <PotentialBars title={title} footprint={footprint} before={before} caption={caption} />;
  return <ShareBreakdown title={title} footprint={footprint} onOpenCategory={onOpenCategory} />;
}

function PotentialBars({
  title,
  footprint,
  before,
  caption = "A possible footprint if these selected changes were adopted, not a confirmed reduction.",
}: {
  title: string;
  footprint: Footprint;
  before: Footprint;
  caption?: string;
}) {
  return (
    <section className="breakdown">
      <h3>{title}</h3>
      <p className="disclaimer">{caption}</p>
      <div className="breakdown-list">
        {categories.map((category) => {
          const originalKg = before.byCategory[category.id].carbon;
          const scenarioKg = footprint.byCategory[category.id].carbon;
          const bar = potentialCategoryBar(originalKg, scenarioKg);
          const tonnes = formatPotentialPair(bar.originalKg, bar.nextKg);
          return (
            <article key={category.id} className="breakdown-card">
              <div className="breakdown-head is-static">
                <CategoryGlyph id={category.id} />
                <span className="breakdown-copy">
                  <span className="breakdown-title">
                    {category.label}: {tonnes.original} → {tonnes.next} CO₂e/year
                  </span>
                  <span className={`bar bar-${category.id} bar-potential`} aria-hidden="true">
                    {bar.coloredPercent > 0 ? (
                      <span className="is-next" style={{ width: `${bar.coloredPercent}%` }} />
                    ) : null}
                    {bar.greyPercent > 0 ? (
                      <span className="is-cut" style={{ width: `${bar.greyPercent}%` }} />
                    ) : null}
                  </span>
                  <span className="breakdown-meta">
                    Potential reduction: {formatPotentialKg(bar.savingsKg)} kg CO₂e/year
                  </span>
                  {bar.inconsistent ? (
                    <span className="quiet">
                      This potential reduction is larger than the original {category.label} footprint, so the bar stops
                      at that original amount. The estimate needs another look.
                    </span>
                  ) : null}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ShareBreakdown({
  title,
  footprint,
  onOpenCategory,
}: {
  title: string;
  footprint: Footprint;
  onOpenCategory?: (category: Category) => void;
}) {
  const [openId, setOpenId] = useState<Category | null>(null);
  const rows = categories
    .map((category) => ({ ...category, value: footprint.byCategory[category.id].carbon }))
    .sort((left, right) => right.value - left.value);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <section className="breakdown">
      <h3>{title}</h3>
      <div className="breakdown-list">
        {rows.map((row) => {
          const parts = formatCarbon(row.value);
          const share = total > 0 ? Math.round((row.value / total) * 100) : 0;
          const open = openId === row.id;
          const lines = footprint.lines.filter((line) => line.category === row.id);
          return (
            <article key={row.id} className={`breakdown-card breakdown-share breakdown-share-${row.id} ${open ? "is-open" : ""}`}>
              <button
                className="breakdown-head"
                type="button"
                onClick={() => setOpenId((current) => (current === row.id ? null : row.id))}
                aria-expanded={open}
              >
                <CategoryGlyph id={row.id} size={36} />
                <span className="breakdown-copy">
                  <span className="breakdown-label">
                    <span className="breakdown-title">{row.label}</span>
                    <span className="breakdown-meta">
                      {parts.value} {parts.unit} · {share}%
                    </span>
                  </span>
                  <span className={`bar bar-${row.id}`}>
                    <span style={{ width: `${Math.max(share, valueWidth(share))}%` }} />
                  </span>
                </span>
                <span className="rec-arrow" aria-hidden="true">
                  →
                </span>
              </button>
              {open ? (
                <div className="breakdown-panel">
                  {lines.map((line) => {
                    const lineParts = formatCarbon(line.carbon);
                    return (
                      <p key={line.id} className="quiet">
                        {line.title}: {lineParts.value} {lineParts.unit}
                      </p>
                    );
                  })}
                  {onOpenCategory ? (
                    <button className="text-button breakdown-link" type="button" onClick={() => onOpenCategory(row.id)}>
                      See changes in {row.label}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function valueWidth(share: number): number {
  return share > 0 ? 8 : 0;
}

export function CategoryGlyph({ id, size = iconSize }: { id: Category; size?: number }) {
  const Icon = outlineIcons[id];
  return (
    <span className={`glyph glyph-${id} glyph-outline`} aria-hidden="true">
      <Icon size={size} strokeWidth={iconStroke} absoluteStrokeWidth />
    </span>
  );
}
