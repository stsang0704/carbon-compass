import {
  assumptions,
  dieselKgPerKwh,
  flightKgPerPassengerMile,
  garmentKgCo2e,
  garmentLiters,
  gasKgPerKwh,
  gridKgPerKwh,
  jetKwhPerGallon,
  mixedMeatKgCo2ePerKg,
  mixedMeatLitersPerKg,
  mixedMeatMjPerKg,
  mjToKwh,
  published,
  vehicleKwhPerMile,
} from "../data/factors";
import { easeValue, habitsIn } from "../data/habits";
import type {
  Answers,
  Category,
  Footprint,
  HabitId,
  HeatSource,
  HeatingHabit,
  HomeSize,
  ImpactLine,
  Impacts,
} from "./types";
import { categories } from "./types";
import { addImpacts, emptyImpacts, plainNumber } from "./format";

const portion = assumptions.meatPortionKg;

export function calculate(answers: Answers): Footprint {
  const lines = [
    meatLine(answers),
    foodWasteLine(answers),
    drivingLine(answers),
    flightLine(answers),
    heatingLine(answers),
    clothesLine(answers),
    ordersLine(answers),
  ];
  const totals = lines.reduce((sum, line) => addImpacts(sum, impactsOf(line)), emptyImpacts());
  const byCategory = Object.fromEntries(
    categories.map((category) => [
      category.id,
      lines
        .filter((line) => line.category === category.id)
        .reduce((sum, line) => addImpacts(sum, impactsOf(line)), emptyImpacts()),
    ]),
  ) as Record<Category, Impacts>;
  return { lines, totals, byCategory };
}

export function impactsOf(line: ImpactLine): Impacts {
  return { carbon: line.carbon, water: line.water, energy: line.energy };
}

export function lineForHabit(footprint: Footprint, habitId: HabitId): ImpactLine {
  const line = footprint.lines.find((item) => item.habitIds.includes(habitId));
  if (!line) throw new Error(`No line for ${habitId}`);
  return line;
}

export function replaceAnswer<K extends HabitId>(
  answers: Answers,
  id: K,
  value: Answers[K],
): Answers {
  return { ...answers, [id]: value };
}

/** Where a modest step saves the most carbon, and the habit inside that area that does the most of it. */
export function bestSmallMove(baseline: Answers): {
  category: Category;
  habitId: HabitId;
  categorySaved: number;
  habitSaved: number;
} {
  const base = calculate(baseline);
  let category: Category = "food";
  let categorySaved = -Infinity;
  let habitId: HabitId = "meatMealsPerWeek";
  let habitSaved = -Infinity;

  for (const area of categories) {
    let scenario = baseline;
    let areaHabit: HabitId = habitsIn(area.id)[0].id;
    let areaHabitSaved = -Infinity;
    for (const habit of habitsIn(area.id)) {
      const eased = easeValue(habit.id, baseline[habit.id]);
      scenario = replaceAnswer(scenario, habit.id, eased);
      const solo = replaceAnswer(baseline, habit.id, eased);
      const saved = base.totals.carbon - calculate(solo).totals.carbon;
      if (saved > areaHabitSaved) {
        areaHabit = habit.id;
        areaHabitSaved = saved;
      }
    }
    const saved = base.totals.carbon - calculate(scenario).totals.carbon;
    if (saved > categorySaved) {
      category = area.id;
      categorySaved = saved;
      habitId = areaHabit;
      habitSaved = areaHabitSaved;
    }
  }

  if (categorySaved <= 0) {
    let largest: Category = "food";
    let largestCarbon = -Infinity;
    for (const area of categories) {
      if (base.byCategory[area.id].carbon > largestCarbon) {
        largest = area.id;
        largestCarbon = base.byCategory[area.id].carbon;
      }
    }
    const line = [...base.lines]
      .filter((item) => item.category === largest)
      .sort((a, b) => b.carbon - a.carbon)[0];
    return {
      category: largest,
      habitId: line.habitIds[0],
      categorySaved: 0,
      habitSaved: 0,
    };
  }

  return { category, habitId, categorySaved, habitSaved };
}

function meatLine(answers: Answers): ImpactLine {
  const meals = answers.meatMealsPerWeek * assumptions.weeksPerYear;
  const kg = meals * portion;
  const carbon = kg * mixedMeatKgCo2ePerKg;
  const water = kg * mixedMeatLitersPerKg;
  const energy = kg * mixedMeatMjPerKg * mjToKwh;
  return {
    id: "meat",
    habitIds: ["meatMealsPerWeek"],
    category: "food",
    title: "Meals with meat",
    carbon,
    water,
    energy,
    waterKind: "virtual",
    energyKind: "embodied",
    factorIds: ["mixed-meat", "portion"],
    steps: [
      `${plainNumber(answers.meatMealsPerWeek, 0)} meals a week × ${assumptions.weeksPerYear} weeks = ${plainNumber(meals, 0)} meals a year.`,
      `Each meal counts ${plainNumber(portion * 1000, 0)} g. The mix is half poultry, 30% pork, and 20% beef or lamb, because the question does not name the meat.`,
      `${plainNumber(kg, 1)} kg × ${plainNumber(mixedMeatKgCo2ePerKg, 2)} kg CO2e per kg = ${plainNumber(carbon, 0)} kg CO2e.`,
      `${plainNumber(kg, 1)} kg × ${plainNumber(mixedMeatLitersPerKg, 0)} L per kg = ${plainNumber(water, 0)} L of virtual water.`,
      `${plainNumber(kg, 1)} kg × ${plainNumber(mixedMeatMjPerKg, 1)} MJ per kg ÷ 3.6 = ${plainNumber(energy, 0)} kWh of farm energy.`,
    ],
  };
}

function foodWasteLine(answers: Answers): ImpactLine {
  const eaten = impactsOf(meatLine(answers));
  const extra = assumptions.wasteExtra[answers.foodWaste];
  const carbon = eaten.carbon * extra;
  const water = eaten.water * extra;
  const energy = eaten.energy * extra;
  const label =
    answers.foodWaste === "rarely" ? "Rarely" : answers.foodWaste === "sometimes" ? "Sometimes" : "Often";
  return {
    id: "food-waste",
    habitIds: ["foodWaste"],
    category: "food",
    title: "Food thrown out",
    carbon,
    water,
    energy,
    waterKind: "virtual",
    energyKind: "embodied",
    factorIds: ["food-waste", "mixed-meat"],
    steps: [
      `Meat meals above, before waste: ${plainNumber(eaten.carbon, 0)} kg CO2e, ${plainNumber(eaten.water, 0)} L, ${plainNumber(eaten.energy, 0)} kWh.`,
      `${label} thrown out means about ${plainNumber(extra * 100, 0)}% more of that food is produced than eaten.`,
      `${plainNumber(eaten.carbon, 0)} kg × ${plainNumber(extra, 2)} = ${plainNumber(carbon, 0)} kg CO2e from food that is wasted.`,
      `The same share applies to virtual water and farm energy.`,
    ],
  };
}

function drivingLine(answers: Answers): ImpactLine {
  const miles = answers.milesPerWeek * assumptions.weeksPerYear;
  const carbon = miles * published.vehicleKgCo2ePerMile;
  const energy = miles * vehicleKwhPerMile;
  return {
    id: "driving",
    habitIds: ["milesPerWeek"],
    category: "travel",
    title: "Driving",
    carbon,
    water: 0,
    energy,
    waterKind: "none",
    energyKind: "fuel",
    factorIds: ["vehicle-carbon", "vehicle-energy"],
    steps: [
      answers.milesPerWeek === 0
        ? "No miles, so this row is zero."
        : `${plainNumber(answers.milesPerWeek, 0)} miles a week × ${assumptions.weeksPerYear} weeks = ${plainNumber(miles, 0)} miles a year.`,
      `${plainNumber(miles, 0)} miles × ${plainNumber(published.vehicleKgCo2ePerMile, 3)} kg CO2e per mile = ${plainNumber(carbon, 0)} kg CO2e.`,
      `${plainNumber(miles, 0)} miles × ${plainNumber(vehicleKwhPerMile, 2)} kWh of gasoline per mile = ${plainNumber(energy, 0)} kWh.`,
      "Water for refining fuel is not included.",
    ],
  };
}

function flightLine(answers: Answers): ImpactLine {
  const miles = answers.flightsPerYear * assumptions.domesticRoundTripMiles;
  const carbon = miles * flightKgPerPassengerMile;
  const gallons =
    (miles * published.flightKgCo2PerPassengerMile) / published.jetKgCo2PerGallon;
  const energy = gallons * jetKwhPerGallon;
  return {
    id: "flights",
    habitIds: ["flightsPerYear"],
    category: "travel",
    title: "Flights",
    carbon,
    water: 0,
    energy,
    waterKind: "none",
    energyKind: "fuel",
    factorIds: ["flight-carbon", "flight-distance", "flight-energy"],
    steps: [
      `${plainNumber(answers.flightsPerYear, 0)} round trips × ${plainNumber(assumptions.domesticRoundTripMiles, 0)} passenger-miles = ${plainNumber(miles, 0)} passenger-miles.`,
      `That distance is the app's typical US domestic round trip: 1,000 miles each way.`,
      `${plainNumber(miles, 0)} passenger-miles × ${plainNumber(flightKgPerPassengerMile, 3)} kg CO2e per passenger-mile = ${plainNumber(carbon, 0)} kg CO2e.`,
      `Fuel from the CO2 portion: ${plainNumber(miles * published.flightKgCo2PerPassengerMile, 0)} kg CO2 ÷ ${published.jetKgCo2PerGallon} kg per gallon = ${plainNumber(gallons, 0)} gallons.`,
      `${plainNumber(gallons, 0)} gallons × ${plainNumber(jetKwhPerGallon, 1)} kWh per gallon = ${plainNumber(energy, 0)} kWh of jet fuel.`,
      "Contrails are not in this number. Water is not included.",
    ],
  };
}

function heatingLine(answers: Answers): ImpactLine {
  const load = assumptions.heatingLoadKwh[answers.homeSize];
  const heatNeed = scaledHeat(load, answers.heatingHabit);
  const source = resolvedHeat(answers.heatSource);
  const site = source === "heatPump" ? heatNeed / assumptions.heatPumpCop : heatNeed;
  const carbon = source === "gas" ? heatNeed * gasKgPerKwh : site * gridKgPerKwh;
  const sourceLabel =
    source === "gas" ? "Gas furnace" : source === "resistance" ? "Electric resistance" : "Heat pump";
  const carbonStep =
    source === "gas"
      ? `${plainNumber(heatNeed, 0)} kWh of gas × ${plainNumber(gasKgPerKwh, 3)} kg CO2e per kWh = ${plainNumber(carbon, 0)} kg CO2e.`
      : `${plainNumber(site, 0)} kWh of electricity × ${plainNumber(gridKgPerKwh, 3)} kg CO2e per kWh = ${plainNumber(carbon, 0)} kg CO2e.`;
  const factorIds = ["heating-load", "thermostat", "gas-carbon", "grid-carbon", "heat-pump"];
  if (answers.heatSource === "unknown") factorIds.unshift("unknown-heat");
  return {
    id: "heating",
    habitIds: ["homeSize", "heatSource", "heatingHabit"],
    category: "home",
    title: "Heating the home",
    carbon,
    water: 0,
    energy: site,
    waterKind: "none",
    energyKind: "site",
    factorIds,
    steps: [
      answers.heatSource === "unknown"
        ? "I don't know, so this uses a gas furnace. That is the default here, and natural gas is the most common main heating fuel in US homes."
        : `${sourceLabel} is the system doing most of the winter work.`,
      `${homeLabel(answers.homeSize)} assumed heating need: ${plainNumber(load, 0)} kWh a year.`,
      thermostatStep(load, answers.heatingHabit, heatNeed),
      source === "heatPump"
        ? `${sourceLabel}, assumed COP ${assumptions.heatPumpCop}: ${plainNumber(heatNeed, 0)} ÷ ${assumptions.heatPumpCop} = ${plainNumber(site, 0)} kWh of electricity.`
        : `${sourceLabel} meets that need with ${plainNumber(site, 0)} kWh on site.`,
      carbonStep,
      "No water total. Tap water is not in this version, and these sources do not include water used to produce the fuel.",
    ],
  };
}

function clothesLine(answers: Answers): ImpactLine {
  const items = answers.clothesPerSeason * assumptions.seasonsPerYear;
  const carbon = items * garmentKgCo2e;
  const water = items * garmentLiters;
  const energy = carbon / dieselKgPerKwh;
  return {
    id: "clothes",
    habitIds: ["clothesPerSeason"],
    category: "stuff",
    title: "New clothes",
    carbon,
    water,
    energy,
    waterKind: "virtual",
    energyKind: "derived",
    factorIds: ["garment-carbon", "garment-mass", "garment-water", "garment-energy", "diesel-energy"],
    steps: [
      `${plainNumber(answers.clothesPerSeason, 0)} new items a season × ${assumptions.seasonsPerYear} seasons = ${plainNumber(items, 0)} items a year.`,
      `Each item is assumed to weigh ${plainNumber(assumptions.garmentKg, 1)} kg, half cotton and half polyester fiber.`,
      `${plainNumber(items, 0)} × ${plainNumber(garmentKgCo2e, 1)} kg CO2e of fiber = ${plainNumber(carbon, 0)} kg CO2e.`,
      `${plainNumber(items, 0)} × ${plainNumber(garmentLiters, 0)} L of fiber water = ${plainNumber(water, 0)} L of virtual water.`,
      `Energy is not published beside that fiber carbon. ${plainNumber(carbon, 0)} kg CO2e ÷ ${plainNumber(dieselKgPerKwh, 3)} kg CO2 per kWh of diesel ≈ ${plainNumber(energy, 0)} kWh. That translation is rough.`,
    ],
  };
}

function ordersLine(answers: Answers): ImpactLine {
  const orders = answers.ordersPerMonth * assumptions.monthsPerYear;
  const carbon = orders * published.parcelKgCo2e;
  const energy = carbon / dieselKgPerKwh;
  return {
    id: "orders",
    habitIds: ["ordersPerMonth"],
    category: "stuff",
    title: "Online orders",
    carbon,
    water: 0,
    energy,
    waterKind: "none",
    energyKind: "derived",
    factorIds: ["parcel-carbon", "diesel-energy"],
    steps: [
      `${plainNumber(answers.ordersPerMonth, 0)} orders a month × ${assumptions.monthsPerYear} months = ${plainNumber(orders, 0)} orders a year.`,
      `${plainNumber(orders, 0)} × ${plainNumber(published.parcelKgCo2e, 3)} kg CO2e to deliver a parcel = ${plainNumber(carbon, 0)} kg CO2e.`,
      "The thing inside the box is not included. Packaging water is not included.",
      `Energy is translated from that carbon: ${plainNumber(carbon, 0)} kg ÷ ${plainNumber(dieselKgPerKwh, 3)} kg CO2 per kWh ≈ ${plainNumber(energy, 0)} kWh. Delivery is not pure diesel, so this is a rough reading.`,
    ],
  };
}

function resolvedHeat(source: HeatSource): Exclude<HeatSource, "unknown"> {
  return source === "unknown" ? "gas" : source;
}

function scaledHeat(load: number, habit: HeatingHabit): number {
  if (habit === "typical") return load;
  const sign = habit === "warmer" ? 1 : -1;
  const percent = assumptions.thermostatDegrees * assumptions.percentPerDegree;
  return (load * (100 + sign * percent)) / 100;
}

function thermostatStep(load: number, habit: HeatingHabit, heatNeed: number): string {
  if (habit === "typical") {
    return "Typical winter setpoint: no change to that load.";
  }
  const direction = habit === "warmer" ? "higher" : "lower";
  const signed = habit === "warmer" ? "+" : "−";
  return `${habit === "warmer" ? "Warmer" : "Cooler"} by about ${assumptions.thermostatDegrees}°F: ${plainNumber(load, 0)} kWh × (1 ${signed} ${assumptions.thermostatDegrees} × ${assumptions.percentPerDegree}%) = ${plainNumber(heatNeed, 0)} kWh of heat (${direction}).`;
}

function homeLabel(size: HomeSize): string {
  if (size === "apartment") return "Apartment";
  if (size === "small") return "Small house";
  return "Larger house";
}
