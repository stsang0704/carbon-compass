import type { Factor } from "../model/types";

/** Published inputs and the few assumptions required to turn them into a year. */
export const published = {
  beefKgCo2ePerKg: 99.48,
  poultryKgCo2ePerKg: 9.87,
  porkKgCo2ePerKg: 12.31,
  fishKgCo2ePerKg: 13.63,
  plantKgCo2ePerKg: 0.53,
  beefLitersPerKg: 15400,
  poultryLitersPerKg: 4300,
  porkLitersPerKg: 6000,
  fishLitersPerKg: 1974,
  plantLitersPerKg: 322,
  beefMjPerKg: 43,
  poultryMjPerKg: 22,
  porkMjPerKg: 31.5,
  vehicleKgCo2ePerMile: 0.393,
  gasolineKgCo2PerGallon: 8.89,
  vehicleKgCo2ePerYear: 4290,
  urbanTreeKgCo2ePerYear: 60,
  vehicleMpg: 22.8,
  gasolineBtuPerGallon: 114000,
  btuPerKwh: 3412,
  egridLbCo2ePerMwh: 770.9,
  lbPerKg: 2.2046226218,
  gasKgCo2PerMmbtu: 53.06,
  gasCh4GramsPerMmbtu: 1,
  gasN2oGramsPerMmbtu: 0.1,
  gwpCh4: 28,
  gwpN2o: 265,
  btuPerMmbtu: 1_000_000,
  flightKgCo2PerPassengerMile: 0.129,
  flightCh4GramsPerPassengerMile: 0.0006,
  flightN2oGramsPerPassengerMile: 0.0041,
  jetKgCo2PerGallon: 9.75,
  jetBtuPerGallon: 135000,
  cottonKgCo2ePerKgFibre: 28,
  polyesterKgCo2ePerKgFibre: 21,
  cottonLitersPerKgFibre: 3100,
  polyesterLitersPerKgFibre: 80,
  dieselKgCo2PerGallon: 10.21,
  dieselBtuPerGallon: 137381,
  parcelKgCo2e: 1.075,
} as const;

export const assumptions = {
  meatPortionKg: 0.1,
  meatSharePoultry: 0.5,
  meatSharePork: 0.3,
  meatShareBeef: 0.2,
  weeksPerYear: 52,
  monthsPerYear: 12,
  seasonsPerYear: 4,
  domesticRoundTripMiles: 2000,
  heatPumpCop: 2.8,
  thermostatDegrees: 3,
  percentPerDegree: 3,
  typicalDietMealsPerWeek: 21,
  typicalMilesPerWeek: 100,
  typicalFlightsPerYear: 2,
  typicalClothesPerSeason: 6,
  typicalOrdersPerMonth: 4,
  typicalWinterF: 66,
  minWinterF: 50,
  garmentKg: 0.4,
  daysPerYear: 365,
  typicalShowerMinutes: 8,
  shorterShowerMinutes: 6,
  showerGallonsPerMinute: 2.1,
  showersPerDay: 0.67,
  waterLbPerGallon: 8.34,
  waterHeatRiseF: 70,
  insulationHeatingShare: 0.15,
  secondhandShare: 0.5,
  heatingLoadKwh: {
    apartment: 4500,
    small: 11000,
    larger: 18000,
  },
  wasteExtra: {
    rarely: 0.05,
    sometimes: 0.15,
    often: 0.3,
  },
} as const;

export const mixedMeatKgCo2ePerKg =
  assumptions.meatSharePoultry * published.poultryKgCo2ePerKg +
  assumptions.meatSharePork * published.porkKgCo2ePerKg +
  assumptions.meatShareBeef * published.beefKgCo2ePerKg;

export const mixedMeatLitersPerKg =
  assumptions.meatSharePoultry * published.poultryLitersPerKg +
  assumptions.meatSharePork * published.porkLitersPerKg +
  assumptions.meatShareBeef * published.beefLitersPerKg;

export const mixedMeatMjPerKg =
  assumptions.meatSharePoultry * published.poultryMjPerKg +
  assumptions.meatSharePork * published.porkMjPerKg +
  assumptions.meatShareBeef * published.beefMjPerKg;

export const chickenPorkKgCo2ePerKg =
  (published.poultryKgCo2ePerKg + published.porkKgCo2ePerKg) / 2;

export const chickenPorkLitersPerKg =
  (published.poultryLitersPerKg + published.porkLitersPerKg) / 2;

export const chickenPorkMjPerKg = (published.poultryMjPerKg + published.porkMjPerKg) / 2;

export const gridKgPerKwh =
  published.egridLbCo2ePerMwh / published.lbPerKg / 1000;

export const gasKgCo2ePerMmbtu =
  published.gasKgCo2PerMmbtu +
  (published.gasCh4GramsPerMmbtu / 1000) * published.gwpCh4 +
  (published.gasN2oGramsPerMmbtu / 1000) * published.gwpN2o;

export const gasKgPerKwh =
  (gasKgCo2ePerMmbtu * published.btuPerKwh) / published.btuPerMmbtu;

export const flightKgPerPassengerMile =
  published.flightKgCo2PerPassengerMile +
  (published.flightCh4GramsPerPassengerMile / 1000) * published.gwpCh4 +
  (published.flightN2oGramsPerPassengerMile / 1000) * published.gwpN2o;

export const gasolineKwhPerGallon =
  published.gasolineBtuPerGallon / published.btuPerKwh;

export const vehicleKwhPerMile = gasolineKwhPerGallon / published.vehicleMpg;

export const jetKwhPerGallon = published.jetBtuPerGallon / published.btuPerKwh;

export const dieselKwhPerGallon =
  published.dieselBtuPerGallon / published.btuPerKwh;

export const dieselKgPerKwh =
  published.dieselKgCo2PerGallon / dieselKwhPerGallon;

export const garmentKgCo2e =
  assumptions.garmentKg *
  ((published.cottonKgCo2ePerKgFibre + published.polyesterKgCo2ePerKgFibre) / 2);

export const garmentLiters =
  assumptions.garmentKg *
  ((published.cottonLitersPerKgFibre + published.polyesterLitersPerKgFibre) / 2);

/** kWh to raise one gallon of water by the assumed hot-water rise. */
export const waterHeatKwhPerGallon =
  (assumptions.waterLbPerGallon * assumptions.waterHeatRiseF) / published.btuPerKwh;

export const mjToKwh = 1 / 3.6;

const epaEquivalencies =
  "https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator-calculations-and-references";
const epaHub = "https://www.epa.gov/climateleadership/ghg-emission-factors-hub";
const egrid = "https://www.epa.gov/egrid/summary-data";
const poore = "https://ourworldindata.org/grapher/ghg-per-kg-poore";
const water =
  "https://www.waterfootprint.org/resources/Mekonnen-Hoekstra-2012-WaterFootprintFarmAnimalProducts_1.pdf";
const cropWater =
  "https://waterfootprint.org/resources/Reports/Report47-WaterFootprintCrops-Vol1.pdf";
const fishWater = "https://doi.org/10.1016/j.scitotenv.2015.07.045";
const wrap =
  "https://www.wrap.ngo/sites/default/files/2021-01/WRAP-valuing-our-clothes-2012-07-11.pdf";
const usda = "https://www.usda.gov/foodlossandwaste";
const oliverWyman =
  "https://www.oliverwyman.com/our-expertise/insights/2023/may/delivery-decarbonization-pathway.html";
const deVries =
  "https://iffs.earth/articles/comparing-environmental-impacts-for-livestock-products-a-review-of-life-cycle-assessments/";

export const factors: Record<string, Factor> = {
  "beef-carbon": {
    id: "beef-carbon",
    name: "Beef herd greenhouse gases",
    valueLabel: "99.48 kg CO2e per kg of beef",
    source: "Poore and Nemecek, Science, global mean via Our World in Data",
    year: "2018",
    url: poore,
    region: "Global average",
    includes:
      "Farm, land-use change, processing, transport, and packaging in the study's global mean for beef from beef herds.",
    excludes:
      "Lamb is lower, about 40 kg CO2e per kg. Meals that are mostly lamb are overstated here. Sides, drinks, and cooking at home are not included.",
    confidence: "medium",
  },
  "poultry-carbon": {
    id: "poultry-carbon",
    name: "Poultry greenhouse gases",
    valueLabel: "9.87 kg CO2e per kg of poultry",
    source: "Poore and Nemecek, Science, global mean via Our World in Data",
    year: "2018",
    url: poore,
    region: "Global average",
    includes: "The same supply-chain boundary as the beef figure, for poultry meat.",
    excludes:
      "Pork is a little higher, about 12 kg CO2e per kg. Sides, drinks, and cooking at home are not included.",
    confidence: "medium",
  },
  "beef-water": {
    id: "beef-water",
    name: "Beef virtual water",
    valueLabel: "15,400 liters per kg of beef",
    source: "Mekonnen and Hoekstra, Water Footprint Network",
    year: "2012",
    url: water,
    region: "Global average",
    includes:
      "Green, blue, and grey water for beef cattle. Most of it is rain on feed crops, not water from a tap.",
    excludes: "It is not the water you pour while cooking.",
    confidence: "medium",
  },
  "poultry-water": {
    id: "poultry-water",
    name: "Chicken virtual water",
    valueLabel: "4,300 liters per kg of chicken",
    source: "Mekonnen and Hoekstra, Water Footprint Network",
    year: "2012",
    url: water,
    region: "Global average",
    includes: "Green, blue, and grey water for chicken meat.",
    excludes: "Cooking water is not included. Pork is higher than chicken.",
    confidence: "medium",
  },
  "beef-energy": {
    id: "beef-energy",
    name: "Beef farm energy",
    valueLabel: "43 MJ per kg, the midpoint of 34–52 MJ",
    source: "de Vries and de Boer, review of livestock life-cycle studies",
    year: "2010",
    url: deVries,
    region: "Range across published studies",
    includes: "On-farm energy reported for beef in that review, converted here from megajoules to kilowatt-hours.",
    excludes:
      "It is not the full supply chain, and it is not electricity at your stove. The midpoint is a summary of a range.",
    confidence: "low",
  },
  "poultry-energy": {
    id: "poultry-energy",
    name: "Chicken farm energy",
    valueLabel: "22 MJ per kg, the midpoint of 15–29 MJ",
    source: "de Vries and de Boer, review of livestock life-cycle studies",
    year: "2010",
    url: deVries,
    region: "Range across published studies",
    includes: "On-farm energy reported for chicken, converted from megajoules to kilowatt-hours.",
    excludes: "Not the full supply chain, and not your kitchen.",
    confidence: "low",
  },
  "pork-carbon": {
    id: "pork-carbon",
    name: "Pork greenhouse gases",
    valueLabel: "12.31 kg CO2e per kg of pig meat",
    source: "Poore and Nemecek, Science, global mean via Our World in Data",
    year: "2018",
    url: poore,
    region: "Global average",
    includes: "The same supply-chain boundary as the beef figure, for pig meat.",
    excludes: "Sides, drinks, and cooking at home are not included.",
    confidence: "medium",
  },
  "pork-water": {
    id: "pork-water",
    name: "Pork virtual water",
    valueLabel: "6,000 liters per kg of pig meat",
    source: "Mekonnen and Hoekstra, Water Footprint Network",
    year: "2012",
    url: water,
    region: "Global average",
    includes: "Green, blue, and grey water for pig meat.",
    excludes: "Cooking water is not included.",
    confidence: "medium",
  },
  "pork-energy": {
    id: "pork-energy",
    name: "Pork farm energy",
    valueLabel: "31.5 MJ per kg, the midpoint of 18–45 MJ",
    source: "de Vries and de Boer, review of livestock life-cycle studies",
    year: "2010",
    url: deVries,
    region: "Range across published studies",
    includes: "On-farm energy reported for pork in that review, converted here from megajoules to kilowatt-hours.",
    excludes: "Not the full supply chain, and not your kitchen.",
    confidence: "low",
  },
  "plant-carbon": {
    id: "plant-carbon",
    name: "Vegetables and plant-based foods",
    valueLabel: "0.53 kg CO2e per kg of other vegetables",
    source: "Poore and Nemecek, Science, global mean via Our World in Data",
    year: "2018",
    url: poore,
    region: "Global average",
    includes:
      "The study's global mean for other vegetables. This stands in for vegetables and plant-based foods on the plate.",
    excludes:
      "Tofu is higher, about 3.16 kg CO2e per kg. A tofu-heavy week is understated. Fruit, grains, dairy, and cooking at home are not modeled separately.",
    confidence: "medium",
  },
  "plant-water": {
    id: "plant-water",
    name: "Vegetable virtual water",
    valueLabel: "322 liters per kg of vegetables",
    source: "Mekonnen and Hoekstra, The green, blue and grey water footprint of crops",
    year: "2011",
    url: cropWater,
    region: "Global average",
    includes: "Green, blue, and grey water for vegetables as a crop group.",
    excludes: "It is not the water you pour while cooking.",
    confidence: "medium",
  },
  "fish-carbon": {
    id: "fish-carbon",
    name: "Farmed fish greenhouse gases",
    valueLabel: "13.63 kg CO2e per kg of farmed fish",
    source: "Poore and Nemecek, Science, global mean via Our World in Data",
    year: "2018",
    url: poore,
    region: "Global average",
    includes: "The study's global mean for farmed fish, with the same supply-chain boundary as the meat figures.",
    excludes:
      "Wild-caught fish can be lower. Farmed prawns are higher, about 27 kg CO2e per kg. A prawn-heavy week is understated.",
    confidence: "medium",
  },
  "fish-water": {
    id: "fish-water",
    name: "Farmed fish virtual water",
    valueLabel: "1,974 liters per kg of farmed fish",
    source: "Pahlow, van Oel, Mekonnen and Hoekstra, Science of the Total Environment",
    year: "2015",
    url: fishWater,
    region: "Global average for fed aquaculture",
    includes: "The water footprint of feed crops for farmed fish, as reported for marine animal products.",
    excludes: "Wild-caught fish are not in this number. Cooking water is not included.",
    confidence: "low",
  },
  "diet-mix": {
    id: "diet-mix",
    name: "Diet as four shares of the plate",
    valueLabel: "21 meals a week, 100 g each, split by the percentages you entered",
    source: "Carbon Compass method, using Poore and Nemecek greenhouse gases for each food group",
    year: "2026",
    url: poore,
    region: "Your mix, with global average factors",
    includes:
      "The four percentages always stand in for 100% of the modeled diet. Each share is 21 meals a week × 100 g × 52 weeks × that percentage, then multiplied by that food's published factor. Vegetables use other vegetables (0.53 kg CO2e/kg). Chicken/pork is the average of poultry (9.87) and pig meat (12.31). Fish uses farmed fish (13.63). Beef uses beef from beef herds (99.48).",
    excludes:
      "Drinks, dairy as its own group, cooking at home, and restaurant meals as a separate system are not included. The 21 meals and 100 g portion are an assumption so a week can use per-kilogram factors.",
    confidence: "medium",
  },
  "mixed-meat": {
    id: "mixed-meat",
    name: "A meal with meat, type unknown",
    valueLabel: "Half poultry, 30% pork, 20% beef or lamb",
    source: "Poore and Nemecek greenhouse gases, Mekonnen and Hoekstra water, de Vries and de Boer energy",
    year: "2018",
    url: poore,
    region: "Global averages, mixed with a US-style share of meats",
    includes:
      "Each meal is 100 g of meat. The mix stands in for a meal that contains meat without saying which kind. Poultry is about half, pork about 30%, and beef or lamb about 20%.",
    excludes:
      "A steak is higher than this mix. A chicken meal is lower. Sides, drinks, and cooking at home are not included.",
    confidence: "medium",
  },
  "portion": {
    id: "portion",
    name: "Food on the plate",
    valueLabel: "100 grams of food per meal",
    source: "Carbon Compass assumption, so a meal can use a per-kilogram factor",
    year: "2026",
    url: poore,
    region: "Assumption",
    includes: "A fixed portion so weekly meals become kilograms, then split by the diet percentages.",
    excludes: "A large steak is more than this. A salad plate can be more volume and less mass.",
    confidence: "low",
  },
  "food-waste": {
    id: "food-waste",
    name: "Food thrown out at home",
    valueLabel: "Rarely 5%, sometimes 15%, often 30% extra food produced",
    source: "USDA food loss and waste scale, mapped onto three household answers",
    year: "2026",
    url: usda,
    region: "United States, simplified",
    includes:
      "USDA discusses roughly 30–40% of the US food supply lost or wasted. The three answers are a household scale inspired by that range.",
    excludes:
      "Only the diet modeled above is scaled. The percentages are not a measurement of your kitchen.",
    confidence: "low",
  },
  "vehicle-carbon": {
    id: "vehicle-carbon",
    name: "Gasoline car or light truck",
    valueLabel: "0.393 kg CO2e per mile",
    source: "US EPA Greenhouse Gas Equivalencies Calculator",
    year: "2024",
    url: epaEquivalencies,
    region: "United States average",
    includes:
      "Fuel burned by an average gasoline car and light truck, at 22.8 miles per gallon, including methane and nitrous oxide.",
    excludes: "Building the car, the road, and most of the work of refining the fuel.",
    confidence: "high",
  },
  "driving-equivalent": {
    id: "driving-equivalent",
    name: "A carbon saving as miles of driving avoided",
    valueLabel: "kg CO2e saved ÷ 0.393 kg CO2e per mile",
    source: "US EPA Greenhouse Gas Equivalencies Calculator, gasoline car and light truck factor",
    year: "2024",
    url: epaEquivalencies,
    region: "United States average",
    includes:
      "The same 0.393 kg CO2e per mile used for driving in this app, so a carbon reduction can be pictured as an equivalent distance not driven in a typical gasoline passenger vehicle. Used when the saving is smaller than one urban tree.",
    excludes:
      "This is an emissions equivalence, not a claim that you skipped that drive. Building the car, the road, and electric vehicles are not in this translation.",
    confidence: "high",
  },
  "vehicle-year": {
    id: "vehicle-year",
    name: "A typical gasoline car over one year",
    valueLabel: "4.29 metric tons CO2e per gasoline passenger vehicle per year (4,290 kg)",
    source: "US EPA Greenhouse Gas Equivalencies Calculator, gasoline-powered passenger vehicles per year",
    year: "2024",
    url: epaEquivalencies,
    region: "United States average",
    includes:
      "10,917 miles a year at 22.8 miles per gallon, with methane and nitrous oxide included so the total is CO2e. Used only to picture a year of carbon as a number of cars.",
    excludes:
      "Electric vehicles, building the car, and the road. This is a comparison for the year you entered, not extra cars added to the model.",
    confidence: "high",
  },
  "gasoline-equivalent": {
    id: "gasoline-equivalent",
    name: "A year of carbon as gallons of gasoline",
    valueLabel: "8.89 kg CO2 per gallon of gasoline (8.89 × 10⁻³ metric tons)",
    source: "US EPA Greenhouse Gas Equivalencies Calculator, gallons of gasoline consumed",
    year: "2024",
    url: epaEquivalencies,
    region: "United States factor",
    includes:
      "Carbon dioxide from burning one gallon of motor gasoline. Your year of CO2e is divided by this factor so it can be pictured as gallons burned.",
    excludes:
      "This is an emissions equivalence, not a claim that you burned that gasoline. Methane, nitrous oxide, making the fuel, and electric vehicles are not in this gallon factor.",
    confidence: "high",
  },
  "urban-tree": {
    id: "urban-tree",
    name: "Carbon an urban tree takes up in a year",
    valueLabel: "0.060 metric tons CO2 per urban tree per year (60 kg)",
    source: "US EPA Greenhouse Gas Equivalencies Calculator, urban tree seedlings grown for 10 years",
    year: "2024",
    url: epaEquivalencies,
    region: "United States urban average",
    includes:
      "A probability-weighted average for a medium-growth coniferous or deciduous tree planted in an urban setting, expressed as an annual rate over ten years of growth.",
    excludes:
      "A wild forest, a specific species, or a carbon offset you can buy. This is a comparison so a reduction can be pictured as trees, not extra trees planted in the model.",
    confidence: "medium",
  },
  "vehicle-energy": {
    id: "vehicle-energy",
    name: "Energy in a gallon of gasoline",
    valueLabel: "114,000 Btu per gallon, at 22.8 miles per gallon",
    source: "US EPA gasoline gallon equivalent, with the equivalencies calculator's fuel economy",
    year: "2024",
    url: epaEquivalencies,
    region: "United States average",
    includes: "Chemical energy in the gasoline burned each mile.",
    excludes: "This is not electricity, and it is not the energy used to manufacture the car.",
    confidence: "high",
  },
  "flight-carbon": {
    id: "flight-carbon",
    name: "Medium-haul flight",
    valueLabel: "0.129 kg CO2 per passenger-mile, plus a little methane and nitrous oxide",
    source: "US EPA GHG Emission Factors Hub, medium haul (300 to 2,300 miles)",
    year: "2024",
    url: epaHub,
    region: "United States factors",
    includes:
      "Aircraft fuel greenhouse gases per passenger-mile. Methane and nitrous oxide use IPCC AR5 factors (28 and 265) so they can sit in the CO2e total.",
    excludes:
      "Extra warming from contrails and high-altitude effects. Those can be large and are not in this EPA table.",
    confidence: "high",
  },
  "flight-distance": {
    id: "flight-distance",
    name: "A domestic round trip",
    valueLabel: "1,000 miles each way, 2,000 passenger-miles",
    source: "Carbon Compass definition of a typical US domestic round trip",
    year: "2026",
    url: epaHub,
    region: "Assumption",
    includes: "One distance so a count of trips can use the per-mile factor. It falls in the EPA medium-haul band.",
    excludes: "A short hop is less. A coast-to-coast or overseas trip is more, and overseas trips are long haul.",
    confidence: "medium",
  },
  "flight-energy": {
    id: "flight-energy",
    name: "Jet fuel energy",
    valueLabel: "9.75 kg CO2 per gallon of jet fuel, 135,000 Btu per gallon",
    source: "US EPA GHG Emission Factors Hub and the EIA heat content of jet fuel",
    year: "2024",
    url: epaHub,
    region: "United States factors",
    includes: "Gallons implied by the CO2 per passenger-mile, turned into kilowatt-hours of fuel.",
    excludes: "Contrails, and the energy used to build the plane.",
    confidence: "medium",
  },
  "grid-carbon": {
    id: "grid-carbon",
    name: "US electricity",
    valueLabel: "770.9 lb CO2e per megawatt-hour",
    source: "US EPA eGRID2023, US total output emission rate",
    year: "2023",
    url: egrid,
    region: "United States average",
    includes: "Carbon dioxide, methane, and nitrous oxide from electricity generated for the US grid, as CO2e.",
    excludes:
      "Your regional grid may be cleaner or dirtier. Rhode Island is not the US average. Making the power plant itself is outside eGRID's output rate.",
    confidence: "high",
  },
  "gas-carbon": {
    id: "gas-carbon",
    name: "Natural gas burned at home",
    valueLabel: "53.06 kg CO2 per million Btu, plus 1.0 g methane and 0.10 g nitrous oxide",
    source: "US EPA GHG Emission Factors Hub, natural gas combustion",
    year: "2024",
    url: epaHub,
    region: "United States factors",
    includes:
      "Carbon dioxide from burning natural gas, with methane and nitrous oxide converted using IPCC AR5 factors (28 and 265).",
    excludes: "Leaks of unburned gas on the way to the house, which can matter and are not in this combustion factor.",
    confidence: "high",
  },
  "heating-load": {
    id: "heating-load",
    name: "Heat a home of this size needs",
    valueLabel: "Apartment 4,500 kWh, small house 11,000 kWh, larger house 18,000 kWh per year",
    source: "Carbon Compass assumed loads, so home size has a scale",
    year: "2026",
    url: egrid,
    region: "Assumption for a US-style winter",
    includes: "A round annual heating need for three sizes, treated as energy that must be met.",
    excludes: "Your bill, climate, and furnace efficiency. These are not meter readings. A later insulation step can reduce this load.",
    confidence: "low",
  },
  "thermostat": {
    id: "thermostat",
    name: "Degrees on the thermostat",
    valueLabel: "3% of heating energy per degree Fahrenheit, for a 3 degree shift",
    source: "A stated rule of thumb at the high end of the common 1–3% range",
    year: "2026",
    url: "https://www.energy.gov/energysaver/thermostats",
    region: "Rule of thumb",
    includes:
      "Warmer means about 3°F above a typical winter setpoint. Cooler means about 3°F below. Each degree changes heating energy by 3%.",
    excludes: "Setbacks only at night, heat pumps in mild weather, and homes that barely heat. The percentage is a rule of thumb, not a simulation.",
    confidence: "low",
  },
  "unknown-heat": {
    id: "unknown-heat",
    name: "Heating when you don't know the system",
    valueLabel: "Counted as a gas furnace",
    source: "US Energy Information Administration, Residential Energy Consumption Survey",
    year: "2020",
    url: "https://www.eia.gov/consumption/residential/",
    region: "United States",
    includes:
      "Natural gas is the most common main heating fuel in US homes, so I don't know uses the same gas-furnace math as an explicit gas answer.",
    excludes: "It is not a blend of gas, electric resistance, and heat pumps. If your home is electric, this overstates the fuel burned on site.",
    confidence: "medium",
  },
  "heat-pump": {
    id: "heat-pump",
    name: "Heat pump efficiency",
    valueLabel: "2.8 units of heat per unit of electricity",
    source: "Carbon Compass assumed seasonal performance",
    year: "2026",
    url: "https://www.energy.gov/energysaver/heat-pump-systems",
    region: "Assumption",
    includes: "A single coefficient of performance so a heat pump can be compared with a furnace and with electric resistance.",
    excludes: "Cold-climate performance, backup heat, and the particular model. Real seasonal numbers vary.",
    confidence: "low",
  },
  "garment-carbon": {
    id: "garment-carbon",
    name: "Fiber in a new garment",
    valueLabel: "Cotton 28 kg CO2e per kg of fiber, polyester 21 kg",
    source: "WRAP, Valuing Our Clothes, footprint per tonne of fiber",
    year: "2012",
    url: wrap,
    region: "United Kingdom fiber averages, used as a global stand-in",
    includes: "Fiber production only, averaged half cotton and half polyester.",
    excludes:
      "Spinning, dyeing, sewing, shipping, washing, and disposal. Those add more. A coat is heavier than a shirt.",
    confidence: "low",
  },
  "garment-mass": {
    id: "garment-mass",
    name: "Weight of a typical new item",
    valueLabel: "400 grams, between a shirt and a pair of trousers",
    source: "Carbon Compass assumption",
    year: "2026",
    url: wrap,
    region: "Assumption",
    includes: "One weight so a count of new items can use the per-kilogram fiber factors.",
    excludes: "Shoes, coats, and jewelry. Four seasons are assumed, so a seasonal count becomes a year.",
    confidence: "low",
  },
  "garment-water": {
    id: "garment-water",
    name: "Water in fiber",
    valueLabel: "Cotton 3,100 liters per kg, polyester 80 liters per kg",
    source: "WRAP, Valuing Our Clothes, water per tonne of fiber",
    year: "2012",
    url: wrap,
    region: "United Kingdom fiber averages",
    includes: "Mostly agricultural water for cotton. Polyester's figure is much smaller.",
    excludes: "Dyehouse water and washing at home.",
    confidence: "low",
  },
  "garment-energy": {
    id: "garment-energy",
    name: "Fiber carbon, read as energy",
    valueLabel: "Fiber carbon divided by the diesel carbon intensity below",
    source: "Derived from the WRAP fiber carbon figure",
    year: "2012",
    url: wrap,
    region: "Translation, not a measured energy total",
    includes:
      "A rough kilowatt-hour reading of the fiber carbon, so clothing can sit beside home electricity. It uses the diesel factor as a fossil stand-in.",
    excludes: "WRAP did not publish this as kilowatt-hours. Treat it as the weakest kind of energy number.",
    confidence: "low",
  },
  "parcel-carbon": {
    id: "parcel-carbon",
    name: "Getting a parcel to the door",
    valueLabel: "1.075 kg CO2e for a 1 kg parcel",
    source: "Oliver Wyman, delivery through a typical postal system",
    year: "2023",
    url: oliverWyman,
    region: "Average of the country postal systems in that study",
    includes: "Linehaul, buildings, and last-mile delivery for the parcel itself.",
    excludes:
      "The product inside the box. A US route can differ from the study average. Packaging water is not included.",
    confidence: "medium",
  },
  "shower-hot-water": {
    id: "shower-hot-water",
    name: "Hot water for a typical shower",
    valueLabel: "8 minutes, 2.1 gallons per minute, 0.67 showers a day",
    source: "US EPA WaterSense showerhead materials and supporting statement",
    year: "2017",
    url: "https://www.epa.gov/watersense/showerheads",
    region: "United States average",
    includes:
      "A typical person's shower length and how often they shower, at the 2.1 gpm average flow EPA uses in its consumer water-and-energy note. Water is heated 70°F, 8.34 lb per gallon, using the same gas or electricity factor as the home's heat. Shorter showers in this app are 6 minutes.",
    excludes:
      "A household of several people, a different showerhead, or heating the rest of the home's tap water. Tap-water volume is not added to the water total.",
    confidence: "medium",
  },
  "insulation-saving": {
    id: "insulation-saving",
    name: "Air sealing and insulation",
    valueLabel: "15% of the home's heating energy",
    source: "ENERGY STAR / EPA, national average savings from air sealing and adding insulation",
    year: "2024",
    url: "https://www.energystar.gov/saveathome/seal_insulate/methodology",
    region: "United States national average",
    includes:
      "EPA's modeled 15% average reduction in heating and cooling from sealing leaks and adding insulation in attics, floors, and rim joists. This app applies that 15% only to the heating load already in the model.",
    excludes:
      "Cooling, a specific house, and a contractor's audit. Real savings vary by climate and how leaky the house was.",
    confidence: "medium",
  },
  "secondhand-clothes": {
    id: "secondhand-clothes",
    name: "Secondhand instead of new fiber",
    valueLabel: "Half of the year's new items counted as already-made clothes",
    source: "WRAP fiber factors already used for new garments; secondhand avoids growing that fiber again",
    year: "2012",
    url: wrap,
    region: "Assumption on top of the WRAP fiber figures",
    includes:
      "A defined bigger clothing shift: half of the items you still buy new are treated as secondhand, so their fiber carbon, water, and derived energy drop out.",
    excludes:
      "The trip to the shop, cleaning a used garment, and a claim that every other purchase is actually thrifted.",
    confidence: "low",
  },
  "diesel-energy": {
    id: "diesel-energy",
    name: "Diesel as a fossil stand-in",
    valueLabel: "10.21 kg CO2 per gallon, about 137,381 Btu per gallon",
    source: "US EPA GHG Emission Factors Hub and EIA distillate heat content",
    year: "2024",
    url: epaHub,
    region: "United States factors",
    includes: "Used only to translate a carbon figure into rough kilowatt-hours when a source did not publish energy.",
    excludes: "It is not a claim that the parcel or the garment was made entirely from diesel.",
    confidence: "low",
  },
};

export const factorList = Object.values(factors);
