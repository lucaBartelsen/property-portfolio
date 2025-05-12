// src/lib/calculators/ongoingCalculator.ts
import { Property, OngoingData } from '../types';

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
 * Berechnet die laufenden Kosten für eine Immobilie
 * @param property - Die Immobilie, für die die laufenden Kosten berechnet werden sollen
 * @returns Die berechneten laufenden Kosten
 */
export function calculateOngoing(property: Property): OngoingData {
  const { defaults } = property;
  
  // Sichere Konvertierung der Eingabedaten
  const monthlyRent = ensureValidNumber(defaults.monthlyRent, 0, 1e6, 1200);
  const vacancyRate = ensureValidNumber(defaults.vacancyRate, 0, 100, 3);
  const propertyTax = ensureValidNumber(defaults.propertyTax, 0, 1e6, 500);
  const managementFee = ensureValidNumber(defaults.managementFee, 0, 1e6, 600);
  const maintenanceReserve = ensureValidNumber(defaults.maintenanceReserve, 0, 1e6, 600);
  const insurance = ensureValidNumber(defaults.insurance, 0, 1e6, 300);
  
  // Jährliche Werte berechnen
  const annualRent = monthlyRent * 12;
  const effectiveRent = annualRent * (1 - vacancyRate / 100);
  const totalOngoing = propertyTax + managementFee + maintenanceReserve + insurance;
  
  return {
    monthlyRent,
    annualRent,
    vacancyRate,
    effectiveRent,
    propertyTax,
    managementFee,
    maintenanceCost: maintenanceReserve,
    insurance,
    totalOngoing
  };
}