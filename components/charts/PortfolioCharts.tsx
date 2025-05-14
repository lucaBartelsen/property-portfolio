// components/charts/PortfolioCharts.tsx
import { useState } from 'react';
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
  Tabs,
  Grid,
  Card,
  SimpleGrid,
  Text,
  Progress,
  Divider
} from '@mantine/core';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import CashflowChart from '../CashflowChart';
import YearTable from '../YearTable';
import { formatCurrency } from '../../lib/utils/formatters';
import { Property, PortfolioStats } from '../../lib/types';
import { useRouter } from 'next/router';

// Define color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface PortfolioChartsProps {
  properties: Property[];
  portfolioStats: PortfolioStats;
  title: string;
  onAddProperty?: () => void;
  dataLoaded: boolean;
  navigateBack?: () => void;
  showDetailButtons?: boolean;
  portfolioId?: string;
}

export function PortfolioCharts({
  properties,
  portfolioStats,
  title,
  onAddProperty,
  dataLoaded,
  navigateBack,
  showDetailButtons = true,
  portfolioId
}: PortfolioChartsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();

  // Prepare pie chart data for value distribution (Equity vs Debt)
  const valueDistributionData = [
    { name: 'Eigenkapital', value: portfolioStats.totalEquity },
    { name: 'Restschuld', value: portfolioStats.totalDebt }
  ];
  
  // Prepare pie chart data for cashflow distribution
  const cashflowDistributionData = [
    { name: 'Positiver Cashflow', value: portfolioStats.cashflowPositive },
    { name: 'Negativer Cashflow', value: portfolioStats.cashflowNegative }
  ];
  
  // Prepare data for cashflow by property chart
  const cashflowByPropertyData = properties
    .filter(property => property.calculationResults)
    .map(property => ({
      name: property.name,
      cashflow: property.calculationResults?.monthlyCashflow ?? 0
    }))
    .sort((a, b) => b.cashflow - a.cashflow); // Sort by cashflow descending
  
  // Navigate to property details
  const viewPropertyDetails = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  return (
    <Container size="lg" py="xl">
      <Paper p="md" withBorder mb="xl">
        <Group position="apart">
          <Title order={2}>{title}</Title>
          <Group>
            {navigateBack && (
              <Button variant="outline" onClick={navigateBack}>
                Zurück
              </Button>
            )}
            {onAddProperty && (
              <Button onClick={onAddProperty}>
                Neue Immobilie hinzufügen
              </Button>
            )}
          </Group>
        </Group>
      </Paper>
      
      <Tabs value={activeTab} onTabChange={(value) => setActiveTab(value as string)}>
        <Tabs.List mb="md">
          <Tabs.Tab value="overview">Übersicht</Tabs.Tab>
          <Tabs.Tab value="cashflow">Cashflow</Tabs.Tab>
          <Tabs.Tab value="yeartable">Jahrestabelle</Tabs.Tab>
          <Tabs.Tab value="properties">Immobilien</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="overview">
          <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
            <Card withBorder p="md">
              <Title order={4}>Portfolio Bewertung</Title>
              <Text size="xl" mt="md" weight={700}>{formatCurrency(portfolioStats.totalValue)}</Text>
              <Group mt="md" position="apart">
                <div>
                  <Text size="xs" color="dimmed">Eigenkapital</Text>
                  <Text size="lg">{formatCurrency(portfolioStats.totalEquity)}</Text>
                </div>
                <div>
                  <Text size="xs" color="dimmed">Restschuld</Text>
                  <Text size="lg">{formatCurrency(portfolioStats.totalDebt)}</Text>
                </div>
              </Group>
              <Progress
                mt="md"
                sections={[
                  { value: (portfolioStats.totalEquity / portfolioStats.totalValue) * 100, color: 'green' },
                  { value: (portfolioStats.totalDebt / portfolioStats.totalValue) * 100, color: 'red' }
                ]}
              />
            </Card>
            
            <Card withBorder p="md">
              <Title order={4}>Cashflow Performance</Title>
              <Text size="xl" mt="md" weight={700} color={portfolioStats.avgCashflow >= 0 ? 'green' : 'red'}>
                {formatCurrency(portfolioStats.avgCashflow)} / Monat
              </Text>
              <Text size="sm">Durchschnittlicher ROI: {portfolioStats.avgROI.toFixed(2)}%</Text>
              <Divider my="md" />
              <Group mt="sm" position="apart">
                <div>
                  <Text size="xs" color="dimmed">Positive Cashflows</Text>
                  <Text>{portfolioStats.cashflowPositive}</Text>
                </div>
                <div>
                  <Text size="xs" color="dimmed">Negative Cashflows</Text>
                  <Text>{portfolioStats.cashflowNegative}</Text>
                </div>
              </Group>
            </Card>
            
            <Card withBorder p="md">
              <Title order={4}>Immobilien</Title>
              <Text size="xl" mt="md" weight={700}>{portfolioStats.propertyCount}</Text>
              <Divider my="md" />
              {onAddProperty && (
                <Button fullWidth onClick={onAddProperty}>
                  Neue Immobilie hinzufügen
                </Button>
              )}
            </Card>
          </SimpleGrid>
          
          <Grid mt="xl">
            <Grid.Col md={6}>
              <Card withBorder p="md">
                <Title order={4} mb="md">Vermögensverteilung</Title>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={valueDistributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {valueDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Grid.Col>
            
            <Grid.Col md={6}>
              <Card withBorder p="md">
                <Title order={4} mb="md">Cashflow nach Immobilie</Title>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={cashflowByPropertyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cashflow"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Grid.Col>
          </Grid>
        </Tabs.Panel>
        
        <Tabs.Panel value="cashflow">
          {/* We use a key to force re-mount when data is loaded */}
          <CashflowChart key={`cashflow-${dataLoaded}`} combined />
        </Tabs.Panel>
        
        <Tabs.Panel value="yeartable">
          {/* We use a key to force re-mount when data is loaded */}
          <YearTable key={`yeartable-${dataLoaded}`} combined />
        </Tabs.Panel>
        
        <Tabs.Panel value="properties">
          <Title order={3} mb="md">Immobilien im Portfolio</Title>
          {properties.length === 0 ? (
            <Paper p="xl" withBorder>
              <Text align="center">Keine Immobilien gefunden.</Text>
              {onAddProperty && (
                <Button 
                  mt="md" 
                  fullWidth 
                  onClick={onAddProperty}
                >
                  Erste Immobilie hinzufügen
                </Button>
              )}
            </Paper>
          ) : (
            <SimpleGrid
              cols={3}
              spacing="lg"
              breakpoints={[
                { maxWidth: 1200, cols: 2, spacing: 'md' },
                { maxWidth: 800, cols: 1, spacing: 'sm' },
              ]}
            >
              {properties.map((property) => (
                <Card key={property.id} withBorder shadow="sm" p="lg" radius="md" className="property-card">
                  <Title order={4} mb="md">{property.name}</Title>
                  
                  {property.purchaseData && (
                    <Text>Kaufpreis: {formatCurrency(property.purchaseData.purchasePrice)}</Text>
                  )}
                  
                  {property.calculationResults && (
                    <>
                      <Text>Aktueller Wert: {formatCurrency(property.calculationResults.finalPropertyValue)}</Text>
                      <Text>Monatlicher Cashflow: {formatCurrency(property.calculationResults.monthlyCashflow)}</Text>
                      <Text>ROI: {((property.calculationResults.monthlyCashflow * 12 / property.calculationResults.initialEquity) * 100).toFixed(2)} %</Text>
                    </>
                  )}
                  
                  {showDetailButtons && (
                    <Button
                      fullWidth
                      mt="md"
                      onClick={() => viewPropertyDetails(property.id)}
                    >
                      Details anzeigen
                    </Button>
                  )}
                </Card>
              ))}
            </SimpleGrid>
          )}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}