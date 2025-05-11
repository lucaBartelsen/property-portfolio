// src/lib/calculators/cashflowCalculator.ts
import { Property, PurchaseData, OngoingData, CalculationResults, YearlyData, TaxInfo } from '../types';
import { calculateGermanIncomeTax, calculateChurchTax } from './taxCalculator';
import { calculatePurchase } from './purchaseCalculator';
import { calculateOngoing } from './ongoingCalculator';

/**
 * Berechnet den Cashflow und Investitionskennzahlen für eine Immobilie
 * @param property - Die Immobilie, für die der Cashflow berechnet werden soll
 * @param taxInfo - Die Steuerinformationen
 * @param calculationPeriod - Der Berechnungszeitraum in Jahren
 * @returns Die berechneten Ergebnisse und jährlichen Daten
 */
export function calculateCashflow(
  property: Property,
  taxInfo: TaxInfo,
  calculationPeriod: number = 10
): { results: CalculationResults; yearlyData: YearlyData[] } {
  // Kauf- und laufende Daten berechnen, falls nicht vorhanden
  const purchaseData = property.purchaseData || calculatePurchase(property);
  const ongoingData = property.ongoingData || calculateOngoing(property);
  
  // Finanzierungsdetails
  const financingType = property.defaults.financingType;
  const downPayment = property.defaults.downPayment;
  const interestRate = property.defaults.interestRate / 100;
  const repaymentRate = property.defaults.repaymentRate / 100;
  
  // Abschreibungsdetails
  const depreciationRate = property.defaults.depreciationRate / 100;
  const buildingValue = property.defaults.buildingValue;
  const furnitureValue = property.defaults.furnitureValue;
  const furnitureDepreciationRate = 0.10; // Fest auf 10% gesetzt
  
  // Projektionsdetails
  const appreciationRate = property.defaults.appreciationRate / 100;
  const rentIncreaseRate = property.defaults.rentIncreaseRate / 100;
  
  // Steuerdetails
  const annualIncome = taxInfo.annualIncome;
  const taxStatus = taxInfo.taxStatus;
  const hasChurchTax = taxInfo.hasChurchTax;
  const churchTaxRate = taxInfo.churchTaxRate;
  
  // Finanzierung berechnen
  let loanAmount = 0;
  let annuity = 0;
  
  if (financingType === 'loan') {
    loanAmount = purchaseData.totalCost - downPayment;
    annuity = loanAmount * (interestRate + repaymentRate);
  }
  
  // Abschreibung berechnen
  const annualBuildingDepreciation = buildingValue * depreciationRate;
  const annualFurnitureDepreciation = furnitureValue * furnitureDepreciationRate;
  
  // Berechnung für das erste Jahr
  let yearlyInterest = loanAmount * interestRate;
  let yearlyPrincipal = Math.min(annuity - yearlyInterest, loanAmount);
  let yearlyFinancingCosts = yearlyInterest + yearlyPrincipal;
  let remainingLoan = loanAmount - yearlyPrincipal;
  
  // Cashflow vor Steuern berechnen
  const cashflowBeforeTax = ongoingData.effectiveRent - ongoingData.totalOngoing - yearlyFinancingCosts;
  
  // Maklerkosten als Beratung berücksichtigen, falls aktiviert
  const brokerConsultingCosts = purchaseData.firstYearDeductibleCosts;
  
  // Gesamte Abschreibung berechnen
  const totalDepreciation = annualBuildingDepreciation + annualFurnitureDepreciation + 
                           purchaseData.annualMaintenance + brokerConsultingCosts;
  
  // Zu versteuerndes Einkommen berechnen
  const taxableIncome = cashflowBeforeTax + yearlyPrincipal - annualBuildingDepreciation - 
                       annualFurnitureDepreciation - purchaseData.annualMaintenance - 
                       brokerConsultingCosts;
  
  // Steuern berechnen
  const previousIncomeTax = calculateGermanIncomeTax(annualIncome, taxStatus);
  const totalTaxableIncome = Math.max(0, annualIncome + taxableIncome);
  const newIncomeTax = calculateGermanIncomeTax(totalTaxableIncome, taxStatus);
  
  // Kirchensteuer berechnen
  const previousChurchTax = calculateChurchTax(previousIncomeTax, hasChurchTax, churchTaxRate);
  const newChurchTax = calculateChurchTax(newIncomeTax, hasChurchTax, churchTaxRate);
  
  // Steuerersparnis berechnen
  const incomeTaxSavings = previousIncomeTax - newIncomeTax;
  const churchTaxSavings = previousChurchTax - newChurchTax;
  const taxSavings = incomeTaxSavings + churchTaxSavings;
  
  // Cashflow nach Steuern berechnen
  const cashflowAfterTax = cashflowBeforeTax + taxSavings;
  const monthlyCashflow = cashflowAfterTax / 12;

  // Jährliche Daten initialisieren
  const yearlyData: YearlyData[] = [];
  
  // Erstes Jahr hinzufügen
  yearlyData.push({
    year: 1,
    rent: ongoingData.effectiveRent,
    ongoingCosts: ongoingData.totalOngoing,
    interest: yearlyInterest,
    principal: yearlyPrincipal,
    payment: yearlyFinancingCosts,
    loanBalance: remainingLoan,
    buildingDepreciation: annualBuildingDepreciation,
    furnitureDepreciation: annualFurnitureDepreciation,
    maintenanceDeduction: purchaseData.annualMaintenance,
    totalDepreciation: totalDepreciation,
    taxableIncome: taxableIncome,
    firstYearDeductibleCosts: brokerConsultingCosts,
    previousIncome: annualIncome,
    previousTax: previousIncomeTax,
    previousChurchTax: previousChurchTax,
    newTotalIncome: totalTaxableIncome,
    newTax: newIncomeTax,
    newChurchTax: newChurchTax,
    taxSavings: taxSavings,
    cashflow: cashflowAfterTax,
    cashflowBeforeTax: cashflowBeforeTax,
    propertyValue: purchaseData.purchasePrice,
    equity: financingType === 'loan' ? purchaseData.purchasePrice - remainingLoan : purchaseData.purchasePrice,
    initialEquity: financingType === 'loan' ? downPayment : purchaseData.purchasePrice,
    // Zusätzliche detaillierte Daten
    vacancyRate: ongoingData.vacancyRate,
    propertyTax: ongoingData.propertyTax,
    managementFee: ongoingData.managementFee,
    maintenanceReserve: ongoingData.maintenanceCost,
    insurance: ongoingData.insurance,
    cashflowBeforeFinancing: ongoingData.effectiveRent - ongoingData.totalOngoing
  });

  // Zukünftige Jahre berechnen
  let currentRent = ongoingData.effectiveRent;
  let currentPropertyValue = purchaseData.purchasePrice;
  let currentRemainingLoan = remainingLoan;
  let currentPropertyTax = ongoingData.propertyTax;
  let currentManagementFee = ongoingData.managementFee;
  let currentMaintenanceReserve = ongoingData.maintenanceCost;
  let currentInsurance = ongoingData.insurance;
  
  for (let year = 2; year <= calculationPeriod; year++) {
    // Inflation auf Miete und Kosten anwenden
    currentRent *= (1 + rentIncreaseRate);
    currentPropertyTax *= (1 + rentIncreaseRate);
    currentManagementFee *= (1 + rentIncreaseRate);
    currentMaintenanceReserve *= (1 + rentIncreaseRate);
    currentInsurance *= (1 + rentIncreaseRate);
    
    // Gesamte laufende Kosten
    const currentOngoingCosts = currentPropertyTax + currentManagementFee + 
                              currentMaintenanceReserve + currentInsurance;
    
    // Cashflow vor Finanzierung
    const currentCashflowBeforeFinancing = currentRent - currentOngoingCosts;
    
    // Finanzierungskosten
    let yearlyInterest = 0;
    let yearlyPrincipal = 0;
    let yearlyFinancingCosts = 0;
    
    if (financingType === 'loan' && currentRemainingLoan > 0) {
      yearlyInterest = currentRemainingLoan * interestRate;
      yearlyPrincipal = Math.min(annuity - yearlyInterest, currentRemainingLoan);
      yearlyFinancingCosts = yearlyInterest + yearlyPrincipal;
      currentRemainingLoan -= yearlyPrincipal;
      if (currentRemainingLoan < 0) currentRemainingLoan = 0;
    }
    
    // Cashflow vor Steuern
    const currentCashflowBeforeTax = currentCashflowBeforeFinancing - yearlyFinancingCosts;
    
    // Erhaltungsaufwand nur für den angegebenen Verteilungszeitraum
    const yearlyMaintenance = year <= purchaseData.maintenanceDistribution ? 
                             purchaseData.annualMaintenance : 0;
    const yearlyTotalDepreciation = annualBuildingDepreciation + annualFurnitureDepreciation + 
                                   yearlyMaintenance;
    
    // Steuerberechnungen
    const yearlyTaxableIncome = currentCashflowBeforeTax + yearlyPrincipal - 
                               annualBuildingDepreciation - annualFurnitureDepreciation - 
                               yearlyMaintenance;
    const yearlyTotalTaxableIncome = Math.max(0, annualIncome + yearlyTaxableIncome);
    const yearlyNewIncomeTax = calculateGermanIncomeTax(yearlyTotalTaxableIncome, taxStatus);
    
    // Kirchensteuer
    const yearlyPreviousChurchTax = hasChurchTax ? 
                                  calculateChurchTax(previousIncomeTax, hasChurchTax, churchTaxRate) : 0;
    const yearlyNewChurchTax = hasChurchTax ? 
                             calculateChurchTax(yearlyNewIncomeTax, hasChurchTax, churchTaxRate) : 0;
    
    // Steuerersparnis
    const yearlyIncomeTaxSavings = previousIncomeTax - yearlyNewIncomeTax;
    const yearlyChurchTaxSavings = yearlyPreviousChurchTax - yearlyNewChurchTax;
    const yearlyTaxSavings = yearlyIncomeTaxSavings + yearlyChurchTaxSavings;
    
    // Cashflow nach Steuern
    const yearlyCashflowAfterTax = currentCashflowBeforeTax + yearlyTaxSavings;
    
    // Immobilienwert mit Wertsteigerung
    currentPropertyValue = purchaseData.purchasePrice * Math.pow(1 + appreciationRate, year - 1);
    
    // Eigenkapital
    const yearlyEquity = currentPropertyValue - currentRemainingLoan;
    
    // Jährliche Daten speichern
    yearlyData.push({
      year: year,
      rent: currentRent,
      ongoingCosts: currentOngoingCosts,
      interest: yearlyInterest,
      principal: yearlyPrincipal,
      payment: yearlyFinancingCosts,
      loanBalance: currentRemainingLoan,
      buildingDepreciation: annualBuildingDepreciation,
      furnitureDepreciation: annualFurnitureDepreciation,
      maintenanceDeduction: yearlyMaintenance,
      totalDepreciation: yearlyTotalDepreciation,
      firstYearDeductibleCosts: 0, // Nach dem ersten Jahr immer 0
      taxableIncome: yearlyTaxableIncome,
      previousIncome: annualIncome,
      previousTax: previousIncomeTax,
      previousChurchTax: yearlyPreviousChurchTax,
      newTotalIncome: yearlyTotalTaxableIncome,
      newTax: yearlyNewIncomeTax,
      newChurchTax: yearlyNewChurchTax,
      taxSavings: yearlyTaxSavings,
      cashflow: yearlyCashflowAfterTax,
      cashflowBeforeTax: currentCashflowBeforeTax,
      propertyValue: currentPropertyValue,
      equity: yearlyEquity,
      initialEquity: financingType === 'loan' ? downPayment : purchaseData.purchasePrice,
      // Zusätzliche detaillierte Daten
      vacancyRate: ongoingData.vacancyRate,
      propertyTax: currentPropertyTax,
      managementFee: currentManagementFee,
      maintenanceReserve: currentMaintenanceReserve,
      insurance: currentInsurance,
      cashflowBeforeFinancing: currentCashflowBeforeFinancing
    });
  }

  // Berechnungsergebnisse
  const results: CalculationResults = {
    totalCost: purchaseData.totalCost,
    downPayment: financingType === 'loan' ? downPayment : purchaseData.totalCost,
    loanAmount: loanAmount,
    annuity: annuity,
    monthlyPayment: annuity / 12,
    monthlyCashflow: monthlyCashflow,
    finalPropertyValue: yearlyData[calculationPeriod - 1].propertyValue,
    remainingLoan: yearlyData[calculationPeriod - 1].loanBalance,
    finalEquity: yearlyData[calculationPeriod - 1].equity,
    initialEquity: financingType === 'loan' ? downPayment : purchaseData.totalCost
  };

  return { results, yearlyData };
}