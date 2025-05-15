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
            
            // Get current date
            const currentDate = new Date();
            
            // Get purchase date or default to today
            const purchaseDateStr = property.defaults.purchaseDate || currentDate.toISOString().split('T')[0];
            const purchaseDate = new Date(purchaseDateStr);
            
            // Calculate years passed since purchase
            const yearsPassed = this.calculateYearsSincePurchase(purchaseDate, currentDate);
            
            // Then calculate cashflow with these values and years passed
            const { results, yearlyData } = calculateCashflow(
            { ...property, purchaseData, ongoingData },
            taxInfo,
            10, // Standard calculation period
            yearsPassed
            );
            
            // Apply market value override if enabled
            if (property.defaults.useCurrentMarketValue && property.defaults.currentMarketValue) {
            // Store the original property value for reference
            const originalPropertyValue = results.finalPropertyValue;
            
            // Update the property value in results
            results.finalPropertyValue = property.defaults.currentMarketValue;
            
            // Also update corresponding yearly data if available
            if (yearlyData && yearlyData.length > 0) {
                // For each year, adjust the property value based on the appreciation rate
                const appreciationRate = property.defaults.appreciationRate / 100;
                
                // Start with the current override value
                let baseValue = property.defaults.currentMarketValue;
                
                // Adjust each year's property value
                for (let i = 0; i < yearlyData.length; i++) {
                if (i === 0) {
                    // First year uses the exact override value
                    yearlyData[i].propertyValue = baseValue;
                } else {
                    // Future years grow from the override value at the appreciation rate
                    baseValue = baseValue * (1 + appreciationRate);
                    yearlyData[i].propertyValue = baseValue;
                }
                }
            }
            }
            
            // Apply debt value override if enabled
            if (property.defaults.useCurrentDebtValue && property.defaults.currentDebtValue !== undefined) {
            // Update the loan balance in results
            results.remainingLoan = property.defaults.currentDebtValue;
            
            // Also update the yearly data if available
            if (yearlyData && yearlyData.length > 0) {
                // For annuity loans, the payment amount (annuity) stays constant
                // Get the original annuity from the first year payment
                const originalAnnuity = results.annuity;
                
                // Get the loan terms
                const interestRate = property.defaults.interestRate1 || property.defaults.interestRate || 4;
                const interestRateDecimal = interestRate / 100;
                
                // Set the first year to the exact override value
                const currentDebt = property.defaults.currentDebtValue;
                yearlyData[0].loanBalance = currentDebt;
                
                // Interest is calculated on the current balance
                yearlyData[0].interest = currentDebt * interestRateDecimal;
                
                // Principal is the annuity minus interest (but capped at remaining loan)
                yearlyData[0].principal = Math.min(originalAnnuity - yearlyData[0].interest, currentDebt);
                
                // Payment is the original annuity (constant) or less if near the end of the loan
                yearlyData[0].payment = Math.min(originalAnnuity, yearlyData[0].interest + yearlyData[0].principal);
                
                // Recalculate remaining years with a proper amortization schedule
                let remainingLoan = currentDebt - yearlyData[0].principal;
                
                for (let i = 1; i < yearlyData.length; i++) {
                // Make sure loan doesn't go negative
                remainingLoan = Math.max(0, remainingLoan);
                
                // Set the loan balance for this year
                yearlyData[i].loanBalance = remainingLoan;
                
                // If the loan is fully paid off
                if (remainingLoan === 0) {
                    yearlyData[i].interest = 0;
                    yearlyData[i].principal = 0;
                    yearlyData[i].payment = 0;
                    continue;
                }
                
                // Calculate interest based on the remaining loan
                yearlyData[i].interest = remainingLoan * interestRateDecimal;
                
                // Principal is the annuity minus interest (but capped at the remaining loan)
                yearlyData[i].principal = Math.min(originalAnnuity - yearlyData[i].interest, remainingLoan);
                
                // Payment is the original annuity (constant) or less if near the end of the loan
                yearlyData[i].payment = Math.min(originalAnnuity, yearlyData[i].interest + yearlyData[i].principal);
                
                // Reduce the loan for the next year
                remainingLoan = remainingLoan - yearlyData[i].principal;
                }
            }
            }
            
            // Finally, recalculate equity for all years
            if (yearlyData && yearlyData.length > 0) {
            for (let i = 0; i < yearlyData.length; i++) {
                // Equity is property value minus loan balance
                yearlyData[i].equity = yearlyData[i].propertyValue - yearlyData[i].loanBalance;
                
                // Also recalculate cashflow before tax (if loan values changed)
                if (property.defaults.useCurrentDebtValue) {
                yearlyData[i].cashflowBeforeTax = yearlyData[i].cashflowBeforeFinancing - yearlyData[i].payment;
                
                // And update taxable income, which depends on principal payments
                yearlyData[i].taxableIncome = yearlyData[i].cashflowBeforeTax + yearlyData[i].principal - 
                                            yearlyData[i].buildingDepreciation - 
                                            yearlyData[i].furnitureDepreciation - 
                                            yearlyData[i].maintenanceDeduction -
                                            (i === 0 ? yearlyData[i].firstYearDeductibleCosts : 0);
                                            
                // Recalculate tax aspects
                const previousIncomeTax = yearlyData[i].previousTax;
                const previousChurchTax = yearlyData[i].previousChurchTax;
                
                const totalTaxableIncome = Math.max(0, yearlyData[i].previousIncome + yearlyData[i].taxableIncome);
                yearlyData[i].newTotalIncome = totalTaxableIncome;
                
                // Recalculate taxes
                yearlyData[i].newTax = calculateGermanIncomeTax(totalTaxableIncome, taxInfo.taxStatus);
                yearlyData[i].newChurchTax = taxInfo.hasChurchTax ? 
                    calculateChurchTax(yearlyData[i].newTax, taxInfo.hasChurchTax, taxInfo.churchTaxRate) : 0;
                
                // Calculate tax savings
                yearlyData[i].taxSavings = (previousIncomeTax - yearlyData[i].newTax) + 
                                        (previousChurchTax - yearlyData[i].newChurchTax);
                
                // Finally recalculate cashflow after tax
                yearlyData[i].cashflow = yearlyData[i].cashflowBeforeTax + yearlyData[i].taxSavings;
                }
            }
            }
            
            // Update the final values in results
            if (yearlyData && yearlyData.length > 0) {
            const lastYear = yearlyData[yearlyData.length - 1];
            results.finalPropertyValue = lastYear.propertyValue;
            results.remainingLoan = lastYear.loanBalance;
            results.finalEquity = lastYear.equity;
            
            // Update monthly cashflow based on first year
            results.monthlyCashflow = yearlyData[0].cashflow / 12;
            }
            
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
     * Calculate years between purchase date and current date
     */
    static calculateYearsSincePurchase(purchaseDate: Date, currentDate: Date): number {
    // For invalid dates, return 0
    if (isNaN(purchaseDate.getTime()) || isNaN(currentDate.getTime())) {
        return 0;
    }
    
    // For future dates, return 0
    if (purchaseDate > currentDate) {
        return 0;
    }
    
    // Calculate difference in years
    let years = currentDate.getFullYear() - purchaseDate.getFullYear();
    
    // Adjust if we haven't reached the anniversary date yet
    if (
        currentDate.getMonth() < purchaseDate.getMonth() || 
        (currentDate.getMonth() === purchaseDate.getMonth() && 
        currentDate.getDate() < purchaseDate.getDate())
    ) {
        years--;
    }
    
    return years;
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