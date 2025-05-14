// src/lib/constants.ts

// Typ-Definition für ein Bundesland
export interface Bundesland {
  code: string;
  name: string;
  taxRate: number;
}

// Liste aller Bundesländer mit Grunderwerbsteuersätzen
export const BUNDESLAENDER: Bundesland[] = [
  { code: "BW", name: "Baden-Württemberg", taxRate: 3.5 },
  { code: "BY", name: "Bayern", taxRate: 3.5 },
  { code: "BE", name: "Berlin", taxRate: 6.0 },
  { code: "BB", name: "Brandenburg", taxRate: 6.5 },
  { code: "HB", name: "Bremen", taxRate: 5.0 },
  { code: "HH", name: "Hamburg", taxRate: 4.5 },
  { code: "HE", name: "Hessen", taxRate: 6.0 },
  { code: "MV", name: "Mecklenburg-Vorpommern", taxRate: 5.0 },
  { code: "NI", name: "Niedersachsen", taxRate: 5.0 },
  { code: "NW", name: "Nordrhein-Westfalen", taxRate: 6.5 },
  { code: "RP", name: "Rheinland-Pfalz", taxRate: 5.0 },
  { code: "SL", name: "Saarland", taxRate: 6.5 },
  { code: "SN", name: "Sachsen", taxRate: 3.5 },
  { code: "ST", name: "Sachsen-Anhalt", taxRate: 5.0 },
  { code: "SH", name: "Schleswig-Holstein", taxRate: 6.5 },
  { code: "TH", name: "Thüringen", taxRate: 6.5 },
];

// Standardeinstellungen für neue Immobilien
export const DEFAULT_PROPERTY_VALUES = {
  purchasePrice: 316500,
  bundesland: "BY",
  notaryRate: 1.5,
  brokerRate: 3.0,
  brokerAsConsulting: false,
  depreciationRate: 2.0,
  landValue: 45000,
  buildingValue: 220000,
  maintenanceCost: 35000,
  furnitureValue: 16500,
  maintenanceDistribution: 1,
  financingType: 'loan' as const,
  
  // Eigenkapital
  downPayment: 25000,
  
  // Ursprüngliche Finanzierungsfelder (für Abwärtskompatibilität)
  loanAmount: 291500, // purchasePrice - downPayment
  interestRate: 4.0,
  repaymentRate: 1.5,
  
  // Neue Finanzierungsfelder - Darlehen 1
  loanAmount1: 316500, // purchasePrice - downPayment
  interestRate1: 4.0,
  repaymentRate1: 1.5,
  
  // Zweites Darlehen
  useSecondLoan: false,
  loanAmount2: 0,
  interestRate2: 0,
  repaymentRate2: 0,
  
  // Rest unverändert
  monthlyRent: 1200,
  vacancyRate: 3.0,
  propertyTax: 500,
  managementFee: 600,
  maintenanceReserve: 600,
  insurance: 300,
  appreciationRate: 2.0,
  rentIncreaseRate: 3
};

// Kirchensteuersätze nach Bundesland
export const CHURCH_TAX_RATES = {
  "BW": 8, // Baden-Württemberg
  "BY": 8, // Bayern
  "default": 9 // Alle anderen Bundesländer
};

// Steuerliche Abschreibungssätze
export const DEPRECIATION_RATES = {
  buildings: 0.02, // 2% p.a. für Gebäude
  furniture: 0.10  // 10% p.a. für Möbel
};

// Verteilung des Erhaltungsaufwands (Jahre)
export const MAINTENANCE_DISTRIBUTION_OPTIONS = [
  { value: "1", label: "Im 1. Jahr voll absetzen" },
  { value: "2", label: "Auf 2 Jahre verteilen" },
  { value: "3", label: "Auf 3 Jahre verteilen" },
  { value: "4", label: "Auf 4 Jahre verteilen" },
  { value: "5", label: "Auf 5 Jahre verteilen" },
];

// Grundfreibetrag für Einkommensteuer
export const GRUNDFREIBETRAG = 12096; // 2024/2025

// Einkommensteuer-Zonen (2024/2025)
export const INCOME_TAX_ZONES = {
  zone1End: 17443,  // Erste Progressionszone
  zone2End: 68480,  // Zweite Progressionszone
  zone3End: 277825  // Dritte Zone (42%)
  // > 277.825 € (vierte Zone - 45%)
};