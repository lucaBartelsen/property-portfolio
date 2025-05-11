// src/lib/calculators/taxCalculator.ts
import { TaxInfo } from '../types';

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
  
  // 2024/2025 Werte
  const grundfreibetrag = 12096; // Grundfreibetrag in EUR
  
  // Steuerzonen-Grenzen
  const zone1EndIncome = 17443;  // Erste Progressionszone
  const zone2EndIncome = 68480;  // Zweite Progressionszone
  const zone3EndIncome = 277825; // Dritte Zone (42%)
  // > 277.825 € (vierte Zone - 45%)
  
  // Einkommensteuerberechnung nach dem deutschen Steuergesetz 2024/2025
  if (taxableIncome <= grundfreibetrag) {
    // a) Bis 12.096 Euro: Steuer = 0
    tax = 0;
  } 
  else if (taxableIncome <= zone1EndIncome) {
    // b) Von 12.097 Euro bis 17.443 Euro
    const y = (taxableIncome - grundfreibetrag) / 10000;
    tax = (932.3 * y + 1400) * y;
  } 
  else if (taxableIncome <= zone2EndIncome) {
    // c) Von 17.444 Euro bis 68.480 Euro
    const z = (taxableIncome - 17443) / 10000;
    tax = (176.64 * z + 2397) * z + 1015.13;
  } 
  else if (taxableIncome <= zone3EndIncome) {
    // d) Von 68.481 Euro bis 277.825 Euro
    tax = 0.42 * taxableIncome - 10911.92;
  } 
  else {
    // e) Ab 277.826 Euro
    tax = 0.45 * taxableIncome - 19246.67;
  }
  
  // Für Ehepaare wird die Steuer verdoppelt
  if (taxStatus === 'married') {
    tax = tax * 2;
  }
  
  // Auf volle Euro runden (wie von den Steuerbehörden)
  return Math.round(tax);
}

/**
 * Berechnet die Kirchensteuer basierend auf der Einkommensteuer
 * @param incomeTax - Einkommensteuerbetrag in EUR
 * @param hasChurchTax - Ob Kirchensteuer anfällt
 * @param churchTaxRate - Kirchensteuersatz in Prozent
 * @returns Berechnete Kirchensteuer in EUR
 */
export function calculateChurchTax(incomeTax: number, hasChurchTax: boolean, churchTaxRate: number): number {
  if (!hasChurchTax) return 0;
  return incomeTax * (churchTaxRate / 100);
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