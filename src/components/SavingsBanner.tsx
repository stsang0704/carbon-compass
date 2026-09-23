import { carbonShift } from "../model/format";

export function SavingsBanner({ baselineKg, scenarioKg }: { baselineKg: number; scenarioKg: number }) {
  const shift = carbonShift(baselineKg, scenarioKg);
  if (shift.direction === "same") return null;
  const lighter = shift.direction === "less";
  return (
    <div className={`savings savings-${shift.direction}`}>
      <p className="savings-kicker">{lighter ? "A lighter year" : "Heavier, if you want to see it"}</p>
      <p className="savings-value">{shift.percent}%</p>
      <p className="savings-line">
        {lighter
          ? `You could lighten your footprint by ${shift.percent}%.`
          : `This path is about ${shift.percent}% heavier than how you live now.`}
      </p>
    </div>
  );
}
