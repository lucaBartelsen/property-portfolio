// src/lib/calculators/cashflowCalculator.ts
import { Property, PurchaseData, OngoingData, CalculationResults, YearlyData, TaxInfo } from '../types';
import { calculateGermanIncomeTax, calculateChurchTax } from './taxCalculator';
import { calculatePurchase } from './purchaseCalculator';
import { calculateOngoing } from './ongoingCalculator';
import { BUNDESLAENDER } from '../constants';
import { ensureValidNumber } from '../utils/formatters';
import { calculateTotalCost } from '../utils/calculations';

/**
 * Sicherstellt, dass ein Wert eine gültige Zahl ist mit Minimum/Maximum-Grenzen
 */

/**
 * Berechnet den Cashflow und Investitionskennzahlen für eine Immobilie
 * @param property - Die Immobilie, für die der Cashflow berechnet werden soll
 * @param taxInfo - Die Steuerinformationen
 * @param calculationPeriod - Der Berechnungszeitraum in Jahren
 * @returns Die berechneten Ergebnisse und jährlichen Daten
 */
function calculateFinancingCosts(property: Property, calculationPeriod: number = 10) {
  // Sicherstellen, dass die Werte gültig sind
  const ensureValidNumber = (value: number | null | undefined, min: number = -1e9, max: number = 1e9, defaultValue: number = 0): number => {
    if (value === null || value === undefined || typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return Math.max(min, Math.min(max, value));
  };

  const financingType = property.defaults.financingType || 'loan';
  
  // Wenn keine Finanzierung, dann keine Kosten
  if (financingType === 'cash') {
    return {
      totalLoanAmount: 0,
      totalAnnuity: 0,
      totalInitialInterest: 0,
      totalInitialPrincipal: 0,
      yearlyPayments: Array(calculationPeriod).fill(0).map(() => ({ interest: 0, principal: 0, payment: 0, loanBalance: 0 }))
    };
  }

  // Neue Finanzierungsfelder verwenden, wenn vorhanden
  const useMultipleLoans = !!property.defaults.useSecondLoan;
  
  // Darlehen 1 (immer vorhanden)
  const loanAmount1 = ensureValidNumber(
    property.defaults.loanAmount1 || property.defaults.loanAmount, 
    0, 1e9, 0
  );
  const interestRate1 = ensureValidNumber(
    property.defaults.interestRate1 || property.defaults.interestRate, 
    0, 100, 4
  ) / 100;
  const repaymentRate1 = ensureValidNumber(
    property.defaults.repaymentRate1 || property.defaults.repaymentRate, 
    0, 100, 1.5
  ) / 100;
  
  // Darlehen 2 (optional)
  const loanAmount2 = useMultipleLoans 
    ? ensureValidNumber(property.defaults.loanAmount2, 0, 1e9, 0) 
    : 0;
  const interestRate2 = useMultipleLoans 
    ? ensureValidNumber(property.defaults.interestRate2, 0, 100, 4) / 100 
    : 0;
  const repaymentRate2 = useMultipleLoans 
    ? ensureValidNumber(property.defaults.repaymentRate2, 0, 100, 1.5) / 100 
    : 0;
  
  // Berechnung für Darlehen 1
  const loan1 = calculateLoanPayments(loanAmount1, interestRate1, repaymentRate1, calculationPeriod);
  
  // Berechnung für Darlehen 2, falls vorhanden
  const loan2 = useMultipleLoans 
    ? calculateLoanPayments(loanAmount2, interestRate2, repaymentRate2, calculationPeriod) 
    : {
        annuity: 0,
        initialInterest: 0,
        initialPrincipal: 0,
        yearlyPayments: Array(calculationPeriod).fill(0).map(() => ({ interest: 0, principal: 0, payment: 0, loanBalance: 0 }))
      };
  
  // Kombinierte Ergebnisse
  const yearlyPayments = Array(calculationPeriod).fill(0).map((_, index) => {
    return {
      interest: loan1.yearlyPayments[index].interest + loan2.yearlyPayments[index].interest,
      principal: loan1.yearlyPayments[index].principal + loan2.yearlyPayments[index].principal,
      payment: loan1.yearlyPayments[index].payment + loan2.yearlyPayments[index].payment,
      loanBalance: loan1.yearlyPayments[index].loanBalance + loan2.yearlyPayments[index].loanBalance
    };
  });
  
  return {
    totalLoanAmount: loanAmount1 + loanAmount2,
    totalAnnuity: loan1.annuity + loan2.annuity,
    totalInitialInterest: loan1.initialInterest + loan2.initialInterest,
    totalInitialPrincipal: loan1.initialPrincipal + loan2.initialPrincipal,
    yearlyPayments
  };
}

// Berechnet die jährlichen Zahlungen für ein einzelnes Darlehen
function calculateLoanPayments(loanAmount: number, interestRate: number, repaymentRate: number, years: number) {
  if (loanAmount <= 0) {
    // Kein Darlehen, keine Zahlungen
    return {
      annuity: 0,
      initialInterest: 0,
      initialPrincipal: 0,
      yearlyPayments: Array(years).fill(0).map(() => ({ interest: 0, principal: 0, payment: 0, loanBalance: 0 }))
    };
  }
  
  // Berechnung der jährlichen Annuität
  const annuity = loanAmount * (interestRate + repaymentRate);
  
  // Initialisierung
  let remainingLoan = loanAmount;
  const yearlyPayments = [];
  
  // Zahlungen für alle Jahre berechnen
  for (let year = 1; year <= years; year++) {
    const yearlyInterest = remainingLoan * interestRate;
    const yearlyPrincipal = Math.min(annuity - yearlyInterest, remainingLoan);
    const yearlyPayment = yearlyInterest + yearlyPrincipal;
    
    // Darlehensrest reduzieren
    remainingLoan = Math.max(0, remainingLoan - yearlyPrincipal);
    
    // Jahreswerte speichern
    yearlyPayments.push({
      interest: yearlyInterest,
      principal: yearlyPrincipal,
      payment: yearlyPayment,
      loanBalance: remainingLoan
    });
  }
  
  return {
    annuity,
    initialInterest: yearlyPayments[0].interest,
    initialPrincipal: yearlyPayments[0].principal,
    yearlyPayments
  };
}

export function calculateCashflow(
  property: Property,
  taxInfo: TaxInfo,
  calculationPeriod: number = 10
): { results: CalculationResults; yearlyData: YearlyData[] } {
  try {
    // Kauf- und laufende Daten berechnen, falls nicht vorhanden
    const purchaseData = property.purchaseData || calculatePurchase(property);
    const ongoingData = property.ongoingData || calculateOngoing(property);
    
    // Finanzierungsdetails - Sichere Zahlenkonvertierung
    const financingType = property.defaults.financingType;
    const downPayment = ensureValidNumber(property.defaults.downPayment, 0, 1e9, 25000);
    const interestRate = ensureValidNumber(property.defaults.interestRate, 0, 100, 4) / 100;
    const repaymentRate = ensureValidNumber(property.defaults.repaymentRate, 0, 100, 1.5) / 100;
    
    // Abschreibungsdetails - Sichere Zahlenkonvertierung
    const depreciationRate = ensureValidNumber(property.defaults.depreciationRate, 0, 100, 2) / 100;
    
    // WICHTIG: Die AfA-Basis ist jetzt der Gebäudeanteil plus der proportionale Anteil 
    // der Grunderwerbsteuer und Notarkosten, die auf das Gebäude entfallen
    const buildingValueBase = purchaseData.totalBuildingValue; // Bereits inklusive Nebenkosten
    const annualBuildingDepreciation = buildingValueBase * depreciationRate;
    
    // Möbelabschreibung bleibt unverändert
    const furnitureValue = ensureValidNumber(property.defaults.furnitureValue, 0, 1e9, 15000);
    const furnitureDepreciationRate = 0.10; // Fest auf 10% gesetzt
    const annualFurnitureDepreciation = furnitureValue * furnitureDepreciationRate;
    
    // Projektionsdetails - Sichere Zahlenkonvertierung
    const appreciationRate = ensureValidNumber(property.defaults.appreciationRate, 0, 100, 2) / 100;
    const rentIncreaseRate = ensureValidNumber(property.defaults.rentIncreaseRate, 0, 100, 1.5) / 100;
    
    // Steuerdetails
    const annualIncome = ensureValidNumber(taxInfo.annualIncome, 0, 1e7, 70000);
    const taxStatus = taxInfo.taxStatus;
    const hasChurchTax = taxInfo.hasChurchTax;
    const churchTaxRate = ensureValidNumber(taxInfo.churchTaxRate, 0, 100, 9);
    
    // Finanzierung berechnen
    const financingCosts = calculateFinancingCosts(property, calculationPeriod);
    let loanAmount = financingCosts.totalLoanAmount;
    let annuity = financingCosts.totalAnnuity;

    const totalCost = calculateTotalCost(property.defaults.purchasePrice, property.defaults.bundesland, property.defaults.notaryRate, property.defaults.brokerRate)
    
    // Berechnung für das erste Jahr
    let yearlyInterest = financingCosts.totalInitialInterest;
    let yearlyPrincipal = financingCosts.totalInitialPrincipal;
    let yearlyFinancingCosts = yearlyInterest + yearlyPrincipal;
    let remainingLoan = loanAmount - yearlyPrincipal;
        
    // Sicherstellen, dass die Werte sinnvoll sind
    yearlyInterest = ensureValidNumber(yearlyInterest, 0, 1e9);
    yearlyPrincipal = ensureValidNumber(yearlyPrincipal, 0, 1e9);
    yearlyFinancingCosts = ensureValidNumber(yearlyFinancingCosts, 0, 1e9);
    remainingLoan = ensureValidNumber(remainingLoan, 0, 1e9);
    
    // Cashflow vor Steuern berechnen
    const effectiveRent = ensureValidNumber(ongoingData.effectiveRent, 0, 1e7, 14400);
    const totalOngoing = ensureValidNumber(ongoingData.totalOngoing, 0, 1e7, 2000);
    const cashflowBeforeTax = effectiveRent - totalOngoing - yearlyFinancingCosts;
    
    // Maklerkosten als Beratung berücksichtigen, falls aktiviert
    const brokerConsultingCosts = ensureValidNumber(purchaseData.firstYearDeductibleCosts, 0, 1e7);
    
    // Gesamte Abschreibung berechnen
    const annualMaintenance = ensureValidNumber(purchaseData.annualMaintenance, 0, 1e7, 7000);
    const totalDepreciation = annualBuildingDepreciation + annualFurnitureDepreciation + 
                           annualMaintenance + brokerConsultingCosts;
    
    // Zu versteuerndes Einkommen berechnen
    const taxableIncome = cashflowBeforeTax + yearlyPrincipal - annualBuildingDepreciation - 
                       annualFurnitureDepreciation - annualMaintenance - 
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

    // Der Kaufpreis ohne Möbel ist die Summe aus Grundstück und Gebäude
    const immobileOnlyPurchasePrice = purchaseData.landValue + purchaseData.buildingValue + purchaseData.maintenanceCost;
    
    // Erstes Jahr hinzufügen
    const purchasePrice = ensureValidNumber(purchaseData.purchasePrice, 1000, 1e9, 316500);
    yearlyData.push({
      year: 1,
      rent: effectiveRent,
      ongoingCosts: totalOngoing,
      interest: yearlyInterest,
      principal: yearlyPrincipal,
      payment: yearlyFinancingCosts,
      loanBalance: remainingLoan,
      buildingDepreciation: annualBuildingDepreciation,
      furnitureDepreciation: annualFurnitureDepreciation,
      maintenanceDeduction: annualMaintenance,
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
      // WICHTIGE ÄNDERUNG: Immobilienwert ohne Möbelwert
      propertyValue: immobileOnlyPurchasePrice,
      equity: financingType === 'loan' ? immobileOnlyPurchasePrice - remainingLoan : immobileOnlyPurchasePrice,
      initialEquity: financingType === 'loan' ? downPayment : immobileOnlyPurchasePrice,
      // Zusätzliche detaillierte Daten
      vacancyRate: ensureValidNumber(ongoingData.vacancyRate, 0, 100, 3),
      propertyTax: ensureValidNumber(ongoingData.propertyTax, 0, 1e6, 500),
      managementFee: ensureValidNumber(ongoingData.managementFee, 0, 1e6, 600),
      maintenanceReserve: ensureValidNumber(ongoingData.maintenanceCost, 0, 1e6, 600),
      insurance: ensureValidNumber(ongoingData.insurance, 0, 1e6, 300),
      cashflowBeforeFinancing: effectiveRent - totalOngoing
    });

    // Zukünftige Jahre berechnen
    let currentRent = effectiveRent;
    let currentPropertyValue = immobileOnlyPurchasePrice;
    let currentRemainingLoan = remainingLoan;

    // WICHTIGE ÄNDERUNG: Die Bewirtschaftungskosten fix halten
    // Diese Werte werden nicht mehr jährlich erhöht
    const fixedPropertyTax = ongoingData.propertyTax;
    const fixedManagementFee = ongoingData.managementFee;
    const fixedMaintenanceReserve = ongoingData.maintenanceCost;
    const fixedInsurance = ongoingData.insurance;
    const fixedOngoingCosts = fixedPropertyTax + fixedManagementFee + fixedMaintenanceReserve + fixedInsurance;
    
    for (let year = 2; year <= calculationPeriod; year++) {
      // Nur die Miete steigt mit der Inflation
      currentRent = ensureValidNumber(currentRent * (1 + rentIncreaseRate), 0, 1e7);
      
      // ÄNDERUNG: Bewirtschaftungskosten bleiben konstant
      const currentOngoingCosts = fixedOngoingCosts;
      
      // Cashflow vor Finanzierung
      const currentCashflowBeforeFinancing = ensureValidNumber(currentRent - currentOngoingCosts, -1e7, 1e7);
      
      // Finanzierungskosten
      const yearIndex = year - 1;
      let yearlyInterest = 0;
      let yearlyPrincipal = 0;
      let yearlyFinancingCosts = 0;
      
      if (financingType === 'loan') {
        yearlyInterest = ensureValidNumber(financingCosts.yearlyPayments[yearIndex].interest, 0, 1e7);
        yearlyPrincipal = ensureValidNumber(financingCosts.yearlyPayments[yearIndex].principal, 0, 1e7);
        yearlyFinancingCosts = ensureValidNumber(financingCosts.yearlyPayments[yearIndex].payment, 0, 1e7);
        currentRemainingLoan = ensureValidNumber(financingCosts.yearlyPayments[yearIndex].loanBalance, 0, 1e9);
      }
      
      // Cashflow vor Steuern
      const currentCashflowBeforeTax = ensureValidNumber(
        currentCashflowBeforeFinancing - yearlyFinancingCosts, 
        -1e7, 
        1e7
      );
      
      // Erhaltungsaufwand nur für den angegebenen Verteilungszeitraum
      const maintenanceDistribution = ensureValidNumber(purchaseData.maintenanceDistribution, 1, 5, 1);
      const yearlyMaintenance = year <= maintenanceDistribution ? 
                             ensureValidNumber(annualMaintenance, 0, 1e7) : 0;
      const yearlyTotalDepreciation = ensureValidNumber(
        annualBuildingDepreciation + annualFurnitureDepreciation + yearlyMaintenance, 
        0, 
        1e7
      );
      
      // Steuerberechnungen
      const yearlyTaxableIncome = ensureValidNumber(
        currentCashflowBeforeTax + yearlyPrincipal - annualBuildingDepreciation - 
        annualFurnitureDepreciation - yearlyMaintenance,
        -1e7,
        1e7
      );
      const yearlyTotalTaxableIncome = Math.max(0, annualIncome + yearlyTaxableIncome);
      const yearlyNewIncomeTax = calculateGermanIncomeTax(yearlyTotalTaxableIncome, taxStatus);
      
      // Kirchensteuer
      const yearlyPreviousChurchTax = hasChurchTax ? 
                                  calculateChurchTax(previousIncomeTax, hasChurchTax, churchTaxRate) : 0;
      const yearlyNewChurchTax = hasChurchTax ? 
                             calculateChurchTax(yearlyNewIncomeTax, hasChurchTax, churchTaxRate) : 0;
      
      // Steuerersparnis
      const yearlyIncomeTaxSavings = ensureValidNumber(previousIncomeTax - yearlyNewIncomeTax, -1e7, 1e7);
      const yearlyChurchTaxSavings = ensureValidNumber(yearlyPreviousChurchTax - yearlyNewChurchTax, -1e7, 1e7);
      const yearlyTaxSavings = ensureValidNumber(yearlyIncomeTaxSavings + yearlyChurchTaxSavings, -1e7, 1e7);
      
      // Cashflow nach Steuern
      const yearlyCashflowAfterTax = ensureValidNumber(
        currentCashflowBeforeTax + yearlyTaxSavings, 
        -1e7, 
        1e7
      );
      
      // Immobilienwert mit Wertsteigerung
      currentPropertyValue = ensureValidNumber(
        immobileOnlyPurchasePrice * Math.pow(1 + appreciationRate, year - 1), 
        0, 
        1e9
      );
      
      // Eigenkapital
      const yearlyEquity = ensureValidNumber(currentPropertyValue - currentRemainingLoan, -1e9, 1e9);
      
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
        initialEquity: financingType === 'loan' ? downPayment : purchasePrice,
        // Zusätzliche detaillierte Daten - WICHTIG: Konstante Werte verwenden
        vacancyRate: ongoingData.vacancyRate,
        propertyTax: fixedPropertyTax,
        managementFee: fixedManagementFee,
        maintenanceReserve: fixedMaintenanceReserve,
        insurance: fixedInsurance,
        cashflowBeforeFinancing: currentCashflowBeforeFinancing
      });
    }

    // Berechnungsergebnisse
    const results: CalculationResults = {
      totalCost: totalCost,  // Verwende den korrigierten Wert
      downPayment: financingType === 'loan' ? downPayment : totalCost,
      loanAmount: loanAmount,
      annuity: annuity,
      monthlyPayment: ensureValidNumber(annuity / 12, 0, 1e7),
      monthlyCashflow: ensureValidNumber(monthlyCashflow, -1e7, 1e7),
      finalPropertyValue: ensureValidNumber(yearlyData[calculationPeriod - 1].propertyValue, 0, 1e9),
      remainingLoan: ensureValidNumber(yearlyData[calculationPeriod - 1].loanBalance, 0, 1e9),
      finalEquity: ensureValidNumber(yearlyData[calculationPeriod - 1].equity, -1e9, 1e9),
      initialEquity: financingType === 'loan' ? downPayment : totalCost  // Verwende den korrigierten Wert
    };

    return { results, yearlyData };
  } catch (error) {
    console.error("Fehler bei der Cashflow-Berechnung:", error);
    
    // Berechne einen vernünftigen Standardwert für totalCost basierend auf den verfügbaren Daten
    const purchasePrice = ensureValidNumber(property?.defaults?.purchasePrice, 0, 1e9, 316500);
    const notaryRate = ensureValidNumber(property?.defaults?.notaryRate, 0, 100, 1.5) / 100;
    const brokerRate = ensureValidNumber(property?.defaults?.brokerRate, 0, 100, 3) / 100;
    const estimatedTotalCost = purchasePrice * (1 + notaryRate + brokerRate);
    const downPayment = ensureValidNumber(property?.defaults?.downPayment, 0, 1e9, 25000);
    
    // Standardwerte zurückgeben, wenn ein Fehler auftritt
    const defaultResults: CalculationResults = {
      totalCost: estimatedTotalCost,
      downPayment: downPayment,
      loanAmount: property?.defaults?.financingType === 'loan' ? estimatedTotalCost - downPayment : 0,
      annuity: 0,
      monthlyPayment: 0,
      monthlyCashflow: 0,
      finalPropertyValue: purchasePrice * 1.1, // Annahme einer leichten Wertsteigerung
      remainingLoan: property?.defaults?.financingType === 'loan' ? estimatedTotalCost - downPayment : 0,
      finalEquity: property?.defaults?.financingType === 'loan' ? purchasePrice * 1.1 - (estimatedTotalCost - downPayment) : purchasePrice * 1.1,
      initialEquity: property?.defaults?.financingType === 'loan' ? downPayment : estimatedTotalCost
    };
    
    const defaultYearlyData: YearlyData[] = Array(10).fill(0).map((_, i) => ({
      year: i + 1,
      rent: ensureValidNumber(property?.defaults?.monthlyRent, 0, 1e6, 1200) * 12,
      ongoingCosts: 2000,
      interest: 0,
      principal: 0,
      payment: 0,
      loanBalance: defaultResults.loanAmount,
      buildingDepreciation: 0,
      furnitureDepreciation: 0,
      maintenanceDeduction: 0,
      totalDepreciation: 0,
      taxableIncome: 0,
      firstYearDeductibleCosts: 0,
      previousIncome: 0,
      previousTax: 0,
      previousChurchTax: 0,
      newTotalIncome: 0,
      newTax: 0,
      newChurchTax: 0,
      taxSavings: 0,
      cashflow: 0,
      cashflowBeforeTax: 0,
      propertyValue: purchasePrice * Math.pow(1.02, i), // Leichte Wertsteigerung von 2% pro Jahr
      equity: property?.defaults?.financingType === 'loan' 
        ? purchasePrice * Math.pow(1.02, i) - defaultResults.loanAmount 
        : purchasePrice * Math.pow(1.02, i),
      initialEquity: defaultResults.initialEquity,
      vacancyRate: ensureValidNumber(property?.defaults?.vacancyRate, 0, 100, 3),
      propertyTax: ensureValidNumber(property?.defaults?.propertyTax, 0, 1e6, 500),
      managementFee: ensureValidNumber(property?.defaults?.managementFee, 0, 1e6, 600),
      maintenanceReserve: ensureValidNumber(property?.defaults?.maintenanceReserve, 0, 1e6, 600),
      insurance: ensureValidNumber(property?.defaults?.insurance, 0, 1e6, 300),
      cashflowBeforeFinancing: 0
    }));
    
    return { results: defaultResults, yearlyData: defaultYearlyData };
  }
}