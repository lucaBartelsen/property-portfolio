// src/lib/calculators/purchaseCalculator.ts
import { Property, PurchaseData } from '../types';
import { BUNDESLAENDER } from '../constants';

/**
 * Sicherstellt, dass ein Wert eine gültige Zahl ist mit Minimum/Maximum-Grenzen
 */
function ensureValidNumber(value: number | null | undefined, min: number = -1e9, max: number = 1e9, defaultValue: number = 0): number {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Berechnet die Kaufkosten für eine Immobilie
 * @param property - Die Immobilie, für die die Kaufkosten berechnet werden sollen
 * @returns Die berechneten Kaufdaten
 */
export function calculatePurchase(property: Property): PurchaseData {
  const { defaults } = property;
  
  // Sichere Konvertierung der Eingabedaten
  const purchasePrice = ensureValidNumber(defaults.purchasePrice, 0, 1e9, 316500);
  const selectedBundesland = BUNDESLAENDER.find(land => land.code === defaults.bundesland) || BUNDESLAENDER[0];
  const grunderwerbsteuerRate = ensureValidNumber(selectedBundesland.taxRate, 0, 10, 3.5);
  const notaryRate = ensureValidNumber(defaults.notaryRate, 0, 10, 1.5);
  const brokerRate = ensureValidNumber(defaults.brokerRate, 0, 10, 3.0);
  const brokerAsConsulting = defaults.brokerAsConsulting;
  
  // Kaufkosten berechnen
  const grunderwerbsteuer = purchasePrice * (grunderwerbsteuerRate / 100);
  const notaryCosts = purchasePrice * (notaryRate / 100);
  const brokerFee = purchasePrice * (brokerRate / 100);
  const totalExtra = grunderwerbsteuer + notaryCosts + brokerFee;
  const totalCost = purchasePrice + totalExtra;
  
  // Kaufpreisaufteilung
  const landValue = ensureValidNumber(defaults.landValue, 0, purchasePrice, purchasePrice * 0.15);
  const buildingValue = ensureValidNumber(defaults.buildingValue, 0, purchasePrice, purchasePrice * 0.8);
  const maintenanceCost = ensureValidNumber(defaults.maintenanceCost, 0, purchasePrice, 35000);
  const furnitureValue = ensureValidNumber(defaults.furnitureValue, 0, purchasePrice, purchasePrice * 0.05);
  const maintenanceDistribution = ensureValidNumber(defaults.maintenanceDistribution, 1, 5, 1);
  
  // Prozentsätze berechnen
  const landValuePercentage = landValue > 0 ? (landValue / purchasePrice) * 100 : 15;
  const buildingValuePercentage = buildingValue > 0 ? (buildingValue / purchasePrice) * 100 : 80;
  
  // Nebenkosten auf Grundstück und Gebäude aufteilen
  // Wenn Maklerkosten als Beratung zählen, diese von den Anschaffungskosten ausschließen
  const relevantExtra = brokerAsConsulting ? (grunderwerbsteuer + notaryCosts) : totalExtra;
  const landExtraCosts = landValue > 0 
    ? relevantExtra * (landValue / purchasePrice) 
    : relevantExtra * 0.15;
  const buildingExtraCosts = buildingValue > 0 
    ? relevantExtra * (buildingValue / purchasePrice) 
    : relevantExtra * 0.8;
  
  // Gesamtwerte inkl. Nebenkosten
  const totalLandValue = landValue + landExtraCosts;
  const totalBuildingValue = buildingValue + buildingExtraCosts;
  
  // Im ersten Jahr absetzbare Kosten
  const firstYearDeductibleCosts = brokerAsConsulting ? brokerFee : 0;
  
  // Jährlicher Erhaltungsaufwand
  const annualMaintenance = maintenanceCost / maintenanceDistribution;
  
  return {
    purchasePrice,
    grunderwerbsteuer,
    notaryCosts,
    brokerFee,
    brokerAsConsulting,
    firstYearDeductibleCosts,
    totalExtra,
    totalCost,
    landValue,
    buildingValue,
    landExtraCosts,
    buildingExtraCosts,
    totalLandValue,
    totalBuildingValue,
    maintenanceCost,
    furnitureValue,
    annualMaintenance,
    maintenanceDistribution,
    landValuePercentage,
    buildingValuePercentage
  };
}