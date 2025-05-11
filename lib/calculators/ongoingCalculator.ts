// src/lib/calculators/ongoingCalculator.ts
import { Property, OngoingData } from '../types';

/**
 * Berechnet die laufenden Kosten für eine Immobilie
 * @param property - Die Immobilie, für die die laufenden Kosten berechnet werden sollen
 * @returns Die berechneten laufenden Kosten
 */
export function calculateOngoing(property: Property): OngoingData {
  const { defaults } = property;
  
  const monthlyRent = defaults.monthlyRent;
  const vacancyRate = defaults.vacancyRate;
  const propertyTax = defaults.propertyTax;
  const managementFee = defaults.managementFee;
  const maintenanceReserve = defaults.maintenanceReserve;
  const insurance = defaults.insurance;
  
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