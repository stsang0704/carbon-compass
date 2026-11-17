import { categories, type Category, type Footprint } from "./types";

export type FootprintFocus = {
  id: Category;
  label: string;
  share: number;
  /** Main line inside the largest category, when it is most of that category. */
  piece: string | null;
};

/** Largest category in the estimate, for a chip on that bar. */
export function footprintFocus(footprint: Footprint): FootprintFocus | null {
  const ranked = categories
    .map((category, index) => ({
      id: category.id,
      label: category.label,
      kg: footprint.byCategory[category.id].carbon,
      index,
    }))
    .sort((left, right) => right.kg - left.kg || left.index - right.index);
  const total = ranked.reduce((sum, category) => sum + category.kg, 0);
  const top = ranked[0];
  if (!top || total <= 0) return null;
  const share = Math.round((top.kg / total) * 100);
  const main = footprint.lines
    .filter((line) => line.category === top.id)
    .sort((left, right) => right.carbon - left.carbon)[0];
  const piece = main && top.kg > 0 && main.carbon >= top.kg * 0.5 ? main.title.toLowerCase() : null;
  return { id: top.id, label: top.label, share, piece };
}

/** One sentence from the estimate itself: the largest category, and its main piece when that piece is most of the category. */
export function footprintInsight(footprint: Footprint): string {
  const focus = footprintFocus(footprint);
  if (!focus) {
    return "This estimate is very small in this model. The categories below show where each part comes from.";
  }
  const detail = focus.piece ? ` Most of that is ${focus.piece}.` : "";
  return `${focus.label} is the largest part of this estimate, about ${focus.share}%.${detail}`;
}
