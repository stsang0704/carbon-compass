import { categories, type Footprint } from "./types";

/** One sentence from the estimate itself: the largest category, and its main piece when that piece is most of the category. */
export function footprintInsight(footprint: Footprint): string {
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
  if (!top || total <= 0) {
    return "This estimate is very small in this model. The categories below show where each part comes from.";
  }
  const share = Math.round((top.kg / total) * 100);
  const main = footprint.lines
    .filter((line) => line.category === top.id)
    .sort((left, right) => right.carbon - left.carbon)[0];
  const detail =
    main && top.kg > 0 && main.carbon >= top.kg * 0.5 ? ` Most of that is ${main.title.toLowerCase()}.` : "";
  return `${top.label} is the largest part of this estimate, about ${share}%.${detail}`;
}
