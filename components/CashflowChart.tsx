// src/components/CashflowChart.tsx
import { Card, Title, Button, Group, Text, Paper } from '@mantine/core';
import { usePropertyStore } from '../store/PropertyContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Property } from '../lib/types';
import { formatCurrency } from '../lib/utils/formatters';
import { useEffect } from 'react';

interface CashflowChartProps {
  property?: Property;
  combined?: boolean;
  onBack?: () => void;
}

export default function CashflowChart({ property, combined, onBack }: CashflowChartProps) {
  const { state, dispatch } = usePropertyStore();
  
  // Calculate cashflow data if not already calculated
  useEffect(() => {
    // If combined mode is active, calculate combined results if they don't exist
    if (combined && !state.combinedResults) {
      dispatch({ type: 'CALCULATE_COMBINED_RESULTS' });
    }
    
    // If looking at a specific property and it doesn't have results yet, trigger calculation
    if (property && (!property.calculationResults || !property.yearlyData)) {
      // We need to dispatch a calculation for this specific property
      // The simplest way is to update the property which will trigger recalculation
      dispatch({ type: 'UPDATE_PROPERTY', property });
    }
  }, [combined, property, state.combinedResults, dispatch]);
  
  // Get yearly data based on mode (combined or single property)
  const yearlyData = combined 
    ? state.combinedResults?.yearlyData 
    : property?.yearlyData;
  
  // If no data is available, show a message
  if (!yearlyData || yearlyData.length === 0) {
    return (
      <Paper p="xl" withBorder>
        <Group position="apart" mb="md">
          <Title order={2}>{combined ? "Gesamtcashflow aller Immobilien" : `Cashflow: ${property?.name}`}</Title>
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
  
  // Prepare data for the chart
  const chartData = yearlyData.map(data => ({
    year: `Jahr ${data.year}`,
    cashflow: data.cashflow,
    propertyValue: data.propertyValue,
    equity: data.equity,
    loanBalance: data.loanBalance
  }));
  
  // Component title
  const title = combined 
    ? "Gesamtcashflow aller Immobilien" 
    : `Cashflow: ${property?.name}`;
  
  // Get calculation results
  const results = combined 
    ? state.combinedResults?.calculationResults 
    : property?.calculationResults;
  
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