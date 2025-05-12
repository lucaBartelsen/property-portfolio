// src/components/YearTable.tsx
import { useState, useEffect } from 'react';
import { Card, Title, Button, Group, Text, Paper, Table, Switch, Pagination } from '@mantine/core';
import { usePropertyStore } from '../store/PropertyContext';
import { Property } from '../lib/types';
import { formatCurrency } from '../lib/utils/formatters';

interface YearTableProps {
  property?: Property;
  combined?: boolean;
  onBack?: () => void;
}

export default function YearTable({ property, combined, onBack }: YearTableProps) {
  const { state, dispatch } = usePropertyStore();
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
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
        <Switch
          label="Alle Spalten anzeigen"
          checked={showAllColumns}
          onChange={(event) => setShowAllColumns(event.currentTarget.checked)}
        />
        
        <Button.Group>
          <Button variant="light" compact>Als CSV exportieren</Button>
          <Button variant="light" compact>Alle aufklappen</Button>
          <Button variant="light" compact>Alle zuklappen</Button>
        </Button.Group>
      </Group>
      
      <div style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Kategorie</th>
              {pageData.map((data) => (
                <th key={data.year}>Jahr {data.year}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Mieteinnahmen */}
            <tr>
              <td><b>Mieteinnahmen</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ color: data.rent > 0 ? 'green' : 'inherit' }}>
                  {formatCurrency(data.rent)}
                </td>
              ))}
            </tr>
            
            {/* Bewirtschaftungskosten */}
            <tr>
              <td><b>Bewirtschaftungskosten</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ color: data.ongoingCosts < 0 ? 'green' : 'red' }}>
                  {formatCurrency(-data.ongoingCosts)}
                </td>
              ))}
            </tr>
            
            {/* Cashflow vor Finanzierung */}
            <tr>
              <td><b>Cashflow vor Finanzierung</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ color: data.cashflowBeforeFinancing >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(data.cashflowBeforeFinancing)}
                </td>
              ))}
            </tr>
            
            {/* Finanzierung */}
            <tr>
              <td><b>Finanzierung</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ color: data.payment < 0 ? 'green' : 'red' }}>
                  {formatCurrency(-data.payment)}
                </td>
              ))}
            </tr>
            
            {/* Cashflow vor Steuern */}
            <tr>
              <td><b>Cashflow vor Steuern</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ color: data.cashflowBeforeTax >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(data.cashflowBeforeTax)}
                </td>
              ))}
            </tr>
            
            {/* Steuerersparnis */}
            <tr>
              <td><b>Steuerersparnis</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ color: data.taxSavings >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(data.taxSavings)}
                </td>
              ))}
            </tr>
            
            {/* Cashflow nach Steuern */}
            <tr>
              <td><b>Cashflow nach Steuern</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ color: data.cashflow >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                  {formatCurrency(data.cashflow)}
                </td>
              ))}
            </tr>
            
            {/* Vermögenswerte */}
            <tr>
              <td><b>Vermögenswerte</b></td>
              {pageData.map((data, index) => (
                <td key={index} style={{ color: data.equity >= 0 ? 'green' : 'red' }}>
                  {formatCurrency(data.equity)}
                </td>
              ))}
            </tr>
            
            {showAllColumns && (
              <>
                {/* Immobilienwert */}
                <tr>
                  <td>Immobilienwert</td>
                  {pageData.map((data, index) => (
                    <td key={index}>{formatCurrency(data.propertyValue)}</td>
                  ))}
                </tr>
                
                {/* Restschuld */}
                <tr>
                  <td>Restschuld</td>
                  {pageData.map((data, index) => (
                    <td key={index} style={{ color: data.loanBalance > 0 ? 'red' : 'inherit' }}>
                      {formatCurrency(data.loanBalance)}
                    </td>
                  ))}
                </tr>
                
                {/* Eigenkapitalrendite */}
                <tr>
                  <td>Eigenkapitalrendite (%)</td>
                  {pageData.map((data, index) => {
                    const roi = data.initialEquity > 0 ? (data.cashflow / data.initialEquity) * 100 : 0;
                    return (
                      <td key={index} style={{ color: roi >= 0 ? 'green' : 'red' }}>
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