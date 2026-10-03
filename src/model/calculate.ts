import {
  assumptions,
  chickenPorkKgCo2ePerKg,
  chickenPorkLitersPerKg,
  chickenPorkMjPerKg,
  dieselKgPerKwh,
  flightKgPerPassengerMile,
  garmentKgCo2e,
  garmentLiters,
  gasKgPerKwh,
  gridKgPerKwh,
  jetKwhPerGallon,
  mjToKwh,
  published,
  vehicleKwhPerMile,
  waterHeatKwhPerGallon,
} from "../data/factors";
import { dietCategories, resolvedDiet } from "../data/diet";
import { classifyHome, homeLabel } from "../data/home";
import { easeValue, habitsIn, resolvedNumber } from "../data/habits";
import type {
  Answers,
  Category,
  DietCategory,
  Footprint,
  HabitId,
  HeatSource,
  HomeSize,
  ImpactLine,
  Impacts,
} from "./types";
import { categories } from "./types";
import { addImpacts, emptyImpacts, plainNumber } from "./format";

const portion = assumptions.meatPortionKg;

export function calculate(answers: Answers): Footprint {
  const lines = [
    dietLine(answers),
    foodWasteLine(answers),
    drivingLine(answers),
    flightLine(answers),
    heatingLine(answers),
    showerLine(answers),
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
  let habitId: HabitId = "dietShare";
  let habitSaved = -Infinity;

  for (const area of categories) {
    const group = habitsIn(area.id);
    if (group.length === 0) continue;
    let scenario = baseline;
    let areaHabit: HabitId = group[0].id;
    let areaHabitSaved = -Infinity;
    for (const habit of group) {
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
      habitId: line?.habitIds[0] ?? "dietShare",
      categorySaved: 0,
      habitSaved: 0,
    };
  }

  return { category, habitId, categorySaved, habitSaved };
}

function dietLine(answers: Answers): ImpactLine {
  const share = resolvedDiet(answers.dietShare);
  const meals = assumptions.typicalDietMealsPerWeek * assumptions.weeksPerYear;
  const kgYear = meals * portion;
  let carbon = 0;
  let water = 0;
  let energy = 0;
  const mixSteps: string[] = [];
  for (const category of dietCategories) {
    const kg = kgYear * (share[category.id] / 100);
    const factors = dietFactors[category.id];
    const sliceCarbon = kg * factors.kgCo2e;
    const sliceWater = kg * factors.liters;
    const sliceEnergy =
      factors.mj === null ? sliceCarbon / dieselKgPerKwh : kg * factors.mj * mjToKwh;
    carbon += sliceCarbon;
    water += sliceWater;
    energy += sliceEnergy;
    if (share[category.id] > 0) {
      mixSteps.push(
        `${plainNumber(share[category.id], 0)}% ${category.label}: ${plainNumber(kg, 1)} kg × ${plainNumber(factors.kgCo2e, 2)} kg CO2e per kg = ${plainNumber(sliceCarbon, 0)} kg CO2e.`,
      );
    }
  }
  return {
    id: "diet",
    habitIds: ["dietShare"],
    category: "food",
    title: "Your diet",
    carbon,
    water,
    energy,
    waterKind: "virtual",
    energyKind: "embodied",
    factorIds: [
      "diet-mix",
      "plant-carbon",
      "poultry-carbon",
      "pork-carbon",
      "fish-carbon",
      "beef-carbon",
      "plant-water",
      "poultry-water",
      "pork-water",
      "fish-water",
      "beef-water",
      "portion",
    ],
    steps: [
      `${plainNumber(assumptions.typicalDietMealsPerWeek, 0)} meals a week × ${assumptions.weeksPerYear} weeks = ${plainNumber(meals, 0)} meals a year. Each meal counts ${plainNumber(portion * 1000, 0)} g, so ${plainNumber(kgYear, 1)} kg of food is split by your percentages.`,
      ...mixSteps,
      `Together: ${plainNumber(carbon, 0)} kg CO2e, ${plainNumber(water, 0)} L of virtual water, and ${plainNumber(energy, 0)} kWh of farm or derived energy.`,
      "Chicken/pork uses the average of poultry and pig meat. Plant and fish energy is translated from carbon using diesel, because those foods do not have a farm-energy figure in this model.",
    ],
  };
}

function foodWasteLine(answers: Answers): ImpactLine {
  const eaten = impactsOf(dietLine(answers));
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
    factorIds: ["food-waste", "diet-mix"],
    steps: [
      `Diet above, before waste: ${plainNumber(eaten.carbon, 0)} kg CO2e, ${plainNumber(eaten.water, 0)} L, ${plainNumber(eaten.energy, 0)} kWh.`,
      `${label} thrown out means about ${plainNumber(extra * 100, 0)}% more of that food is produced than eaten.`,
      `${plainNumber(eaten.carbon, 0)} kg × ${plainNumber(extra, 2)} = ${plainNumber(carbon, 0)} kg CO2e from food that is wasted.`,
      `The same share applies to virtual water and farm energy.`,
    ],
  };
}

function drivingLine(answers: Answers): ImpactLine {
  const weekly = resolvedNumber(answers.milesPerWeek, assumptions.typicalMilesPerWeek);
  const miles = weekly * assumptions.weeksPerYear;
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
      weekly === 0
        ? "No miles, so this row is zero."
        : answers.milesPerWeek === null
          ? `Miles were left blank, so this uses the typical ${plainNumber(assumptions.typicalMilesPerWeek, 0)} miles a week × ${assumptions.weeksPerYear} weeks = ${plainNumber(miles, 0)} miles a year.`
          : `${plainNumber(weekly, 0)} miles a week × ${assumptions.weeksPerYear} weeks = ${plainNumber(miles, 0)} miles a year.`,
      `${plainNumber(miles, 0)} miles × ${plainNumber(published.vehicleKgCo2ePerMile, 3)} kg CO2e per mile = ${plainNumber(carbon, 0)} kg CO2e.`,
      `${plainNumber(miles, 0)} miles × ${plainNumber(vehicleKwhPerMile, 2)} kWh of gasoline per mile = ${plainNumber(energy, 0)} kWh.`,
      "Water for refining fuel is not included.",
    ],
  };
}

function flightLine(answers: Answers): ImpactLine {
  const trips = resolvedNumber(answers.flightsPerYear, assumptions.typicalFlightsPerYear);
  const miles = trips * assumptions.domesticRoundTripMiles;
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
      answers.flightsPerYear === null
        ? `Flights were left blank, so this uses the typical ${plainNumber(assumptions.typicalFlightsPerYear, 0)} round trips × ${plainNumber(assumptions.domesticRoundTripMiles, 0)} passenger-miles = ${plainNumber(miles, 0)} passenger-miles.`
        : `${plainNumber(trips, 0)} round trips × ${plainNumber(assumptions.domesticRoundTripMiles, 0)} passenger-miles = ${plainNumber(miles, 0)} passenger-miles.`,
      `That distance is the app's typical US domestic round trip: 1,000 miles each way.`,
      `${plainNumber(miles, 0)} passenger-miles × ${plainNumber(flightKgPerPassengerMile, 3)} kg CO2e per passenger-mile = ${plainNumber(carbon, 0)} kg CO2e.`,
      `Fuel from the CO2 portion: ${plainNumber(miles * published.flightKgCo2PerPassengerMile, 0)} kg CO2 ÷ ${published.jetKgCo2PerGallon} kg per gallon = ${plainNumber(gallons, 0)} gallons.`,
      `${plainNumber(gallons, 0)} gallons × ${plainNumber(jetKwhPerGallon, 1)} kWh per gallon = ${plainNumber(energy, 0)} kWh of jet fuel.`,
      "Contrails are not in this number. Water is not included.",
    ],
  };
}

function heatingLine(answers: Answers): ImpactLine {
  const size = categorizeHome(answers.homeType);
  const envelope = resolvedInsulation(answers.insulationFactor);
  const load = assumptions.heatingLoadKwh[size] * envelope;
  const heatNeed = scaledHeat(load, answers.winterTempF);
  const source = resolvedHeat(answers.heatSource);
  const site = source === "heatPump" ? heatNeed / assumptions.heatPumpCop : heatNeed;
  const carbon = source === "gas" ? heatNeed * gasKgPerKwh : site * gridKgPerKwh;
  const sourceLabel =
    source === "gas" ? "Gas furnace" : source === "resistance" ? "Electric resistance" : "Heat pump";
  const carbonStep =
    source === "gas"
      ? `${plainNumber(heatNeed, 0)} kWh of gas × ${plainNumber(gasKgPerKwh, 3)} kg CO2e per kWh = ${plainNumber(carbon, 0)} kg CO2e.`
      : `${plainNumber(site, 0)} kWh of electricity × ${plainNumber(gridKgPerKwh, 3)} kg CO2e per kWh = ${plainNumber(carbon, 0)} kg CO2e.`;
  const factorIds = ["heating-load", "insulation-saving", "thermostat", "gas-carbon", "grid-carbon", "heat-pump"];
  if (answers.heatSource === "unknown") factorIds.unshift("unknown-heat");
  return {
    id: "heating",
    habitIds: ["homeType", "winterTempF"],
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
      `${homeAssumptionStep(answers.homeType, size, assumptions.heatingLoadKwh[size])}`,
      envelope < 1
        ? `Air sealing and insulation: ${plainNumber(assumptions.heatingLoadKwh[size], 0)} kWh × ${plainNumber(envelope, 2)} = ${plainNumber(load, 0)} kWh after a ${plainNumber(assumptions.insulationHeatingShare * 100, 0)}% heating cut.`
        : "No extra insulation step is applied to that load yet.",
      thermostatStep(load, answers.winterTempF, heatNeed),
      source === "heatPump"
        ? `${sourceLabel}, assumed COP ${assumptions.heatPumpCop}: ${plainNumber(heatNeed, 0)} ÷ ${assumptions.heatPumpCop} = ${plainNumber(site, 0)} kWh of electricity.`
        : `${sourceLabel} meets that need with ${plainNumber(site, 0)} kWh on site.`,
      carbonStep,
      "No water total. Tap water is not in this version, and these sources do not include water used to produce the fuel.",
    ],
  };
}

function showerLine(answers: Answers): ImpactLine {
  const minutes = resolvedNumber(answers.showerMinutes, assumptions.typicalShowerMinutes);
  const gallons =
    minutes *
    assumptions.showerGallonsPerMinute *
    assumptions.showersPerDay *
    assumptions.daysPerYear;
  const energy = gallons * waterHeatKwhPerGallon;
  const source = resolvedHeat(answers.heatSource);
  const carbon = source === "gas" ? energy * gasKgPerKwh : energy * gridKgPerKwh;
  const sourceLabel = source === "gas" ? "gas" : "electricity";
  const factor = source === "gas" ? gasKgPerKwh : gridKgPerKwh;
  return {
    id: "showers",
    habitIds: [],
    category: "home",
    title: "Hot showers",
    carbon,
    water: 0,
    energy,
    waterKind: "none",
    energyKind: "site",
    factorIds: ["shower-hot-water", source === "gas" ? "gas-carbon" : "grid-carbon"],
    steps: [
      `EPA WaterSense figures: ${plainNumber(minutes, 0)} minutes × ${plainNumber(assumptions.showerGallonsPerMinute, 1)} gallons per minute × ${plainNumber(assumptions.showersPerDay, 2)} showers a day × ${assumptions.daysPerYear} days = ${plainNumber(gallons, 0)} gallons of hot water a year.`,
      minutes < assumptions.typicalShowerMinutes
        ? `That is ${plainNumber(assumptions.typicalShowerMinutes - minutes, 0)} minutes shorter than the typical ${plainNumber(assumptions.typicalShowerMinutes, 0)}-minute shower.`
        : `The typical shower in this model is ${plainNumber(assumptions.typicalShowerMinutes, 0)} minutes. A shorter-shower change cuts two minutes.`,
      `${plainNumber(gallons, 0)} gallons × ${plainNumber(assumptions.waterLbPerGallon, 2)} lb × ${plainNumber(assumptions.waterHeatRiseF, 0)}°F ÷ ${plainNumber(published.btuPerKwh, 0)} Btu/kWh = ${plainNumber(energy, 0)} kWh to heat the water.`,
      `${plainNumber(energy, 0)} kWh of ${sourceLabel} × ${plainNumber(factor, 3)} kg CO2e per kWh = ${plainNumber(carbon, 0)} kg CO2e.`,
      "Tap-water volume is not added to the water total. This is one person's showers, not a whole household.",
    ],
  };
}

function clothesLine(answers: Answers): ImpactLine {
  const perSeason = resolvedNumber(answers.clothesPerSeason, assumptions.typicalClothesPerSeason);
  const items = perSeason * assumptions.seasonsPerYear;
  const secondhand = resolvedShare(answers.secondhandShare);
  const newItems = items * (1 - secondhand);
  const carbon = newItems * garmentKgCo2e;
  const water = newItems * garmentLiters;
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
    factorIds: ["garment-carbon", "garment-mass", "garment-water", "garment-energy", "diesel-energy", "secondhand-clothes"],
    steps: [
      answers.clothesPerSeason === null
        ? `New clothes were left blank, so this uses the typical ${plainNumber(assumptions.typicalClothesPerSeason, 0)} items a season × ${assumptions.seasonsPerYear} seasons = ${plainNumber(items, 0)} items a year.`
        : `${plainNumber(perSeason, 0)} new items a season × ${assumptions.seasonsPerYear} seasons = ${plainNumber(items, 0)} items a year.`,
      `Each item is assumed to weigh ${plainNumber(assumptions.garmentKg, 1)} kg, half cotton and half polyester fiber.`,
      secondhand > 0
        ? `${plainNumber(secondhand * 100, 0)}% of those items are treated as secondhand, so ${plainNumber(newItems, 1)} new items still carry fiber.`
        : "All of those items are counted as new fiber.",
      `${plainNumber(newItems, 1)} × ${plainNumber(garmentKgCo2e, 1)} kg CO2e of fiber = ${plainNumber(carbon, 0)} kg CO2e.`,
      `${plainNumber(newItems, 1)} × ${plainNumber(garmentLiters, 0)} L of fiber water = ${plainNumber(water, 0)} L of virtual water.`,
      `Energy is not published beside that fiber carbon. ${plainNumber(carbon, 0)} kg CO2e ÷ ${plainNumber(dieselKgPerKwh, 3)} kg CO2 per kWh of diesel ≈ ${plainNumber(energy, 0)} kWh. That translation is rough.`,
    ],
  };
}

function ordersLine(answers: Answers): ImpactLine {
  const perMonth = resolvedNumber(answers.ordersPerMonth, assumptions.typicalOrdersPerMonth);
  const orders = perMonth * assumptions.monthsPerYear;
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
      answers.ordersPerMonth === null
        ? `Orders were left blank, so this uses the typical ${plainNumber(assumptions.typicalOrdersPerMonth, 0)} orders a month × ${assumptions.monthsPerYear} months = ${plainNumber(orders, 0)} orders a year.`
        : `${plainNumber(perMonth, 0)} orders a month × ${assumptions.monthsPerYear} months = ${plainNumber(orders, 0)} orders a year.`,
      `${plainNumber(orders, 0)} × ${plainNumber(published.parcelKgCo2e, 3)} kg CO2e to deliver a parcel = ${plainNumber(carbon, 0)} kg CO2e.`,
      "The thing inside the box is not included. Packaging water is not included.",
      `Energy is translated from that carbon: ${plainNumber(carbon, 0)} kg ÷ ${plainNumber(dieselKgPerKwh, 3)} kg CO2 per kWh ≈ ${plainNumber(energy, 0)} kWh. Delivery is not pure diesel, so this is a rough reading.`,
    ],
  };
}

function resolvedHeat(source: HeatSource): Exclude<HeatSource, "unknown"> {
  return source === "unknown" || !source ? "gas" : source;
}

function resolvedInsulation(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function resolvedShare(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function scaledHeat(load: number, tempF: number | null): number {
  const winterF = resolvedNumber(tempF, assumptions.typicalWinterF);
  const delta = winterF - assumptions.typicalWinterF;
  return (load * (100 + delta * assumptions.percentPerDegree)) / 100;
}

function thermostatStep(load: number, tempF: number | null, heatNeed: number): string {
  const winterF = resolvedNumber(tempF, assumptions.typicalWinterF);
  const delta = winterF - assumptions.typicalWinterF;
  if (tempF === null) {
    return `Winter temperature was left blank, so this uses the typical ${plainNumber(assumptions.typicalWinterF, 0)}°F setpoint: no change to that load.`;
  }
  if (Math.abs(delta) < 0.05) {
    return `Typical winter setpoint (${plainNumber(assumptions.typicalWinterF, 0)}°F): no change to that load.`;
  }
  const direction = delta > 0 ? "higher" : "lower";
  const signed = delta > 0 ? "+" : "−";
  return `${plainNumber(winterF, 0)}°F is about ${plainNumber(Math.abs(delta), 1)}°F ${delta > 0 ? "above" : "below"} ${plainNumber(assumptions.typicalWinterF, 0)}°F: ${plainNumber(load, 0)} kWh × (1 ${signed} ${plainNumber(Math.abs(delta), 1)} × ${assumptions.percentPerDegree}%) = ${plainNumber(heatNeed, 0)} kWh of heat (${direction}).`;
}

function homeAssumptionStep(text: string, size: HomeSize, load: number): string {
  const assumed = homeLabel(size);
  const trimmed = text.trim();
  const mappedCustom =
    trimmed !== "" &&
    trimmed.toLowerCase() !== "other" &&
    trimmed.toLowerCase() !== assumed.toLowerCase();
  if (mappedCustom) {
    return `"${trimmed}" is treated as a ${assumed.toLowerCase()}, the closest size this model has a heating load for: ${plainNumber(load, 0)} kWh a year.`;
  }
  return `${assumed} assumed heating need: ${plainNumber(load, 0)} kWh a year.`;
}

export function categorizeHome(text: string): HomeSize {
  return classifyHome(text);
}

const dietFactors: Record<
  DietCategory,
  { kgCo2e: number; liters: number; mj: number | null }
> = {
  plant: {
    kgCo2e: published.plantKgCo2ePerKg,
    liters: published.plantLitersPerKg,
    mj: null,
  },
  chickenPork: {
    kgCo2e: chickenPorkKgCo2ePerKg,
    liters: chickenPorkLitersPerKg,
    mj: chickenPorkMjPerKg,
  },
  fish: {
    kgCo2e: published.fishKgCo2ePerKg,
    liters: published.fishLitersPerKg,
    mj: null,
  },
  beef: {
    kgCo2e: published.beefKgCo2ePerKg,
    liters: published.beefLitersPerKg,
    mj: published.beefMjPerKg,
  },
};
