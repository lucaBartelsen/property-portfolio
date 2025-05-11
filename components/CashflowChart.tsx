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
  
  // Verwende useEffect für den Dispatch statt direkt beim Rendern
  useEffect(() => {
    // Wenn combined, berechne kombinierte Ergebnisse, falls noch nicht vorhanden
    if (combined && !state.combinedResults) {
      dispatch({ type: 'CALCULATE_COMBINED_RESULTS' });
    }
  }, [combined, state.combinedResults, dispatch]);
  
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
  
  // Daten für das Diagramm vorbereiten
  const chartData = yearlyData.map(data => ({
    year: `Jahr ${data.year}`,
    cashflow: data.cashflow,
    propertyValue: data.propertyValue,
    equity: data.equity,
    loanBalance: data.loanBalance
  }));
  
  // Komponententitel
  const title = combined 
    ? "Gesamtcashflow aller Immobilien" 
    : `Cashflow: ${property?.name}`;
  
  // Hole die Berechnungsergebnisse
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
    </Card>
  );
}