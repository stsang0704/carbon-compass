import { feel, formatAnswer, habitMeta, type ScaleMark } from "../data/habits";
import type { Answers, HabitId } from "../model/types";

type Props = {
  id: HabitId;
  value: Answers[HabitId];
  baseline: Answers[HabitId];
  onChange: (value: Answers[HabitId]) => void;
  showFeel?: boolean;
};

export function HabitControl({ id, value, baseline, onChange, showFeel = true }: Props) {
  const habit = habitMeta(id);
  const control = habit.control;

  return (
    <div className="stack control-card">
      {control.type === "number" ? (
        <NumberControl
          value={Number(value)}
          baseline={Number(baseline)}
          min={control.min}
          max={Math.max(control.max, Number(baseline), Number(value))}
          step={control.step}
          unit={formatAnswer(id, value)}
          zeroLabel={control.zeroLabel}
          marks={control.marks}
          onChange={(next) => onChange(next)}
        />
      ) : (
        <div className="stack">
          {control.options.map((option) => (
            <button
              key={option.value}
              className="choice"
              type="button"
              aria-pressed={option.value === value}
              onClick={() => onChange(option.value as Answers[HabitId])}
            >
              <strong>{option.label}</strong>
              <p className="quiet">{option.hint}</p>
            </button>
          ))}
        </div>
      )}
      {showFeel ? <p className="feel">{feel(id, baseline, value)}</p> : null}
    </div>
  );
}

function NumberControl({
  value,
  baseline,
  min,
  max,
  step,
  unit,
  zeroLabel,
  marks,
  onChange,
}: {
  value: number;
  baseline: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  zeroLabel?: string;
  marks?: ScaleMark[];
  onChange: (value: number) => void;
}) {
  return (
    <div className="stack">
      <div className="stepper">
        <button
          className="round"
          type="button"
          aria-label="Decrease"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
        >
          −
        </button>
        <div>
          <div className="stepper-value">{value}</div>
          <span className="stepper-unit">{unit}</span>
        </div>
        <button
          className="round"
          type="button"
          aria-label="Increase"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
        >
          +
        </button>
      </div>
      <label className="slider-block">
        <span className="slider-caption">Drag to try a different amount</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={unit}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {marks && marks.length > 0 ? (
          <span className="scale-marks">
            {marks.map((mark, index) => (
              <span
                key={mark.value}
                className="scale-mark"
                style={{ left: `${((mark.value - min) / (max - min)) * 100}%` }}
                data-edge={index === 0 ? "start" : index === marks.length - 1 ? "end" : "mid"}
              >
                <strong>{mark.value}</strong>
                <span>{mark.label}</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="slider-ends">
            <span>{min}</span>
            <span>Now {baseline}</span>
            <span>{max}</span>
          </span>
        )}
      </label>
      {zeroLabel ? (
        <button
          className="choice"
          type="button"
          aria-pressed={value === 0}
          onClick={() => onChange(0)}
        >
          <strong>{zeroLabel}</strong>
        </button>
      ) : null}
    </div>
  );
}
