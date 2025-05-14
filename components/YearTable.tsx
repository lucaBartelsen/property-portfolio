// src/components/YearTable.tsx
import { useState, useEffect, useMemo } from 'react';
import { Card, Title, Button, Group, Text, Paper, Table, Pagination } from '@mantine/core';
import { usePropertyStore } from '../store/PropertyContext';
import { Property, YearlyData, TaxInfo } from '../lib/types';
import { formatCurrency } from '../lib/utils/formatters';
import { calculateCashflow } from '../lib/calculators/cashflowCalculator';
import { calculatePurchase } from '../lib/calculators/purchaseCalculator';
import { calculateOngoing } from '../lib/calculators/ongoingCalculator';
import { calculateChurchTax, calculateGermanIncomeTax } from '@/lib/calculators/taxCalculator';

interface YearTableProps {
  property?: Property;
  combined?: boolean;
  onBack?: () => void;
}

export default function YearTable({ property, combined, onBack }: YearTableProps) {
  const { state, dispatch } = usePropertyStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const itemsPerPage = 5;
  
  // Calculate yearly data on-demand
  const yearlyData = useMemo(() => {
    // For combined view
    if (combined) {
      const calculationPeriod = 10; // Standard period
      
      // Don't proceed if there are no properties
      if (state.properties.length === 0) {
        return null;
      }
      
      // Initialize arrays for combined results
      const combinedYearlyData: YearlyData[] = Array(calculationPeriod).fill(0).map((_, index) => {
        // Berechne die Einkommensteuer für das Grundeinkommen
        const baseIncome = state.taxInfo.annualIncome;
        const baseTax = calculateGermanIncomeTax(baseIncome, state.taxInfo.taxStatus);
        const baseChurchTax = state.taxInfo.hasChurchTax ? 
          calculateChurchTax(baseTax, state.taxInfo.hasChurchTax, state.taxInfo.churchTaxRate) : 0;
        
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
          previousIncome: baseIncome, // Das Grundeinkommen ohne Immobilien
          previousTax: baseTax, // Die Steuer auf das Grundeinkommen
          previousChurchTax: baseChurchTax, // Die Kirchensteuer auf das Grundeinkommen
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
      
      // Calculate fresh data for each property and add to combined results
      state.properties.forEach(propertyItem => {
        // Calculate fresh data for this property
        const propertyYearlyData = calculatePropertyYearlyData(propertyItem, state.taxInfo);
        
        if (propertyYearlyData) {
          // Add this property's yearly data to the combined data
          propertyYearlyData.forEach((yearData, index) => {
            if (index < calculationPeriod) {
              const combinedYear = combinedYearlyData[index];
              
              // Sum all numerical values except year, percentages, and income-related fields that shouldn't be duplicated
              Object.keys(yearData).forEach(key => {
                const typedKey = key as keyof YearlyData;
                
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
                
                // Only sum numerical values that aren't in the exclusion list
                if (
                  !nonSummableFields.includes(typedKey) && 
                  typeof yearData[typedKey] === 'number'
                ) {
                  // @ts-ignore (TypeScript doesn't understand we're only summing numeric values)
                  combinedYear[typedKey] += yearData[typedKey];
                }
              });
            }
          });
        }
      });

      combinedYearlyData.forEach((yearData, index) => {
    // Das Grundeinkommen ist bereits in previousIncome gesetzt
    // Der Immobilienbedingte Einkommensanteil ist in taxableIncome
    
    // Berechne das neue Gesamteinkommen mit Immobilieneinkommen
    const totalIncome = Math.max(0, yearData.previousIncome + yearData.taxableIncome);
    yearData.newTotalIncome = totalIncome;
    
    // Berechne die neue Gesamtsteuer mit dem kombinierten Einkommen
    const newTax = calculateGermanIncomeTax(totalIncome, state.taxInfo.taxStatus);
    yearData.newTax = newTax;
    
    // Berechne die neue Kirchensteuer
    const newChurchTax = state.taxInfo.hasChurchTax 
        ? calculateChurchTax(newTax, state.taxInfo.hasChurchTax, state.taxInfo.churchTaxRate)
        : 0;
    yearData.newChurchTax = newChurchTax;
    
    // Berechne die Steuerersparnis
    // Die Steuerersparnis kann auch negativ sein (Steuermehrbelastung)
    yearData.taxSavings = (yearData.previousTax - newTax) + 
                        (yearData.previousChurchTax - newChurchTax);
    
    // Aktualisiere den Cashflow nach Steuern
    yearData.cashflow = yearData.cashflowBeforeTax + yearData.taxSavings;
    });
      
      return combinedYearlyData;
    } 
    // For single property view
    else if (property) {
      return calculatePropertyYearlyData(property, state.taxInfo);
    }
    
    return null;
  }, [combined, property, state.properties, state.taxInfo]);
  
  // Helper function to calculate yearly data for a single property
  function calculatePropertyYearlyData(propertyItem: Property, taxInfo: TaxInfo): YearlyData[] | null {
    try {
      // Calculate purchase and ongoing data first
      const purchaseData = calculatePurchase(propertyItem);
      const ongoingData = calculateOngoing(propertyItem);
      
      // Then calculate cashflow with these fresh values
      const { yearlyData } = calculateCashflow(
        { ...propertyItem, purchaseData, ongoingData },
        taxInfo,
        10 // Standard calculation period
      );
      
      return yearlyData;
    } catch (error) {
      console.error("Error calculating property data:", error);
      return null;
    }
  }
  
  // Component title
  const title = combined 
    ? "Gesamtjahrestabelle aller Immobilien" 
    : `Jahrestabelle: ${property?.name}`;
  
  // If no data is available, show a message
  if (!yearlyData || yearlyData.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Group position="apart" mb="md">
          <Title order={2}>{title}</Title>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Zurück
            </Button>
          )}
        </Group>
        <Text align="center">Keine Daten vorhanden. Bitte fügen Sie zuerst Immobilien hinzu.</Text>
        {combined && (
          <Button fullWidth mt="md" onClick={() => dispatch({ type: 'CALCULATE_COMBINED_RESULTS' })}>
            Berechnungen durchführen
          </Button>
        )}
      </Paper>
    );
  }
  
  // Calculation period
  const calculationPeriod = yearlyData.length;
  
  // Data for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, calculationPeriod);
  const pageData = yearlyData.slice(startIndex, endIndex);
  
  // Calculate total pages
  const totalPages = Math.ceil(calculationPeriod / itemsPerPage);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(cat => cat !== category) 
        : [...prev, category]
    );
  };

  // Check if a category is expanded
  const isCategoryExpanded = (category: string) => {
    return expandedCategories.includes(category);
  };

  // Expand all categories
  const expandAll = () => {
    setExpandedCategories(['income', 'costs', 'financing', 'tax', 'assets', 'tax-savings']);
  };

  // Collapse all categories
  const collapseAll = () => {
    setExpandedCategories([]);
  };

  // Export table data as CSV
  const exportToCsv = () => {
    if (!yearlyData) return;

    // Create CSV content
    let csvContent = 'Kategorie';
    
    // Years as column headers
    for (let i = 0; i < calculationPeriod; i++) {
        csvContent += `;Jahr ${i + 1}`;
    }
    csvContent += '\n';
    
    // 1. Mieteinnahmen (Rent income)
    csvContent += addCsvRow('Mieteinnahmen', (data: YearlyData) => data.rent);
    if (isCategoryExpanded('income')) {
        csvContent += addCsvRow('  Mieteinnahmen (brutto)', (data: YearlyData) => data.rent * 100/(100-data.vacancyRate));
        csvContent += addCsvRow('  Leerstand', (data: YearlyData) => -(data.rent * 100/(100-data.vacancyRate) - data.rent));
        csvContent += addCsvRow('  Effektive Mieteinnahmen', (data: YearlyData) => data.rent);
    }
    
    // 2. Bewirtschaftungskosten (Operating costs)
    csvContent += addCsvRow('Bewirtschaftungskosten', (data: YearlyData) => -data.ongoingCosts);
    if (isCategoryExpanded('costs')) {
        csvContent += addCsvRow('  Grundsteuer', (data: YearlyData) => -data.propertyTax);
        csvContent += addCsvRow('  Hausverwaltung', (data: YearlyData) => -data.managementFee);
        csvContent += addCsvRow('  Instandhaltungsrücklage', (data: YearlyData) => -data.maintenanceReserve);
        csvContent += addCsvRow('  Versicherungen', (data: YearlyData) => -data.insurance);
        csvContent += addCsvRow('  Gesamte Bewirtschaftungskosten', (data: YearlyData) => -data.ongoingCosts);
    }
    
    // 3. Cashflow vor Finanzierung (Cashflow before financing)
    csvContent += addCsvRow('Cashflow vor Finanzierung', (data: YearlyData) => data.cashflowBeforeFinancing);
    
    // 4. Finanzierung (Financing)
    csvContent += addCsvRow('Finanzierung', (data: YearlyData) => -data.payment);
    if (isCategoryExpanded('financing')) {
        csvContent += addCsvRow('  Zinsanteil', (data: YearlyData) => -data.interest);
        csvContent += addCsvRow('  Tilgungsanteil', (data: YearlyData) => -data.principal);
        csvContent += addCsvRow('  Annuität (Rate)', (data: YearlyData) => -data.payment);
    }
    
    // 5. Cashflow vor Steuern (Cashflow before tax)
    csvContent += addCsvRow('Cashflow vor Steuern', (data: YearlyData) => data.cashflowBeforeTax);
    
    // 6. Abschreibungen & Steuern (Depreciation & tax)
    csvContent += addCsvRow('Abschreibungen & Steuern', (data: YearlyData) => -data.taxableIncome);
    if (isCategoryExpanded('tax')) {
        csvContent += addCsvRow('  Cashflow vor Steuern', (data: YearlyData) => data.cashflowBeforeTax);
        csvContent += addCsvRow('  Tilgungsanteil (nicht abzugsfähig)', (data: YearlyData) => data.principal);
        csvContent += addCsvRow('  AfA Gebäude', (data: YearlyData) => -data.buildingDepreciation);
        csvContent += addCsvRow('  AfA Möbel', (data: YearlyData) => -data.furnitureDepreciation);
        csvContent += addCsvRow('  Erhaltungsaufwand', (data: YearlyData) => -data.maintenanceDeduction);
        
        if (yearlyData.some(data => data.firstYearDeductibleCosts > 0)) {
        csvContent += addCsvRow('  Maklerkosten als Beratungsleistung', (data: YearlyData) => -data.firstYearDeductibleCosts);
        }
        
        csvContent += addCsvRow('  Ergebnis vor Steuer', (data: YearlyData) => data.taxableIncome);
    }
    
    // 7. Steuerersparnis (Tax savings)
    csvContent += addCsvRow('Steuerersparnis', (data: YearlyData) => data.taxSavings);
    if (isCategoryExpanded('tax-savings')) {
        csvContent += addCsvRow('  Zu versteuerndes Einkommen (ohne Immobilie)', (data: YearlyData) => data.previousIncome);
        csvContent += addCsvRow('  Zu versteuerndes Einkommen (mit Immobilie)', (data: YearlyData) => data.newTotalIncome);
        csvContent += addCsvRow('  Einkommensteuer (ohne Immobilie)', (data: YearlyData) => -data.previousTax);
        csvContent += addCsvRow('  Einkommensteuer (mit Immobilie)', (data: YearlyData) => -data.newTax);
        
        if (yearlyData.some(data => data.previousChurchTax > 0 || data.newChurchTax > 0)) {
        csvContent += addCsvRow('  Kirchensteuer (ohne Immobilie)', (data: YearlyData) => -data.previousChurchTax);
        csvContent += addCsvRow('  Kirchensteuer (mit Immobilie)', (data: YearlyData) => -data.newChurchTax);
        }
        
        csvContent += addCsvRow('  Gesamte Steuerersparnis', (data: YearlyData) => data.taxSavings);
    }
    
    // 8. Cashflow nach Steuern (Cashflow after tax)
    csvContent += addCsvRow('Cashflow nach Steuern', (data: YearlyData) => data.cashflow);
    
    // 9. Vermögenswerte (Assets)
    csvContent += addCsvRow('Vermögenswerte', (data: YearlyData) => data.equity);
    if (isCategoryExpanded('assets')) {
        csvContent += addCsvRow('  Immobilienwert', (data: YearlyData) => data.propertyValue);
        csvContent += addCsvRow('  Restschuld', (data: YearlyData) => -data.loanBalance);
        csvContent += addCsvRow('  Eigenkapital', (data: YearlyData) => data.equity);
        csvContent += addCsvRow('  Eigenkapitalrendite (%)', (data: YearlyData) => (data.cashflow / data.initialEquity * 100), true);
    }

    // Create and download CSV file
    downloadCsv(csvContent, 'immobilien-jahresuebersicht.csv');
    };

  const exportAllToCsv = () => {
    if (!yearlyData) return;

    // CSV-Inhalt erstellen
    let csvContent = 'Kategorie';
    
    // Jahre als Spaltenüberschriften
    for (let i = 0; i < calculationPeriod; i++) {
        csvContent += `;Jahr ${i + 1}`;
    }
    csvContent += '\n';
    
    // 1. Mieteinnahmen - immer alle Details einschließen
    csvContent += addCsvRow('Mieteinnahmen', (data: YearlyData) => data.rent);
    // Details immer einschließen, unabhängig vom aktuellen Zustand
    csvContent += addCsvRow('  Mieteinnahmen (brutto)', (data: YearlyData) => data.rent * 100/(100-data.vacancyRate));
    csvContent += addCsvRow('  Leerstand', (data: YearlyData) => -(data.rent * 100/(100-data.vacancyRate) - data.rent));
    csvContent += addCsvRow('  Effektive Mieteinnahmen', (data: YearlyData) => data.rent);
    
    // 2. Bewirtschaftungskosten - immer alle Details einschließen
    csvContent += addCsvRow('Bewirtschaftungskosten', (data: YearlyData) => -data.ongoingCosts);
    csvContent += addCsvRow('  Grundsteuer', (data: YearlyData) => -data.propertyTax);
    csvContent += addCsvRow('  Hausverwaltung', (data: YearlyData) => -data.managementFee);
    csvContent += addCsvRow('  Instandhaltungsrücklage', (data: YearlyData) => -data.maintenanceReserve);
    csvContent += addCsvRow('  Versicherungen', (data: YearlyData) => -data.insurance);
    csvContent += addCsvRow('  Gesamte Bewirtschaftungskosten', (data: YearlyData) => -data.ongoingCosts);
    
    // 3. Cashflow vor Finanzierung
    csvContent += addCsvRow('Cashflow vor Finanzierung', (data: YearlyData) => data.cashflowBeforeFinancing);
    
    // 4. Finanzierung - immer alle Details einschließen
    csvContent += addCsvRow('Finanzierung', (data: YearlyData) => -data.payment);
    csvContent += addCsvRow('  Zinsanteil', (data: YearlyData) => -data.interest);
    csvContent += addCsvRow('  Tilgungsanteil', (data: YearlyData) => -data.principal);
    csvContent += addCsvRow('  Annuität (Rate)', (data: YearlyData) => -data.payment);
    
    // 5. Cashflow vor Steuern
    csvContent += addCsvRow('Cashflow vor Steuern', (data: YearlyData) => data.cashflowBeforeTax);
    
    // 6. Abschreibungen & Steuern - immer alle Details einschließen
    csvContent += addCsvRow('Abschreibungen & Steuern', (data: YearlyData) => -data.taxableIncome);
    csvContent += addCsvRow('  Cashflow vor Steuern', (data: YearlyData) => data.cashflowBeforeTax);
    csvContent += addCsvRow('  Tilgungsanteil (nicht abzugsfähig)', (data: YearlyData) => data.principal);
    csvContent += addCsvRow('  AfA Gebäude', (data: YearlyData) => -data.buildingDepreciation);
    csvContent += addCsvRow('  AfA Möbel', (data: YearlyData) => -data.furnitureDepreciation);
    csvContent += addCsvRow('  Erhaltungsaufwand', (data: YearlyData) => -data.maintenanceDeduction);
    
    if (yearlyData.some(data => data.firstYearDeductibleCosts > 0)) {
        csvContent += addCsvRow('  Maklerkosten als Beratungsleistung', (data: YearlyData) => -data.firstYearDeductibleCosts);
    }
    
    csvContent += addCsvRow('  Ergebnis vor Steuer', (data: YearlyData) => data.taxableIncome);
    
    // 7. Steuerersparnis - immer alle Details einschließen
    csvContent += addCsvRow('Steuerersparnis', (data: YearlyData) => data.taxSavings);
    csvContent += addCsvRow('  Zu versteuerndes Einkommen (ohne Immobilie)', (data: YearlyData) => data.previousIncome);
    csvContent += addCsvRow('  Zu versteuerndes Einkommen (mit Immobilie)', (data: YearlyData) => data.newTotalIncome);
    csvContent += addCsvRow('  Einkommensteuer (ohne Immobilie)', (data: YearlyData) => -data.previousTax);
    csvContent += addCsvRow('  Einkommensteuer (mit Immobilie)', (data: YearlyData) => -data.newTax);
    
    if (yearlyData.some(data => data.previousChurchTax > 0 || data.newChurchTax > 0)) {
        csvContent += addCsvRow('  Kirchensteuer (ohne Immobilie)', (data: YearlyData) => -data.previousChurchTax);
        csvContent += addCsvRow('  Kirchensteuer (mit Immobilie)', (data: YearlyData) => -data.newChurchTax);
    }
    
    csvContent += addCsvRow('  Gesamte Steuerersparnis', (data: YearlyData) => data.taxSavings);
    
    // 8. Cashflow nach Steuern
    csvContent += addCsvRow('Cashflow nach Steuern', (data: YearlyData) => data.cashflow);
    
    // 9. Vermögenswerte - immer alle Details einschließen
    csvContent += addCsvRow('Vermögenswerte', (data: YearlyData) => data.equity);
    csvContent += addCsvRow('  Immobilienwert', (data: YearlyData) => data.propertyValue);
    csvContent += addCsvRow('  Restschuld', (data: YearlyData) => -data.loanBalance);
    csvContent += addCsvRow('  Eigenkapital', (data: YearlyData) => data.equity);
    csvContent += addCsvRow('  Eigenkapitalrendite (%)', (data: YearlyData) => (data.cashflow / data.initialEquity * 100), true);

    // CSV-Datei erstellen und herunterladen
    downloadCsv(csvContent, 'immobilien-jahresuebersicht-vollstaendig.csv');
    };

  // Helper function to add a row to the CSV content
  const addCsvRow = (
    label: string, 
    valueFunction: (data: YearlyData) => number, 
    isPercentage: boolean = false
  ): string => {
    let rowContent = label;
    
    yearlyData.forEach((data) => {
      const value = valueFunction(data);
      
      if (isPercentage) {
        rowContent += ';' + value.toFixed(2).replace('.', ',') + '%';
      } else {
        rowContent += ';' + value.toFixed(2).replace('.', ',');
      }
    });
    
    return rowContent + '\n';
  };

  // Helper function to download CSV
  const downloadCsv = (content: string, filename: string) => {
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + content);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Check if broker consulting costs exist in any of the yearly data
  const hasAnyBrokerConsultingCosts = yearlyData.some(data => data.firstYearDeductibleCosts > 0);
  
  return (
    <Card p="md" withBorder>
      <Group position="apart" mb="md">
        <Title order={2}>{title}</Title>
      </Group>
      
      <Group position="apart" mb="sm">
        <Button.Group>
            <Button 
            variant="light"
            onClick={exportToCsv}
            >
            CSV Export (aktuelle Ansicht)
            </Button>
            <Button 
            variant="light"
            onClick={exportAllToCsv}
            >
            Vollständiger CSV Export
            </Button>
            <Button 
            variant="light"
            onClick={expandAll}
            >
            Alle aufklappen
            </Button>
            <Button 
            variant="light"
            onClick={collapseAll}
            >
            Alle zuklappen
            </Button>
        </Button.Group>
        </Group>
      
      <div style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th style={{ minWidth: '200px' }}>Kategorie</th>
              {pageData.map((data) => (
                <th key={data.year} style={{ minWidth: '120px', textAlign: 'right' }}>Jahr {data.year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 1. Mieteinnahmen */}
            <tr style={{ backgroundColor: '#f9f9f9', cursor: 'pointer' }} onClick={() => toggleCategory('income')}>
              <td>
                <Group spacing="xs">
                  <span>{isCategoryExpanded('income') ? '▼' : '▶'}</span>
                  <b>Mieteinnahmen</b>
                </Group>
              </td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.rent > 0 ? 'green' : 'inherit' }}>
                  {formatCurrency(data.rent)}
                </td>
              ))}
            </tr>
            {isCategoryExpanded('income') && (
              <>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Mieteinnahmen (brutto)</td>
                  {pageData.map((data, index) => {
                    const grossRent = data.rent * 100/(100-data.vacancyRate);
                    return (
                      <td key={index} style={{ textAlign: 'right' }}>
                        {formatCurrency(grossRent)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Leerstand</td>
                  {pageData.map((data, index) => {
                    const grossRent = data.rent * 100/(100-data.vacancyRate);
                    const vacancy = -(grossRent - data.rent);
                    return (
                      <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                        {formatCurrency(vacancy)}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Effektive Mieteinnahmen</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: data.rent > 0 ? 'green' : 'inherit' }}>
                      {formatCurrency(data.rent)}
                    </td>
                  ))}
                </tr>
              </>
            )}
            
            {/* 2. Bewirtschaftungskosten */}
            <tr style={{ backgroundColor: '#f9f9f9', cursor: 'pointer' }} onClick={() => toggleCategory('costs')}>
              <td>
                <Group spacing="xs">
                  <span>{isCategoryExpanded('costs') ? '▼' : '▶'}</span>
                  <b>Bewirtschaftungskosten</b>
                </Group>
              </td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.ongoingCosts < 0 ? 'green' : 'red' }}>
                  {formatCurrency(-data.ongoingCosts)}
                </td>
              ))}
            </tr>
            {isCategoryExpanded('costs') && (
              <>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Grundsteuer</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.propertyTax)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Hausverwaltung</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.managementFee)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Instandhaltungsrücklage</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.maintenanceReserve)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Versicherungen</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.insurance)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Gesamte Bewirtschaftungskosten</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.ongoingCosts)}
                    </td>
                  ))}
                </tr>
              </>
            )}
            
            {/* 3. Cashflow vor Finanzierung */}
            <tr style={{ borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', backgroundColor: '#eaf2f8' }}>
              <td><b>Cashflow vor Finanzierung</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.cashflowBeforeFinancing >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(data.cashflowBeforeFinancing)}
                </td>
              ))}
            </tr>
            
            {/* 4. Finanzierung */}
            <tr style={{ backgroundColor: '#f9f9f9', cursor: 'pointer' }} onClick={() => toggleCategory('financing')}>
              <td>
                <Group spacing="xs">
                  <span>{isCategoryExpanded('financing') ? '▼' : '▶'}</span>
                  <b>Finanzierung</b>
                </Group>
              </td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.payment < 0 ? 'green' : 'red' }}>
                  {formatCurrency(-data.payment)}
                </td>
              ))}
            </tr>
            {isCategoryExpanded('financing') && (
              <>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Zinsanteil</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.interest)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Tilgungsanteil</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.principal)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Annuität (Rate)</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.payment)}
                    </td>
                  ))}
                </tr>
              </>
            )}
            
            {/* 5. Cashflow vor Steuern */}
            <tr style={{ borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', backgroundColor: '#eaf2f8' }}>
              <td><b>Cashflow vor Steuern</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.cashflowBeforeTax >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(data.cashflowBeforeTax)}
                </td>
              ))}
            </tr>
            
            {/* 6. Abschreibungen & Steuern */}
            <tr style={{ backgroundColor: '#f9f9f9', cursor: 'pointer' }} onClick={() => toggleCategory('tax')}>
              <td>
                <Group spacing="xs">
                  <span>{isCategoryExpanded('tax') ? '▼' : '▶'}</span>
                  <b>Abschreibungen & Steuern</b>
                </Group>
              </td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                  {formatCurrency(-data.taxableIncome)}
                </td>
              ))}
            </tr>
            {isCategoryExpanded('tax') && (
              <>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Cashflow vor Steuern</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: data.cashflowBeforeTax >= 0 ? 'green' : 'red' }}>
                      {formatCurrency(data.cashflowBeforeTax)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Tilgungsanteil (nicht abzugsfähig)</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'green' }}>
                      {formatCurrency(data.principal)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>AfA Gebäude</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(-data.buildingDepreciation)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>AfA Möbel</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(-data.furnitureDepreciation)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Erhaltungsaufwand</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(-data.maintenanceDeduction)}
                    </td>
                  ))}
                </tr>
                
                {/* Display Maklerkosten als Beratungsleistung row if applicable */}
                {hasAnyBrokerConsultingCosts && (
                  <tr>
                    <td style={{ paddingLeft: 30 }}>Maklerkosten als Beratungsleistung</td>
                    {pageData.map((data, index) => (
                      <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                        {formatCurrency(-data.firstYearDeductibleCosts)}
                      </td>
                    ))}
                  </tr>
                )}
                
                <tr>
                  <td style={{ paddingLeft: 30, borderTop: '1px solid #eee' }}>Ergebnis vor Steuer</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', borderTop: '1px solid #eee' }}>
                      {formatCurrency(data.taxableIncome)}
                    </td>
                  ))}
                </tr>
              </>
            )}
            
            {/* 7. Steuerersparnis - Machen wir jetzt aufklappbar */}
            <tr style={{ borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', backgroundColor: '#eaf2f8', cursor: 'pointer' }} onClick={() => toggleCategory('tax-savings')}>
            <td>
                <Group spacing="xs">
                <span>{isCategoryExpanded('tax-savings') ? '▼' : '▶'}</span>
                <b>Steuerersparnis</b>
                </Group>
            </td>
            {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.taxSavings >= 0 ? 'green' : 'red' }}>
                {formatCurrency(data.taxSavings)}
                </td>
            ))}
            </tr>
            {isCategoryExpanded('tax-savings') && (
            <>
                <tr>
                <td style={{ paddingLeft: 30 }}>Zu versteuerndes Einkommen (ohne Immobilie)</td>
                {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right' }}>
                    {formatCurrency(data.previousIncome)}
                    </td>
                ))}
                </tr>
                <tr>
                <td style={{ paddingLeft: 30 }}>Zu versteuerndes Einkommen (mit Immobilie)</td>
                {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right' }}>
                    {formatCurrency(data.newTotalIncome)}
                    </td>
                ))}
                </tr>
                <tr>
                <td style={{ paddingLeft: 30 }}>Einkommensteuer (ohne Immobilie)</td>
                {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                    {formatCurrency(data.previousTax)}
                    </td>
                ))}
                </tr>
                <tr>
                <td style={{ paddingLeft: 30 }}>Einkommensteuer (mit Immobilie)</td>
                {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                    {formatCurrency(data.newTax)}
                    </td>
                ))}
                </tr>
                {pageData.some(data => data.previousChurchTax > 0 || data.newChurchTax > 0) && (
                <>
                    <tr>
                    <td style={{ paddingLeft: 30 }}>Kirchensteuer (ohne Immobilie)</td>
                    {pageData.map((data, index) => (
                        <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                        {formatCurrency(data.previousChurchTax)}
                        </td>
                    ))}
                    </tr>
                    <tr>
                    <td style={{ paddingLeft: 30 }}>Kirchensteuer (mit Immobilie)</td>
                    {pageData.map((data, index) => (
                        <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                        {formatCurrency(data.newChurchTax)}
                        </td>
                    ))}
                    </tr>
                </>
                )}
                <tr>
                <td style={{ paddingLeft: 30 }}>Gesamte Steuerersparnis</td>
                {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: data.taxSavings >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                    {formatCurrency(data.taxSavings)}
                    </td>
                ))}
                </tr>
            </>
            )}
            
            {/* 8. Cashflow nach Steuern */}
            <tr style={{ borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', backgroundColor: '#eaf2f8' }}>
              <td><b>Cashflow nach Steuern</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.cashflow >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                  {formatCurrency(data.cashflow)}
                </td>
              ))}
            </tr>
            
            {/* 9. Vermögenswerte */}
            <tr style={{ backgroundColor: '#f9f9f9', cursor: 'pointer' }} onClick={() => toggleCategory('assets')}>
              <td>
                <Group spacing="xs">
                  <span>{isCategoryExpanded('assets') ? '▼' : '▶'}</span>
                  <b>Vermögenswerte</b>
                </Group>
              </td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.equity >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(data.equity)}
                </td>
              ))}
            </tr>
            {isCategoryExpanded('assets') && (
              <>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Immobilienwert</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right' }}>
                      {formatCurrency(data.propertyValue)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Restschuld</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: data.loanBalance > 0 ? 'red' : 'inherit' }}>
                      {formatCurrency(data.loanBalance)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Eigenkapital</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: data.equity >= 0 ? 'green' : 'red' }}>
                      {formatCurrency(data.equity)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Eigenkapitalrendite (bezogen auf Anfangsinvestition)</td>
                  {pageData.map((data, index) => {
                    const roi = data.initialEquity > 0 ? (data.cashflow / data.initialEquity) * 100 : 0;
                    return (
                      <td key={index} style={{ textAlign: 'right', color: roi >= 0 ? 'green' : 'red' }}>
                        {roi.toFixed(2)} %
                      </td>
                    );
                  })}
                </tr>
              </>
            )}
          </tbody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <Group position="center" mt="md">
          <Pagination
            value={currentPage}
            onChange={setCurrentPage}
            total={totalPages}
            />
        </Group>
      )}
      
      <Card mt="lg" withBorder p="md">
        <Title order={4} mb="sm">Zusammenfassung</Title>
        <Group grow>
          <div>
            <Text size="sm" color="dimmed">Durchschnittlicher jährlicher Cashflow:</Text>
            <Text>
              {formatCurrency(
                yearlyData.reduce((sum, data) => sum + data.cashflow, 0) / calculationPeriod
              )}
            </Text>
          </div>
          
          <div>
            <Text size="sm" color="dimmed">Eigenkapitalentwicklung:</Text>
            <Text>
              {formatCurrency(yearlyData[calculationPeriod - 1].equity - yearlyData[0].initialEquity)}
            </Text>
          </div>
          
          <div>
            <Text>
              {(
                (Math.pow(
                  yearlyData[calculationPeriod - 1].equity / yearlyData[0].initialEquity,
                  1 / calculationPeriod
                ) - 1) * 100
              ).toFixed(2)} %
            </Text>
          </div>
        </Group>
      </Card>
    </Card>
  );
}