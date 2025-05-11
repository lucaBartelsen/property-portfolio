// src/lib/calculators/purchaseCalculator.ts
import { Property, PurchaseData } from '../types';

/**
 * Berechnet die Kaufkosten für eine Immobilie
 * @param property - Die Immobilie, für die die Kaufkosten berechnet werden sollen
 * @returns Die berechneten Kaufdaten
 */
export function calculatePurchase(property: Property): PurchaseData {
  const { defaults } = property;
  
  const purchasePrice = defaults.purchasePrice;
  const grunderwerbsteuerRate = parseFloat(defaults.bundesland);
  const notaryRate = defaults.notaryRate;
  const brokerRate = defaults.brokerRate;
  const brokerAsConsulting = defaults.brokerAsConsulting;
  
  // Kaufkosten berechnen
  const grunderwerbsteuer = purchasePrice * (grunderwerbsteuerRate / 100);
  const notaryCosts = purchasePrice * (notaryRate / 100);
  const brokerFee = purchasePrice * (brokerRate / 100);
  const totalExtra = grunderwerbsteuer + notaryCosts + brokerFee;
  const totalCost = purchasePrice + totalExtra;
  
  // Kaufpreisaufteilung
  const landValue = defaults.landValue;
  const buildingValue = defaults.buildingValue;
  const maintenanceCost = defaults.maintenanceCost;
  const furnitureValue = defaults.furnitureValue;
  const maintenanceDistribution = defaults.maintenanceDistribution;
  
  // Prozentsätze berechnen
  const landValuePercentage = (landValue / purchasePrice) * 100;
  const buildingValuePercentage = (buildingValue / purchasePrice) * 100;
  
  // Nebenkosten auf Grundstück und Gebäude aufteilen
  // Wenn Maklerkosten als Beratung zählen, diese von den Anschaffungskosten ausschließen
  const relevantExtra = brokerAsConsulting ? (grunderwerbsteuer + notaryCosts) : totalExtra;
  const landExtraCosts = relevantExtra * (landValue / purchasePrice);
  const buildingExtraCosts = relevantExtra * (buildingValue / purchasePrice);
  
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