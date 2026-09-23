import type { Category } from "../model/types";
import { categories } from "../model/types";

const rotation: Record<Category, number> = {
  food: 0,
  travel: 90,
  home: 180,
  stuff: 270,
};

const place: Record<Category, string> = {
  food: "n",
  travel: "e",
  home: "s",
  stuff: "w",
};

export function CompassRose({ category }: { category: Category }) {
  const label = categories.find((item) => item.id === category)?.label ?? "Food";
  return (
    <div className="rose-wrap" role="img" aria-label={`Compass pointing to ${label}`}>
      {categories.map((item) => (
        <span
          key={item.id}
          className={`rose-label ${place[item.id]} ${item.id === category ? "active" : ""}`}
        >
          {item.label}
        </span>
      ))}
      <svg className="rose" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="78" fill="#fffaf3" stroke="#1c3d32" strokeWidth="1.4" />
        <circle cx="100" cy="100" r="46" fill="#e7f4ee" stroke="rgba(28,61,50,0.18)" strokeWidth="1" />
        {[0, 90, 180, 270].map((angle) => (
          <line
            key={angle}
            x1="100"
            y1="28"
            x2="100"
            y2="40"
            stroke="#1c3d32"
            strokeWidth="1.6"
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
        <g className="needle" style={{ transform: `rotate(${rotation[category]}deg)` }}>
          <polygon points="100,32 107,104 100,94 93,104" fill="#53AB8B" />
        </g>
        <circle cx="100" cy="100" r="4.5" fill="#1c3d32" />
      </svg>
    </div>
  );
}
