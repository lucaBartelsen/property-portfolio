// src/components/YearTable.tsx
import { useState, useEffect } from 'react';
import { Card, Title, Button, Group, Text, Paper, Table, Pagination } from '@mantine/core';
import { usePropertyStore } from '../store/PropertyContext';
import { Property, YearlyData } from '../lib/types';
import { formatCurrency } from '../lib/utils/formatters';

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
  
  // Calculate data if it doesn't exist yet
  useEffect(() => {
    // If in combined mode and there are no results yet, trigger calculation
    if (combined && !state.combinedResults) {
      dispatch({ type: 'CALCULATE_COMBINED_RESULTS' });
    }
    
    // If looking at a specific property and it has no data, trigger calculation
    if (property && (!property.calculationResults || !property.yearlyData)) {
      // Update the property to trigger recalculation
      dispatch({ type: 'UPDATE_PROPERTY', property });
    }
  }, [combined, property, state.combinedResults, dispatch]);
  
  // Get yearly data based on mode (combined or single property)
  const yearlyData = combined 
    ? state.combinedResults?.yearlyData 
    : property?.yearlyData;
  
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
        <Text align="center">Keine Daten vorhanden. Bitte führen Sie zuerst die Berechnungen durch.</Text>
        <Button fullWidth mt="md" onClick={() => dispatch({ type: 'CALCULATE_COMBINED_RESULTS' })}>
          Berechnungen durchführen
        </Button>
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
    setExpandedCategories(['income', 'costs', 'financing', 'tax', 'assets']);
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
    
    // Add data rows
    
    // 1. Rent income
    csvContent += addCsvRow('Mieteinnahmen', (data: YearlyData) => data.rent);
    csvContent += addCsvRow('  Mieteinnahmen (brutto)', (data: YearlyData) => data.rent * 100/(100-data.vacancyRate));
    csvContent += addCsvRow('  Leerstand', (data: YearlyData) => -(data.rent * 100/(100-data.vacancyRate) - data.rent));
    csvContent += addCsvRow('  Effektive Mieteinnahmen', (data: YearlyData) => data.rent);
    
    // 2. Operating costs
    csvContent += addCsvRow('Bewirtschaftungskosten', (data: YearlyData) => data.ongoingCosts);
    csvContent += addCsvRow('  Grundsteuer', (data: YearlyData) => data.propertyTax);
    csvContent += addCsvRow('  Hausverwaltung', (data: YearlyData) => data.managementFee);
    csvContent += addCsvRow('  Instandhaltungsrücklage', (data: YearlyData) => data.maintenanceReserve);
    csvContent += addCsvRow('  Versicherungen', (data: YearlyData) => data.insurance);
    
    // 3. Cashflow before financing
    csvContent += addCsvRow('Cashflow vor Finanzierung', (data: YearlyData) => data.cashflowBeforeFinancing);
    
    // 4. Financing
    csvContent += addCsvRow('Finanzierung', (data: YearlyData) => data.payment);
    csvContent += addCsvRow('  Zinsanteil', (data: YearlyData) => data.interest);
    csvContent += addCsvRow('  Tilgungsanteil', (data: YearlyData) => data.principal);
    
    // 5. Cashflow before tax
    csvContent += addCsvRow('Cashflow vor Steuern', (data: YearlyData) => data.cashflowBeforeTax);
    
    // 6. Depreciation & tax
    csvContent += addCsvRow('Abschreibungen & Steuern', (data: YearlyData) => data.totalDepreciation);
    csvContent += addCsvRow('  AfA Gebäude', (data: YearlyData) => data.buildingDepreciation);
    csvContent += addCsvRow('  AfA Möbel', (data: YearlyData) => data.furnitureDepreciation);
    csvContent += addCsvRow('  Erhaltungsaufwand', (data: YearlyData) => data.maintenanceDeduction);
    csvContent += addCsvRow('  Ergebnis vor Steuern', (data: YearlyData) => data.taxableIncome);
    csvContent += addCsvRow('  Zu versteuerndes Einkommen (vorher)', (data: YearlyData) => data.previousIncome);
    csvContent += addCsvRow('  Neues zu versteuerndes Gesamteinkommen', (data: YearlyData) => data.newTotalIncome);
    csvContent += addCsvRow('  Einkommensteuer (vorher)', (data: YearlyData) => data.previousTax);
    csvContent += addCsvRow('  Einkommensteuer (nachher)', (data: YearlyData) => data.newTax);
    csvContent += addCsvRow('  Kirchensteuer (vorher)', (data: YearlyData) => data.previousChurchTax);
    csvContent += addCsvRow('  Kirchensteuer (nachher)', (data: YearlyData) => data.newChurchTax);
    
    // 7. Tax savings
    csvContent += addCsvRow('Steuerersparnis', (data: YearlyData) => data.taxSavings);
    
    // 8. Cashflow after tax
    csvContent += addCsvRow('Cashflow nach Steuern', (data: YearlyData) => data.cashflow);
    
    // 9. Assets
    csvContent += addCsvRow('Vermögenswerte', (data: YearlyData) => data.equity);
    csvContent += addCsvRow('  Immobilienwert', (data: YearlyData) => data.propertyValue);
    csvContent += addCsvRow('  Restschuld', (data: YearlyData) => data.loanBalance);
    csvContent += addCsvRow('  Eigenkapital', (data: YearlyData) => data.equity);
    csvContent += addCsvRow('  Eigenkapitalrendite (%)', (data: YearlyData) => (data.cashflow / data.initialEquity * 100), true);

    // Create and download CSV file
    downloadCsv(csvContent, 'immobilien-jahresuebersicht.csv');
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
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Zurück
          </Button>
        )}
      </Group>
      
      <Group position="apart" mb="sm">
        
        <Button.Group>
          <Button 
            variant="light"
            onClick={exportToCsv}
          >
            CSV Export
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
                  {formatCurrency(-data.totalDepreciation)}
                </td>
              ))}
            </tr>
            {isCategoryExpanded('tax') && (
              <>
                <tr>
                  <td style={{ paddingLeft: 30 }}>AfA Gebäude</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.buildingDepreciation)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>AfA Möbel</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.furnitureDepreciation)}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ paddingLeft: 30 }}>Erhaltungsaufwand</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                      {formatCurrency(data.maintenanceDeduction)}
                    </td>
                  ))}
                </tr>
                
                {/* Display Maklerkosten als Beratungsleistung row if applicable */}
                {hasAnyBrokerConsultingCosts && (
                  <tr>
                    <td style={{ paddingLeft: 30 }}>Maklerkosten als Beratungsleistung</td>
                    {pageData.map((data, index) => (
                      <td key={index} style={{ textAlign: 'right', color: 'red' }}>
                        {formatCurrency(data.firstYearDeductibleCosts)}
                      </td>
                    ))}
                  </tr>
                )}
              </>
            )}
            
            {/* 7. Steuerersparnis */}
            <tr style={{ borderTop: '2px solid #ddd', borderBottom: '2px solid #ddd', backgroundColor: '#eaf2f8' }}>
              <td><b>Steuerersparnis</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ textAlign: 'right', color: data.taxSavings >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(data.taxSavings)}
                </td>
              ))}
            </tr>
            
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
            page={currentPage}
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
            <Text size="sm" color="dimmed">Durchschnittliche Rendite p.a.:</Text>
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