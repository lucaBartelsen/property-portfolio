// src/components/CashflowChart.tsx
import { useEffect, useMemo } from 'react';
import { Card, Title, Button, Group, Text, Paper } from '@mantine/core';
import { usePropertyStore } from '../store/PropertyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Property, YearlyData, TaxInfo } from '../lib/types';
import { formatCurrency } from '../lib/utils/formatters';
import { calculateCashflow } from '../lib/calculators/cashflowCalculator';
import { calculatePurchase } from '../lib/calculators/purchaseCalculator';
import { calculateOngoing } from '../lib/calculators/ongoingCalculator';
import { calculateChurchTax, calculateGermanIncomeTax } from '@/lib/calculators/taxCalculator';

interface CashflowChartProps {
  property?: Property;
  combined?: boolean;
  onBack?: () => void;
}

export default function CashflowChart({ property, combined, onBack }: CashflowChartProps) {
  const { state, dispatch } = usePropertyStore();
  
  // Calculate yearly data on-demand
  const { yearlyData, results } = useMemo(() => {
    // For combined view
    if (combined) {
      const calculationPeriod = 10; // Standard period
      
      // Don't proceed if there are no properties
      if (state.properties.length === 0) {
        return { yearlyData: null, results: null };
      }
      
      // Initialize arrays for combined results
      const combinedYearlyData: YearlyData[] = Array(calculationPeriod).fill(0).map((_, index) => ({
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
        previousIncome: state.taxInfo.annualIncome, // Set the base income for all years
        previousTax: calculateGermanIncomeTax(state.taxInfo.annualIncome, state.taxInfo.taxStatus), // Calculate tax for all years
        previousChurchTax: state.taxInfo.hasChurchTax ? 
          calculateChurchTax(
            calculateGermanIncomeTax(state.taxInfo.annualIncome, state.taxInfo.taxStatus),
            state.taxInfo.hasChurchTax, 
            state.taxInfo.churchTaxRate
          ) : 0, // Calculate church tax for all years
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
      }));
      
      // Combined calculation results
      const combinedResults = {
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
      
      // For storing the combined taxable income from all properties
      let combinedTaxableIncome: number[] = Array(calculationPeriod).fill(0);
      
      // Calculate fresh data for each property and add to combined results
      state.properties.forEach(propertyItem => {
        // Calculate fresh data for this property
        const propertyData = calculatePropertyData(propertyItem, state.taxInfo);
        
        if (propertyData.yearlyData && propertyData.results) {
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
      
      // Recalculate tax information for each year
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

      
      return { yearlyData: combinedYearlyData, results: combinedResults };
    } 
    // For single property view
    else if (property) {
      return calculatePropertyData(property, state.taxInfo);
    }
    
    return { yearlyData: null, results: null };
  }, [combined, property, state.properties, state.taxInfo]);
  
  // Helper function to calculate data for a single property
  function calculatePropertyData(propertyItem: Property, taxInfo: TaxInfo): { yearlyData: YearlyData[] | null, results: any | null } {
    try {
      // Calculate purchase and ongoing data first
      const purchaseData = calculatePurchase(propertyItem);
      const ongoingData = calculateOngoing(propertyItem);
      
      // Then calculate cashflow with these fresh values
      const { results, yearlyData } = calculateCashflow(
        { ...propertyItem, purchaseData, ongoingData },
        taxInfo,
        10 // Standard calculation period
      );
      
      return { yearlyData, results };
    } catch (error) {
      console.error("Error calculating property data:", error);
      return { yearlyData: null, results: null };
    }
  }
  
  // Component title
  const title = combined 
    ? "Gesamtcashflow aller Immobilien" 
    : `Cashflow: ${property?.name}`;
  
  // If no data is available, show a message
  if (!yearlyData || yearlyData.length === 0 || !results) {
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
  
  // Prepare data for the chart
  const chartData = yearlyData.map(data => ({
    year: `Jahr ${data.year}`,
    cashflow: data.cashflow,
    propertyValue: data.propertyValue,
    equity: data.equity,
    loanBalance: data.loanBalance
  }));
  
  // Get calculation period
  const calculationPeriod = yearlyData.length;
  
  return (
    <Card p="md" withBorder>
      <Group position="apart" mb="md">
        <Title order={2}>{title}</Title>
      </Group>
      
      {results && (
        <Group mb="lg" grow>
          <Card withBorder p="sm">
            <Text size="sm" color="dimmed">Monatlicher Cashflow</Text>
            <Text size="xl" weight={700} color={results.monthlyCashflow >= 0 ? "green" : "red"}>
              {formatCurrency(results.monthlyCashflow)}
            </Text>
          </Card>
          <Card withBorder p="sm">
            <Text size="sm" color="dimmed">Jährlicher Cashflow</Text>
            <Text size="xl" weight={700} color={results.monthlyCashflow * 12 >= 0 ? "green" : "red"}>
              {formatCurrency(results.monthlyCashflow * 12)}
            </Text>
          </Card>
          <Card withBorder p="sm">
            <Text size="sm" color="dimmed">ROI</Text>
            <Text size="xl" weight={700}>
              {((results.monthlyCashflow * 12 / results.initialEquity) * 100).toFixed(2)} %
            </Text>
          </Card>
        </Group>
      )}
      
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label) => `${label}`}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cashflow"
              name="Jährlicher Cashflow"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="propertyValue"
              name="Immobilienwert"
              stroke="#82ca9d"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="equity"
              name="Eigenkapital"
              stroke="#ffc658"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="loanBalance"
              name="Restschuld"
              stroke="#ff7300"
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {yearlyData.length > 0 && (
        <Card mt="lg" withBorder p="md">
          <Title order={4} mb="sm">Cashflow-Details für das erste Jahr</Title>
          <Group grow>
            <div>
              <Text size="sm" color="dimmed">Mieteinnahmen:</Text>
              <Text>{formatCurrency(yearlyData[0].rent)}</Text>
              
              <Text size="sm" color="dimmed" mt="sm">Laufende Kosten:</Text>
              <Text>{formatCurrency(yearlyData[0].ongoingCosts)}</Text>
              
              <Text size="sm" color="dimmed" mt="sm">Finanzierungskosten:</Text>
              <Text>{formatCurrency(yearlyData[0].payment)}</Text>
            </div>
            
            <div>
              <Text size="sm" color="dimmed">Cashflow vor Steuern:</Text>
              <Text>{formatCurrency(yearlyData[0].cashflowBeforeTax)}</Text>
              
              <Text size="sm" color="dimmed" mt="sm">Steuerersparnis:</Text>
              <Text>{formatCurrency(yearlyData[0].taxSavings)}</Text>
              
              <Text size="sm" color="dimmed" mt="sm">Cashflow nach Steuern:</Text>
              <Text weight={700} color={yearlyData[0].cashflow >= 0 ? "green" : "red"}>
                {formatCurrency(yearlyData[0].cashflow)}
              </Text>
            </div>
          </Group>
        </Card>
      )}
    </Card>
  );
}