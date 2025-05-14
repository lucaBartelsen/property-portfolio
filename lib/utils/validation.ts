// lib/utils/validation.ts (updated)
import { PropertyDefaults, TaxInfo } from '../types';
import { DEFAULT_PROPERTY_VALUES, CHURCH_TAX_RATES } from '../constants';

export class DataValidator {
  // Normalize and validate property defaults
  static normalizePropertyDefaults(defaults: any): PropertyDefaults {
    const defaultValues = DEFAULT_PROPERTY_VALUES;
    
    return {
      purchasePrice: this.ensureValidNumber(defaults.purchasePrice, 0, 1e9, defaultValues.purchasePrice),
      bundesland: defaults.bundesland || defaultValues.bundesland,
      notaryRate: this.ensureValidNumber(defaults.notaryRate, 0, 10, defaultValues.notaryRate),
      brokerRate: this.ensureValidNumber(defaults.brokerRate, 0, 10, defaultValues.brokerRate),
      brokerAsConsulting: defaults.brokerAsConsulting !== undefined ? !!defaults.brokerAsConsulting : defaultValues.brokerAsConsulting,
      depreciationRate: this.ensureValidNumber(defaults.depreciationRate, 0, 10, defaultValues.depreciationRate),
      landValue: this.ensureValidNumber(defaults.landValue, 0, 1e9, defaultValues.landValue),
      buildingValue: this.ensureValidNumber(defaults.buildingValue, 0, 1e9, defaultValues.buildingValue),
      maintenanceCost: this.ensureValidNumber(defaults.maintenanceCost, 0, 1e9, defaultValues.maintenanceCost),
      furnitureValue: this.ensureValidNumber(defaults.furnitureValue, 0, 1e9, defaultValues.furnitureValue),
      maintenanceDistribution: this.ensureValidNumber(defaults.maintenanceDistribution, 1, 5, defaultValues.maintenanceDistribution),
      financingType: defaults.financingType === 'cash' ? 'cash' : defaultValues.financingType,
      
      // Eigenkapital
      downPayment: this.ensureValidNumber(defaults.downPayment, 0, 1e9, defaultValues.downPayment),
      
      // Backwards compatibility and extended financing
      loanAmount: this.ensureValidNumber(defaults.loanAmount1 || defaults.loanAmount, 0, 1e9, defaultValues.loanAmount),
      interestRate: this.ensureValidNumber(defaults.interestRate1 || defaults.interestRate, 0, 20, defaultValues.interestRate),
      repaymentRate: this.ensureValidNumber(defaults.repaymentRate1 || defaults.repaymentRate, 0, 20, defaultValues.repaymentRate),
      
      loanAmount1: this.ensureValidNumber(defaults.loanAmount1 || defaults.loanAmount, 0, 1e9, defaultValues.loanAmount1 || defaultValues.loanAmount),
      interestRate1: this.ensureValidNumber(defaults.interestRate1 || defaults.interestRate, 0, 20, defaultValues.interestRate1 || defaultValues.interestRate),
      repaymentRate1: this.ensureValidNumber(defaults.repaymentRate1 || defaults.repaymentRate, 0, 20, defaultValues.repaymentRate1 || defaultValues.repaymentRate),
      
      useSecondLoan: defaults.useSecondLoan !== undefined ? !!defaults.useSecondLoan : defaultValues.useSecondLoan,
      loanAmount2: defaults.useSecondLoan ? this.ensureValidNumber(defaults.loanAmount2, 0, 1e9, defaultValues.loanAmount2) : 0,
      interestRate2: defaults.useSecondLoan ? this.ensureValidNumber(defaults.interestRate2, 0, 20, defaultValues.interestRate2) : 0,
      repaymentRate2: defaults.useSecondLoan ? this.ensureValidNumber(defaults.repaymentRate2, 0, 20, defaultValues.repaymentRate2) : 0,
      
      monthlyRent: this.ensureValidNumber(defaults.monthlyRent, 0, 1e6, defaultValues.monthlyRent),
      vacancyRate: this.ensureValidNumber(defaults.vacancyRate, 0, 100, defaultValues.vacancyRate),
      propertyTax: this.ensureValidNumber(defaults.propertyTax, 0, 1e6, defaultValues.propertyTax),
      managementFee: this.ensureValidNumber(defaults.managementFee, 0, 1e6, defaultValues.managementFee),
      maintenanceReserve: this.ensureValidNumber(defaults.maintenanceReserve, 0, 1e6, defaultValues.maintenanceReserve),
      insurance: this.ensureValidNumber(defaults.insurance, 0, 1e6, defaultValues.insurance),
      appreciationRate: this.ensureValidNumber(defaults.appreciationRate, 0, 20, defaultValues.appreciationRate),
      rentIncreaseRate: this.ensureValidNumber(defaults.rentIncreaseRate, 0, 20, defaultValues.rentIncreaseRate)
    };
  }

  // Validate tax info
  static normalizeTaxInfo(taxInfo: any): TaxInfo | null {
    if (!taxInfo) return null;
    
    return {
      annualIncome: this.ensureValidNumber(taxInfo.annualIncome, 0, 1e9, 70000),
      taxStatus: taxInfo.taxStatus === 'married' ? 'married' : 'single',
      hasChurchTax: !!taxInfo.hasChurchTax,
      churchTaxRate: this.ensureValidNumber(taxInfo.churchTaxRate, 0, 15, CHURCH_TAX_RATES.default),
      taxRate: this.ensureValidNumber(taxInfo.taxRate, 0, 100, 42)
    };
  }

  // Ensure a number is within valid ranges
  static ensureValidNumber(value: any, min: number = -1e9, max: number = 1e9, defaultValue: number = 0): number {
    if (value === undefined || value === null) return defaultValue;
    
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(num) || !isFinite(num)) return defaultValue;
    
    return Math.max(min, Math.min(max, num));
  }
}