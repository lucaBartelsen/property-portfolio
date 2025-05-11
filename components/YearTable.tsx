// src/components/YearTable.tsx
import { useState } from 'react';
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
  
  // Wenn combined, berechne kombinierte Ergebnisse, falls noch nicht vorhanden
  if (combined && !state.combinedResults) {
    dispatch({ type: 'CALCULATE_COMBINED_RESULTS' });
  }
  
  // Hole die jährlichen Daten
  const yearlyData = combined 
    ? state.combinedResults?.yearlyData 
    : property?.yearlyData;
  
  // Wenn keine Daten vorhanden sind
  if (!yearlyData || yearlyData.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Text align="center">Keine Daten vorhanden. Bitte führen Sie zuerst die Berechnungen durch.</Text>
      </Paper>
    );
  }
  
  // Komponententitel
  const title = combined 
    ? "Gesamtjahrestabelle aller Immobilien" 
    : `Jahrestabelle: ${property?.name}`;
  
  // Kalkulationsperiode ermitteln
  const calculationPeriod = yearlyData.length;
  
  // Daten für die aktuelle Seite
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, calculationPeriod);
  const pageData = yearlyData.slice(startIndex, endIndex);
  
  // Anzahl der Seiten berechnen
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
            
            {/* Abschreibungen & Steuern (vereinfacht) */}
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
                  {pageData.map((data, index) => (
                    <td key={index} style={{ color: (data.cashflow / data.initialEquity) * 100 >= 0 ? 'green' : 'red' }}>
                      {((data.cashflow / data.initialEquity) * 100).toFixed(2)} %
                    </td>
                  ))}
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