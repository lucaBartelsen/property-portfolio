// src/lib/calculators/taxCalculator.ts
import { TaxInfo } from '../types';
import { 
  GRUNDFREIBETRAG, 
  INCOME_TAX_ZONES, 
  CHURCH_TAX_RATES, 
  BUNDESLAENDER 
} from '../constants';

/**
 * Berechnet die deutsche Einkommensteuer basierend auf dem aktuellen Steuergesetz (2025)
 * @param income - Zu versteuerndes Einkommen in EUR
 * @param taxStatus - 'single' oder 'married'
 * @returns Berechnete Einkommensteuer in EUR
 */
export function calculateGermanIncomeTax(income: number, taxStatus: 'single' | 'married' = 'single'): number {
  let taxableIncome = income;
  
  // Für Ehepaare wird das Einkommen für die Berechnung halbiert (Splitting)
  if (taxStatus === 'married') {
    taxableIncome = income / 2;
  }
  
  // Steuer initialisieren
  let tax = 0;
  
  // Steuerberechnung nach dem deutschen Steuergesetz
  if (taxableIncome <= GRUNDFREIBETRAG) {
    // a) Bis zum Grundfreibetrag: Steuer = 0
    tax = 0;
  } 
  else if (taxableIncome <= INCOME_TAX_ZONES.zone1End) {
    // b) Erste Progressionszone
    const y = (taxableIncome - GRUNDFREIBETRAG) / 10000;
    tax = (932.3 * y + 1400) * y;
  } 
  else if (taxableIncome <= INCOME_TAX_ZONES.zone2End) {
    // c) Zweite Progressionszone
    const z = (taxableIncome - INCOME_TAX_ZONES.zone1End) / 10000;
    tax = (176.64 * z + 2397) * z + 1015.13;
  } 
  else if (taxableIncome <= INCOME_TAX_ZONES.zone3End) {
    // d) Dritte Zone (42%)
    tax = 0.42 * taxableIncome - 10911.92;
  } 
  else {
    // e) Vierte Zone (45%)
    tax = 0.45 * taxableIncome - 19246.67;
  }
  
  // Für Ehepaare wird die Steuer verdoppelt
  if (taxStatus === 'married') {
    tax = tax * 2;
  }
  
  // Auf volle Euro runden (wie von den Steuerbehörden)
  return Math.round(tax);
}

// Kirchensteuerberechnung anpassen
export function calculateChurchTax(incomeTax: number, hasChurchTax: boolean, churchTaxRate: number, bundeslandCode: string = 'default'): number {
  if (!hasChurchTax) return 0;
  
  // Bestimme den korrekten Kirchensteuersatz basierend auf dem Bundesland
  const rate = CHURCH_TAX_RATES[bundeslandCode as keyof typeof CHURCH_TAX_RATES] || CHURCH_TAX_RATES.default;
  return incomeTax * (rate / 100);
}

/**
 * Berechnet und gibt Steuerinformationen zurück
 * @param formData - Formulardaten für die Steuerberechnung
 * @returns Steuerinformationsobjekt
 */
export function calculateTaxInfo(formData: Partial<TaxInfo>): TaxInfo {
  const annualIncome = formData.annualIncome || 70000;
  const taxStatus = formData.taxStatus || 'single';
  const hasChurchTax = formData.hasChurchTax || false;
  const churchTaxRate = formData.churchTaxRate || 9;
  
  // Einkommensteuer berechnen
  const incomeTax = calculateGermanIncomeTax(annualIncome, taxStatus);
  
  // Steuersatz berechnen
  const taxRate = (incomeTax / annualIncome) * 100;
  
  return {
    annualIncome,
    taxStatus,
    hasChurchTax,
    churchTaxRate,
    taxRate: parseFloat(taxRate.toFixed(1))
  };
}