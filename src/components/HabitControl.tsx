import { useEffect, useState } from "react";
import { DietControl } from "./DietControl";
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  feel,
  homePresetOptions,
  numericPlaceholder,
} from "../data/habits";
import { habitMeta } from "../data/habits";
import { emptyDietShare, isDietShare } from "../data/diet";
import { HOME_OTHER_VALUE, isHomeOtherSelection } from "../data/home";
import type { Answers, DietShare, HabitId, OptionalNumber } from "../model/types";

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
      {control.type === "diet" ? (
        <DietControl
          value={isDietShare(value) ? value : emptyDietShare}
          onChange={(next) => onChange(next as Answers[HabitId])}
        />
      ) : control.type === "entry" ? (
        <EntryControl
          key={id}
          value={asOptionalNumber(value)}
          suffix={control.suffix}
          onChange={(next) => onChange(next)}
        />
      ) : control.type === "text" ? (
        <TextControl
          key={id}
          value={String(value ?? "")}
          placeholder={control.placeholder}
          onChange={(next) => onChange(next)}
        />
      ) : control.type === "temperature" ? (
        <TemperatureControl key={id} valueF={asOptionalNumber(value)} onChange={(next) => onChange(next)} />
      ) : control.type === "home" ? (
        <HomeTypeControl key={id} value={String(value ?? "")} onChange={(next) => onChange(next)} />
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
              {option.hint ? <p className="quiet">{option.hint}</p> : null}
            </button>
          ))}
        </div>
      )}
      {showFeel ? <p className="feel">{feel(id, baseline, value)}</p> : null}
    </div>
  );
}

function HomeTypeControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const otherOn = isHomeOtherSelection(value);
  const [custom, setCustom] = useState(() => (otherOn && value !== HOME_OTHER_VALUE ? value : ""));

  useEffect(() => {
    if (isHomeOtherSelection(value) && value !== HOME_OTHER_VALUE) setCustom(value);
  }, [value]);

  function selectPreset(next: string) {
    onChange(next);
  }

  function selectOther() {
    onChange(custom.trim() === "" ? HOME_OTHER_VALUE : custom);
  }

  return (
    <div className="stack">
      {homePresetOptions.map((option) => (
        <button
          key={option.value}
          className="choice"
          type="button"
          aria-pressed={option.value === value}
          onClick={() => selectPreset(option.value)}
        >
          <strong>{option.label}</strong>
          {option.hint ? <p className="quiet">{option.hint}</p> : null}
        </button>
      ))}
      <div className={`choice${otherOn ? " is-selected" : ""}`}>
        <button
          className="choice-inner"
          type="button"
          aria-pressed={otherOn}
          onClick={selectOther}
        >
          <strong>Other</strong>
          <p className="quiet">Tell us what type of home you live in.</p>
        </button>
        {otherOn ? (
          <input
            className="other-home-input"
            type="text"
            value={custom}
            placeholder={numericPlaceholder}
            autoCapitalize="sentences"
            aria-label="Home type"
            onChange={(event) => {
              const next = event.target.value;
              setCustom(next);
              onChange(next.trim() === "" ? HOME_OTHER_VALUE : next);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function EntryControl({
  value,
  suffix,
  onChange,
}: {
  value: OptionalNumber;
  suffix: string;
  onChange: (value: OptionalNumber) => void;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value));

  useEffect(() => {
    setDraft(value === null ? "" : String(value));
  }, [value]);

  function commit(raw: string) {
    const next = parseNonNegative(raw);
    onChange(next);
    setDraft(next === null ? "" : String(next));
  }

  return (
    <label className="stack entry-block">
      <input
        className="entry-field value-input"
        type="text"
        inputMode="decimal"
        value={draft}
        placeholder={numericPlaceholder}
        aria-label={suffix}
        onChange={(event) => {
          const next = event.target.value;
          if (next === "") {
            setDraft("");
            onChange(null);
            return;
          }
          if (!/^\d*\.?\d*$/.test(next)) return;
          setDraft(next);
          const parsed = parseNonNegative(next);
          if (parsed !== null) onChange(parsed);
        }}
        onBlur={() => commit(draft)}
      />
      <span className="entry-suffix">{suffix}</span>
    </label>
  );
}

function TextControl({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="stack entry-block">
      <input
        className="text-field value-input"
        type="text"
        value={value}
        placeholder={placeholder}
        autoCapitalize="sentences"
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TemperatureControl({
  valueF,
  onChange,
}: {
  valueF: OptionalNumber;
  onChange: (valueF: OptionalNumber) => void;
}) {
  const [unit, setUnit] = useState<"F" | "C">("F");
  const [draft, setDraft] = useState(() => shownTemp(valueF, "F"));

  useEffect(() => {
    setDraft(shownTemp(valueF, unit));
  }, [valueF, unit]);

  function commit(raw: string, nextUnit: "F" | "C") {
    const stored = toStored(raw, nextUnit);
    onChange(stored);
    setDraft(shownTemp(stored, nextUnit));
  }

  return (
    <div className="stack">
      <div className="preset-row unit-row">
        <button
          className="preset"
          type="button"
          aria-pressed={unit === "F"}
          onClick={() => setUnit("F")}
        >
          °F
        </button>
        <button
          className="preset"
          type="button"
          aria-pressed={unit === "C"}
          onClick={() => setUnit("C")}
        >
          °C
        </button>
      </div>
      <label className="stack entry-block">
        <input
          className="entry-field value-input"
          type="text"
          inputMode="decimal"
          value={draft}
          placeholder={numericPlaceholder}
          aria-label={`Winter temperature in degrees ${unit === "F" ? "Fahrenheit" : "Celsius"}`}
          onChange={(event) => {
            const next = event.target.value;
            if (next === "") {
              setDraft("");
              onChange(null);
              return;
            }
            if (!/^\d*\.?\d*$/.test(next)) return;
            setDraft(next);
            const stored = toStored(next, unit);
            if (stored !== null) onChange(stored);
          }}
          onBlur={() => commit(draft, unit)}
        />
        <span className="entry-suffix">{unit === "F" ? "degrees Fahrenheit" : "degrees Celsius"}</span>
      </label>
    </div>
  );
}

function asOptionalNumber(value: Answers[HabitId] | DietShare): OptionalNumber {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function parseNonNegative(raw: string): OptionalNumber {
  if (raw.trim() === "") return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function toStored(raw: string, nextUnit: "F" | "C"): OptionalNumber {
  const parsed = parseNonNegative(raw);
  if (parsed === null) return null;
  return nextUnit === "C" ? celsiusToFahrenheit(parsed) : parsed;
}

function shownTemp(valueF: OptionalNumber, unit: "F" | "C"): string {
  if (valueF === null) return "";
  return String(unit === "F" ? Math.round(valueF) : fahrenheitToCelsius(valueF));
}
