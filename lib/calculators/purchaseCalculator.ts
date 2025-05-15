// src/lib/calculators/purchaseCalculator.ts
import { Property, PurchaseData } from '../types';
import { BUNDESLAENDER } from '../constants';
import { calculateTotalCost } from '../utils/calculations';

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
  
  // Kaufpreisaufteilung
  const landValue = ensureValidNumber(defaults.landValue, 0, purchasePrice, purchasePrice * 0.15);
  const buildingValue = ensureValidNumber(defaults.buildingValue, 0, purchasePrice, purchasePrice * 0.8);
  const furnitureValue = ensureValidNumber(defaults.furnitureValue, 0, purchasePrice, purchasePrice * 0.05);
  const maintenanceCost = ensureValidNumber(defaults.maintenanceCost, 0, purchasePrice, 35000);
  
  // Berechne Summe von Gebäude- und Grundstückswert
  const immobileValue = landValue + buildingValue + maintenanceCost;
  
  // Prozentsätze berechnen
  const landValuePercentage = landValue > 0 ? (landValue / purchasePrice) * 100 : 15;
  const buildingValuePercentage = buildingValue > 0 ? (buildingValue / purchasePrice) * 100 : 80;
  
  // WICHTIGE ÄNDERUNG: Grunderwerbsteuer nur auf Gebäude + Grundstück berechnen
  const grunderwerbsteuerBase = immobileValue + maintenanceCost;
  const grunderwerbsteuer = Math.round(grunderwerbsteuerBase * (grunderwerbsteuerRate / 100));
  
  // Notar- und Maklerkosten auf Gesamtkaufpreis
  const notaryCosts = Math.round(purchasePrice * (notaryRate / 100));
  const brokerFee = Math.round(purchasePrice * (brokerRate / 100));
  
  // Gesamte Nebenkosten
  const totalCost = calculateTotalCost(defaults.purchasePrice, defaults.bundesland, defaults.notaryRate, defaults.brokerRate, defaults.furnitureValue);
  const totalExtra = totalCost - purchasePrice;
  
  // Nebenkosten auf Grundstück und Gebäude aufteilen
  // Wenn Maklerkosten als Beratung zählen, diese von den Anschaffungskosten ausschließen
  const relevantExtra = brokerAsConsulting ? (grunderwerbsteuer + notaryCosts) : totalExtra;
  
  // Aufteilung der Grunderwerbsteuer zwischen Grundstück und Gebäude
  // basierend auf ihrem Wertanteil am Immobilienwert
  let landExtraCosts = immobileValue > 0 
    ? (landValue / immobileValue) * grunderwerbsteuer + (landValue / purchasePrice) * notaryCosts 
    : 0;
  
  let buildingExtraCosts = immobileValue > 0 
    ? (buildingValue / immobileValue) * grunderwerbsteuer + (buildingValue / purchasePrice) * notaryCosts 
    : 0;
  
  // Broker-Kosten werden gemäß der Einstellung verteilt
  if (!brokerAsConsulting) {
    // Wenn Maklerkosten nicht als Beratung gelten, werden sie zu den Anschaffungskosten addiert
    const landBrokerCosts = landValue > 0 ? (landValue / purchasePrice) * brokerFee : 0;
    const buildingBrokerCosts = buildingValue > 0 ? (buildingValue / purchasePrice) * brokerFee : 0;
    
    // Hinzufügen der Maklerkosten zu den jeweiligen Nebenkosten
    landExtraCosts += landBrokerCosts;
    buildingExtraCosts += buildingBrokerCosts;
  }
  
  // Gesamtwerte inkl. Nebenkosten
  const totalLandValue = landValue + landExtraCosts;
  const totalBuildingValue = buildingValue + buildingExtraCosts;
  
  // Im ersten Jahr absetzbare Kosten
  const firstYearDeductibleCosts = brokerAsConsulting ? brokerFee : 0;
  
  // Erhaltungsaufwand und Verteilung
  const maintenanceDistribution = ensureValidNumber(defaults.maintenanceDistribution, 1, 5, 1);
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