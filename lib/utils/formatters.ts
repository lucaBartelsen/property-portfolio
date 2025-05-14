// src/lib/utils/formatters.ts

/**
 * Sichere Umwandlung in eine Zahl
 * @param value - Der zu konvertierende Wert
 * @param defaultValue - Standardwert, falls die Konvertierung fehlschlägt
 * @returns Die konvertierte Zahl oder den Standardwert
 */
export function safeNumber(value: any, defaultValue: number = 0): number {
  // Wenn der Wert bereits eine Zahl ist, verwende ihn
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  
  // Wenn der Wert ein String ist, versuche ihn zu konvertieren
  if (typeof value === 'string') {
    // Wandle deutsche Zahlenformate (Komma als Dezimaltrennzeichen) um
    const normalized = value.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(normalized);
    if (!isNaN(num) && isFinite(num)) {
      return num;
    }
  }
  
  // Für alle anderen Fälle gib den Standardwert zurück
  return defaultValue;
}

/**
 * Formatiert einen Wert als Währung (Euro)
 * @param value - Der zu formatierende Wert
 * @returns Formatierter Währungsstring
 */
export function formatCurrency(value: number | string): string {
  // Sicherstellen, dass wir es mit einer Zahl zu tun haben
  const num = safeNumber(value);

  // Werte über einer Milliarde auf eine Million begrenzen, um UI-Probleme zu vermeiden
  const cappedValue = Math.max(Math.min(num, 1000000000), -1000000000);
  
  try {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(cappedValue);
  } catch (error) {
    // Fallback, falls die Formatierung fehlschlägt
    return cappedValue.toFixed(2).replace('.', ',') + ' €';
  }
}

/**
 * Formatiert einen Wert als Prozentsatz
 * @param value - Der zu formatierende Wert (z.B. 42 für 42%)
 * @returns Formatierter Prozentsatz-String
 */
export function formatPercentage(value: number | string): string {
  // Sicherstellen, dass wir es mit einer Zahl zu tun haben
  const num = safeNumber(value);
  
  // Extrem große/kleine Werte begrenzen
  const cappedValue = Math.max(Math.min(num, 10000), -10000);

  try {
    return new Intl.NumberFormat('de-DE', { 
      style: 'percent', 
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(cappedValue / 100);
  } catch (error) {
    // Fallback, falls die Formatierung fehlschlägt
    return (cappedValue).toFixed(2).replace('.', ',') + ' %';
  }
}

export function ensureValidNumber(value: number | null | undefined, min: number = -1e9, max: number = 1e9, defaultValue: number = 0): number {
  if (value === null || value === undefined || typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, value));
}