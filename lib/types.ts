// src/lib/types.ts


// Property-Typ
export interface Property {
  id: string;
  name: string;
  purchaseData: PurchaseData | null;
  ongoingData: OngoingData | null;
  calculationResults: CalculationResults | null;
  yearlyData: YearlyData[] | null;
  defaults: PropertyDefaults;
  portfolio?: Portfolio;
}

// Property-Standardwerte
export interface PropertyDefaults {
  purchasePrice: number;
  bundesland: string;
  notaryRate: number;
  brokerRate: number;
  brokerAsConsulting: boolean;
  depreciationRate: number;
  landValue: number;
  buildingValue: number;
  maintenanceCost: number;
  furnitureValue: number;
  maintenanceDistribution: number;
  financingType: 'loan' | 'cash';
  
  // Eigenkapital
  downPayment: number;
  
  // Ursprüngliche Finanzierungsfelder (für Abwärtskompatibilität)
  loanAmount?: number;
  interestRate?: number;
  repaymentRate?: number;
  
  // Neue Finanzierungsfelder - Darlehen 1
  loanAmount1?: number;
  interestRate1?: number;
  repaymentRate1?: number;
  
  // Zweites Darlehen
  useSecondLoan?: boolean;
  loanAmount2?: number;
  interestRate2?: number;
  repaymentRate2?: number;
  
  // Rest unverändert
  monthlyRent: number;
  vacancyRate: number;
  propertyTax: number;
  managementFee: number;
  maintenanceReserve: number;
  insurance: number;
  appreciationRate: number;
  rentIncreaseRate: number;
}

// Kaufdaten
export interface PurchaseData {
  purchasePrice: number;
  grunderwerbsteuer: number;
  notaryCosts: number;
  brokerFee: number;
  brokerAsConsulting: boolean;
  firstYearDeductibleCosts: number;
  totalExtra: number;
  totalCost: number;
  landValue: number;
  buildingValue: number;
  landExtraCosts: number;
  buildingExtraCosts: number;
  totalLandValue: number;
  totalBuildingValue: number;
  maintenanceCost: number;
  furnitureValue: number;
  annualMaintenance: number;
  maintenanceDistribution: number;
  landValuePercentage: number;
  buildingValuePercentage: number;
}

// Laufende Daten
export interface OngoingData {
  monthlyRent: number;
  annualRent: number;
  vacancyRate: number;
  effectiveRent: number;
  propertyTax: number;
  managementFee: number;
  maintenanceCost: number;
  insurance: number;
  totalOngoing: number;
}

// Berechnungsergebnisse
export interface CalculationResults {
  totalCost: number;
  downPayment: number;
  loanAmount: number;
  annuity: number;
  monthlyPayment: number;
  monthlyCashflow: number;
  finalPropertyValue: number;
  remainingLoan: number;
  finalEquity: number;
  initialEquity: number;
}

// Jährliche Daten
export interface YearlyData {
  year: number;
  rent: number;
  ongoingCosts: number;
  interest: number;
  principal: number;
  payment: number;
  loanBalance: number;
  buildingDepreciation: number;
  furnitureDepreciation: number;
  maintenanceDeduction: number;
  totalDepreciation: number;
  taxableIncome: number;
  firstYearDeductibleCosts: number;
  previousIncome: number;
  previousTax: number;
  previousChurchTax: number;
  newTotalIncome: number;
  newTax: number;
  newChurchTax: number;
  taxSavings: number;
  cashflow: number;
  cashflowBeforeTax: number;
  propertyValue: number;
  equity: number;
  initialEquity: number;
  vacancyRate: number;
  propertyTax: number;
  managementFee: number;
  maintenanceReserve: number;
  insurance: number;
  cashflowBeforeFinancing: number;
}

// Steuerdaten

export interface TaxInfo {
  id?: string;
  customerId?: string;
  annualIncome: number;
  taxStatus: 'single' | 'married';  // Using string literal type
  hasChurchTax: boolean;
  churchTaxRate: number;
  taxRate: number;
}

// Gesamtdaten
export interface AppState {
  taxInfo: TaxInfo;
  properties: Property[];
  activePropertyIndex: number;
  combinedResults: {
    calculationResults: CalculationResults;
    yearlyData: YearlyData[];
  } | null;
}

export interface Portfolio {
  id: string;
  name: string;
  customerId: string;
  customerName?: string; // Making this optional since you add it later
  createdAt?: string;
  updatedAt?: string;
}