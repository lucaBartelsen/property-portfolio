// src/lib/utils/formatters.ts

/**
 * Formatiert einen Wert als Währung (Euro)
 * @param value - Der zu formatierende Wert
 * @returns Formatierter Währungsstring
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(value);
}

/**
 * Formatiert einen Wert als Prozentsatz
 * @param value - Der zu formatierende Wert (z.B. 42 für 42%)
 * @returns Formatierter Prozentsatz-String
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('de-DE', { 
    style: 'percent', 
    minimumFractionDigits: 2 
  }).format(value / 100);
}