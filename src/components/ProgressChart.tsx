import type { ProgressPoint } from "../model/checkin";
import { formatCarbonPerYear } from "../model/format";
import { monthLabel } from "../model/progress";

export function ProgressChart({ points }: { points: ProgressPoint[] }) {
  const width = 320;
  const height = 180;
  const pad = { top: 12, right: 8, bottom: 28, left: 32 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const tonnes = points.map((point) => point.carbonKg / 1000);
  const min = Math.min(...tonnes);
  const max = Math.max(...tonnes);
  const span = max - min;
  let yMin = span === 0 ? Math.max(0, min - Math.max(min * 0.18, 0.4)) : min - span * 0.18;
  let yMax = span === 0 ? max + Math.max(max * 0.18, 0.4) : max + span * 0.18;
  if (yMin < 0) yMin = 0;
  if (yMax <= yMin) yMax = yMin + 1;

  const x = (index: number) =>
    points.length === 1 ? pad.left + plotW / 2 : pad.left + (index / (points.length - 1)) * plotW;
  const y = (value: number) => pad.top + (1 - (value - yMin) / (yMax - yMin)) * plotH;
  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.carbonKg / 1000).toFixed(1)}`)
    .join(" ");
  const ticks = [yMax, (yMax + yMin) / 2, yMin];
  const labels = labelIndexes(points.length);
  const names = points.map((point, index) => pointLabel(point, index, points));
  const summary = points
    .map((point, index) => {
      const when = point.kind === "baseline" ? "Original survey" : "Check-in";
      const dated = point.month ? monthLabel(point.month) : names[index];
      return `${when}, ${dated}: ${formatCarbonPerYear(point.carbonKg)}`;
    })
    .join(". ");

  return (
    <svg
      className="progress-chart"
      data-no-swipe
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Estimated annual tonnes of CO₂e. ${summary}`}
    >
      {ticks.map((value) => (
        <g key={value}>
          <line
            x1={pad.left}
            x2={width - pad.right}
            y1={y(value)}
            y2={y(value)}
            stroke="rgba(23, 62, 56, 0.12)"
            strokeWidth="1"
          />
          <text x={pad.left - 6} y={y(value) + 4} textAnchor="end" fill="#3e5c55" fontSize="10">
            {tonnesLabel(value)}
          </text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#146b4e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle
          key={`${point.kind}-${point.month}-${index}`}
          cx={x(index)}
          cy={y(point.carbonKg / 1000)}
          r="4.5"
          fill={point.kind === "baseline" ? "#8eaea0" : "#4fc59b"}
          stroke="#173e38"
          strokeWidth="1.5"
        />
      ))}
      {points.map((point, index) =>
        labels.has(index) ? (
          <text
            key={`label-${point.kind}-${index}`}
            x={labelX(index, points.length, x(index), width)}
            y={height - 8}
            textAnchor={labelAnchor(index, points.length)}
            fill="#3e5c55"
            fontSize="10"
          >
            {names[index]}
          </text>
        ) : null,
      )}
    </svg>
  );
}

function labelAnchor(index: number, count: number): "start" | "middle" | "end" {
  if (count <= 1) return "middle";
  if (index === 0) return "start";
  if (index === count - 1) return "end";
  return "middle";
}

function labelX(index: number, count: number, pointX: number, width: number): number {
  if (count <= 1) return pointX;
  if (index === 0) return Math.max(4, pointX - 8);
  if (index === count - 1) return Math.min(width - 4, pointX + 8);
  return pointX;
}
function labelIndexes(count: number): Set<number> {
  if (count <= 4) return new Set(Array.from({ length: count }, (_, index) => index));
  return new Set([0, Math.round((count - 1) / 2), count - 1]);
}

function pointLabel(point: ProgressPoint, index: number, points: ProgressPoint[]): string {
  const dated = monthYear(point.month);
  if (point.kind !== "baseline") return dated;
  const sharesMonth = points.some((other, otherIndex) => otherIndex !== index && other.month && other.month === point.month);
  if (sharesMonth) return "Baseline";
  return dated;
}

function monthYear(month: string): string {
  if (!/^\d{4}-\d{2}$/.test(month)) return "Baseline";
  const [year, part] = month.split("-");
  const date = new Date(Number(year), Number(part) - 1, 1);
  return date.toLocaleString("en-US", { month: "short", year: "numeric" });
}

function tonnesLabel(tonnes: number): string {
  const value = Math.max(0, tonnes);
  if (value >= 10) return String(Math.round(value));
  const digits = value >= 1 ? 1 : 2;
  return value.toFixed(digits).replace(/\.0$/, "");
}
