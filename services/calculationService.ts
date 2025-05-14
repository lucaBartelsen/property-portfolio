// services/calculationService.ts
import { Property, TaxInfo, YearlyData, CalculationResults, PurchaseData, OngoingData } from '../lib/types';
import { calculatePurchase } from '../lib/calculators/purchaseCalculator';
import { calculateOngoing } from '../lib/calculators/ongoingCalculator';
import { calculateCashflow } from '../lib/calculators/cashflowCalculator';
import { calculateGermanIncomeTax, calculateChurchTax } from '../lib/calculators/taxCalculator';
import { ensureValidNumber } from '../lib/utils/formatters';
import { calculateTotalCost } from '../lib/utils/calculations';

export class CalculationService {
  /**
   * Calculate all data for a single property
   */
  static calculatePropertyData(property: Property, taxInfo: TaxInfo): {
    purchaseData: PurchaseData;
    ongoingData: OngoingData;
    results: CalculationResults;
    yearlyData: YearlyData[];
  } {
    try {
      // Calculate purchase and ongoing data
      const purchaseData = calculatePurchase(property);
      const ongoingData = calculateOngoing(property);
      
      // Then calculate cashflow with these values
      const { results, yearlyData } = calculateCashflow(
        { ...property, purchaseData, ongoingData },
        taxInfo,
        10 // Standard calculation period
      );
      
      return { purchaseData, ongoingData, results, yearlyData };
    } catch (error) {
      console.error("Error calculating property data:", error);
      
      // Return default values in case of error
      const defaultPurchaseData = property.purchaseData || {} as PurchaseData;
      const defaultOngoingData = property.ongoingData || {} as OngoingData;
      const defaultResults = property.calculationResults || {} as CalculationResults;
      const defaultYearlyData = property.yearlyData || [] as YearlyData[];
      
      return { 
        purchaseData: defaultPurchaseData, 
        ongoingData: defaultOngoingData, 
        results: defaultResults, 
        yearlyData: defaultYearlyData 
      };
    }
  }
  
  /**
   * Calculate combined data for a portfolio of properties
   */
  static calculatePortfolioData(properties: Property[], taxInfo: TaxInfo, calculationPeriod: number = 10): {
    yearlyData: YearlyData[];
    results: CalculationResults;
  } {
    try {
      // Don't proceed if there are no properties
      if (properties.length === 0) {
        return { yearlyData: [], results: {} as CalculationResults };
      }
      
      // Initialize arrays for combined results
      const combinedYearlyData: YearlyData[] = Array(calculationPeriod).fill(0).map((_, index) => {
        // Calculate tax on base income
        const baseIncome = taxInfo.annualIncome;
        const baseTax = calculateGermanIncomeTax(baseIncome, taxInfo.taxStatus);
        const baseChurchTax = taxInfo.hasChurchTax ? 
          calculateChurchTax(baseTax, taxInfo.hasChurchTax, taxInfo.churchTaxRate) : 0;
        
        return {
          year: index + 1,
          rent: 0,
          ongoingCosts: 0,
          interest: 0,
          principal: 0,
          payment: 0,
          loanBalance: 0,
          buildingDepreciation: 0,
          furnitureDepreciation: 0,
          maintenanceDeduction: 0,
          totalDepreciation: 0,
          taxableIncome: 0,
          firstYearDeductibleCosts: 0,
          previousIncome: baseIncome, // Base income without properties
          previousTax: baseTax, // Tax on base income
          previousChurchTax: baseChurchTax, // Church tax on base income
          newTotalIncome: 0,
          newTax: 0,
          newChurchTax: 0,
          taxSavings: 0,
          cashflow: 0,
          cashflowBeforeTax: 0,
          propertyValue: 0,
          equity: 0,
          initialEquity: 0,
          vacancyRate: 0,
          propertyTax: 0,
          managementFee: 0,
          maintenanceReserve: 0,
          insurance: 0,
          cashflowBeforeFinancing: 0
        };
      });
      
      // Combined calculation results
      const combinedResults: CalculationResults = {
        totalCost: 0,
        downPayment: 0,
        loanAmount: 0,
        annuity: 0,
        monthlyPayment: 0,
        monthlyCashflow: 0,
        finalPropertyValue: 0,
        remainingLoan: 0,
        finalEquity: 0,
        initialEquity: 0
      };
      
      // Calculate fresh data for each property and add to combined results
      properties.forEach(propertyItem => {
        // Calculate fresh data for this property
        const propertyData = this.calculatePropertyData(propertyItem, taxInfo);
        
        if (propertyData.results && propertyData.yearlyData) {
          // Add property results to combined results
          combinedResults.totalCost += propertyData.results.totalCost;
          combinedResults.downPayment += propertyData.results.downPayment;
          combinedResults.loanAmount += propertyData.results.loanAmount;
          combinedResults.annuity += propertyData.results.annuity;
          combinedResults.monthlyPayment += propertyData.results.monthlyPayment;
          combinedResults.monthlyCashflow += propertyData.results.monthlyCashflow;
          combinedResults.finalPropertyValue += propertyData.results.finalPropertyValue;
          combinedResults.remainingLoan += propertyData.results.remainingLoan;
          combinedResults.finalEquity += propertyData.results.finalEquity;
          combinedResults.initialEquity += propertyData.results.initialEquity;
          
          // Add this property's yearly data to the combined data
          propertyData.yearlyData.forEach((yearData, index) => {
            if (index < calculationPeriod) {
              const combinedYear = combinedYearlyData[index];
              
              // Skip fields that shouldn't be summed across properties
              const nonSummableFields = [
                'year', 
                'vacancyRate',
                'previousIncome',  // Already set correctly for all years
                'previousTax',     // Already set correctly for all years
                'previousChurchTax', // Already set correctly for all years
                'newTotalIncome',
                'newTax',
                'newChurchTax',
                'taxSavings'
              ];
              
              // Sum all numerical values except the ones we should skip
              Object.keys(yearData).forEach(key => {
                const typedKey = key as keyof YearlyData;
                if (!nonSummableFields.includes(typedKey) && 
                    typeof yearData[typedKey] === 'number') {
                  // Update the combined year data
                  (combinedYear[typedKey] as number) += yearData[typedKey] as number;
                }
              });
            }
          });
        }
      });
      
      // Recalculate tax information for each year
      combinedYearlyData.forEach((yearData, index) => {
        // Base income is already set in previousIncome
        // Property income is in taxableIncome
        
        // Calculate new total income with property income
        const totalIncome = Math.max(0, yearData.previousIncome + yearData.taxableIncome);
        yearData.newTotalIncome = totalIncome;
        
        // Calculate new total tax with combined income
        const newTax = calculateGermanIncomeTax(totalIncome, taxInfo.taxStatus);
        yearData.newTax = newTax;
        
        // Calculate new church tax
        const newChurchTax = taxInfo.hasChurchTax 
          ? calculateChurchTax(newTax, taxInfo.hasChurchTax, taxInfo.churchTaxRate)
          : 0;
        yearData.newChurchTax = newChurchTax;
        
        // Calculate tax savings
        // Tax savings can be negative (additional tax burden)
        yearData.taxSavings = (yearData.previousTax - newTax) + 
                            (yearData.previousChurchTax - newChurchTax);
        
        // Update cashflow after tax
        yearData.cashflow = yearData.cashflowBeforeTax + yearData.taxSavings;
      });
      
      return { yearlyData: combinedYearlyData, results: combinedResults };
    } catch (error) {
      console.error("Error calculating portfolio data:", error);
      return { yearlyData: [], results: {} as CalculationResults };
    }
  }
  
  /**
   * Helper function to ensure a number is valid
   */
  static ensureValidNumber(value: number | null | undefined, min: number = -1e9, max: number = 1e9, defaultValue: number = 0): number {
    return ensureValidNumber(value, min, max, defaultValue);
  }
  
  /**
   * Calculate portfolio statistics for overview page
   */
  static calculatePortfolioStats(properties: Property[]) {
    if (!properties || properties.length === 0) {
      return {
        totalValue: 0,
        totalEquity: 0,
        totalDebt: 0,
        avgCashflow: 0,
        avgROI: 0,
        propertyCount: 0,
        cashflowPositive: 0,
        cashflowNegative: 0
      };
    }
    
    const stats = {
      totalValue: 0,
      totalEquity: 0,
      totalDebt: 0,
      avgCashflow: 0,
      avgROI: 0,
      propertyCount: properties.length,
      cashflowPositive: 0,
      cashflowNegative: 0
    };
    
    let totalCashflow = 0;
    let totalROI = 0;
    
    properties.forEach(property => {
      if (property.calculationResults) {
        // Property value
        stats.totalValue += property.calculationResults.finalPropertyValue || 0;
        
        // Equity & Debt
        stats.totalEquity += property.calculationResults.finalEquity || 0;
        stats.totalDebt += property.calculationResults.remainingLoan || 0;
        
        // Cashflow
        const monthlyCashflow = property.calculationResults.monthlyCashflow || 0;
        totalCashflow += monthlyCashflow;
        
        if (monthlyCashflow >= 0) {
          stats.cashflowPositive += 1;
        } else {
          stats.cashflowNegative += 1;
        }
        
        // ROI
        const initialEquity = property.calculationResults.initialEquity || 1;
        const roi = (monthlyCashflow * 12) / initialEquity * 100;
        totalROI += roi;
      }
    });
    
    stats.avgCashflow = totalCashflow / stats.propertyCount;
    stats.avgROI = totalROI / stats.propertyCount;
    
    return stats;
  }
}