// Updated src/components/PropertyDetails.tsx
import { useEffect } from 'react';
import { Card, Title, Button, Group, Text, Grid, Divider, Badge, Box } from '@mantine/core';
import { Property } from '../lib/types';
import { formatCurrency } from '../lib/utils/formatters';
import { usePropertyStore } from '../store/PropertyContext';
import { useRouter } from 'next/router';

interface PropertyDetailsProps {
  property: Property;
  onBack: () => void;
}

export default function PropertyDetails({ property, onBack }: PropertyDetailsProps) {
  const { dispatch } = usePropertyStore();
  const router = useRouter();
  
  // Calculate data if it doesn't exist yet
  useEffect(() => {
    if (!property.purchaseData || !property.ongoingData || !property.calculationResults) {
      // Update the property to trigger calculations
      dispatch({ type: 'UPDATE_PROPERTY', property });
    }
  }, [property, dispatch]);
  
  const purchaseData = property.purchaseData;
  const ongoingData = property.ongoingData;
  const results = property.calculationResults;
  
  if (!purchaseData || !ongoingData || !results) {
    return (
      <Card p="md" withBorder>
        <Group position="apart" mb="md">
          <Title order={2}>Übersicht: {property.name}</Title>
        </Group>
        <Text align="center" py="xl">Daten werden berechnet...</Text>
        <Button fullWidth onClick={() => dispatch({ type: 'UPDATE_PROPERTY', property })}>
          Berechnungen durchführen
        </Button>
      </Card>
    );
  }
  
  // Format purchase date
  const purchaseDate = property.defaults.purchaseDate 
    ? new Date(property.defaults.purchaseDate).toLocaleDateString('de-DE') 
    : 'Nicht angegeben';
  
  // Determine if we're using override values
  const usingMarketValue = property.defaults.useCurrentMarketValue && property.defaults.currentMarketValue;
  const usingDebtValue = property.defaults.useCurrentDebtValue && property.defaults.currentDebtValue !== undefined;
  
  // Calculate yearly growth and years in calculation
  const appreciationRate = property.defaults.appreciationRate || 2;
  const yearlyData = property.yearlyData || [];
  const calculationPeriod = yearlyData.length;
  
  // Ensure we have valid equity values
  const initialEquity = results.initialEquity || 0;
  const finalEquity = results.finalEquity || 0;
  const equityGrowth = finalEquity - initialEquity;
  const equityGrowthPercent = initialEquity > 0 
    ? (equityGrowth / initialEquity) * 100 
    : 0;
    
  // Calculate annualized return
  const annualizedReturn = calculationPeriod > 1 
    ? (Math.pow((finalEquity / initialEquity), 1 / calculationPeriod) - 1) * 100 
    : equityGrowthPercent;

  // Calculate monthly values
  const monthlyRent = ongoingData.effectiveRent / 12;
  const monthlyOngoingCosts = ongoingData.totalOngoing / 12;
  const monthlyLoanPayment = results.monthlyPayment;
  const monthlyCashflowBeforeTax = monthlyRent - monthlyOngoingCosts - monthlyLoanPayment;
  
  // Calculate cash-on-cash return (not including appreciation)
  const cashOnCashReturn = initialEquity > 0 
    ? (results.monthlyCashflow * 12 / initialEquity) * 100 
    : 0;
    
  return (
    <Card p="md" withBorder>
      <Group position="apart" mb="md">
        <Title order={2}>Übersicht: {property.name}</Title>
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
      </Group>
      
      <Grid gutter="xl">
        {/* SECTION 1: Kaufpreisdaten und Kaufpreisaufteilung */}
        <Grid.Col span={12}>
          <Card withBorder p="md">
            <Grid>
              <Grid.Col span={8}>
                <Title order={3} mb="sm">Kaufpreis & Kaufpreisaufteilung</Title>
                <Grid>
                  <Grid.Col span={6}>
                    <Text size="sm" color="dimmed">Kaufpreis:</Text>
                    <Text weight={700}>{formatCurrency(purchaseData.purchasePrice)}</Text>
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <Text size="sm" color="dimmed">Kaufdatum:</Text>
                    <Text>{purchaseDate}</Text>
                  </Grid.Col>
                  
                  <Grid.Col span={12}>
                    <Divider my="xs" />
                  </Grid.Col>
                  
                  <Grid.Col span={3}>
                    <Text size="sm" color="dimmed">Grundstücksanteil:</Text>
                    <Text>{formatCurrency(purchaseData.landValue)}</Text>
                    <Text size="xs" color="dimmed">({purchaseData.landValuePercentage.toFixed(1)}%)</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="sm" color="dimmed">Gebäudeanteil:</Text>
                    <Text>{formatCurrency(purchaseData.buildingValue)}</Text>
                    <Text size="xs" color="dimmed">({purchaseData.buildingValuePercentage.toFixed(1)}%)</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="sm" color="dimmed">Erhaltungsaufwand:</Text>
                    <Text>{formatCurrency(purchaseData.maintenanceCost)}</Text>
                  </Grid.Col>
                  <Grid.Col span={3}>
                    <Text size="sm" color="dimmed">Möbel:</Text>
                    <Text>{formatCurrency(purchaseData.furnitureValue)}</Text>
                  </Grid.Col>
                </Grid>
              </Grid.Col>
              
              <Grid.Col span={4}>
                <Title order={3} mb="sm">Kaufnebenkosten</Title>
                <Text size="sm" color="dimmed">Grunderwerbsteuer:</Text>
                <Text>{formatCurrency(purchaseData.grunderwerbsteuer)}</Text>
                
                <Text size="sm" color="dimmed" mt="sm">Notarkosten:</Text>
                <Text>{formatCurrency(purchaseData.notaryCosts)}</Text>
                
                <Text size="sm" color="dimmed" mt="sm">Maklerprovision:</Text>
                <Text>{formatCurrency(purchaseData.brokerFee)}</Text>
                
                <Text size="sm" color="dimmed" mt="sm">Gesamte Kaufnebenkosten:</Text>
                <Text weight={700}>{formatCurrency(purchaseData.totalExtra)}</Text>
                
                <Text size="sm" color="dimmed" mt="sm">Gesamtkosten:</Text>
                <Text weight={700}>{formatCurrency(purchaseData.totalCost)}</Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>
        
        {/* SECTION 2: Monatliche Übersicht */}
        <Grid.Col span={12} md={6}>
          <Card withBorder p="md" style={{ height: '100%' }}>
            <Title order={3} mb="sm">Monatliche Übersicht</Title>
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Monatliche Mieteinnahmen:</Text>
                <Text weight={500} color="green">{formatCurrency(monthlyRent)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Monatl. laufende Kosten:</Text>
                <Text weight={500} color="red">{formatCurrency(monthlyOngoingCosts)}</Text>
              </Grid.Col>
              
              <Grid.Col span={12}>
                <Divider my="xs" />
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Monatl. Finanzierungskosten:</Text>
                <Text weight={500} color="red">{formatCurrency(monthlyLoanPayment)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Monatl. Cashflow vor Steuern:</Text>
                <Text weight={600} color={monthlyCashflowBeforeTax >= 0 ? "green" : "red"}>
                  {formatCurrency(monthlyCashflowBeforeTax)}
                </Text>
              </Grid.Col>
              
              <Grid.Col span={12}>
                <Divider my="xs" />
              </Grid.Col>
              
              <Grid.Col span={12}>
                <Text size="sm" color="dimmed">Monatl. Cashflow nach Steuern:</Text>
                <Text weight={700} size="lg" color={results.monthlyCashflow >= 0 ? "green" : "red"}>
                  {formatCurrency(results.monthlyCashflow)}
                </Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>
        
        {/* SECTION 3: Finanzierungsübersicht */}
        <Grid.Col span={12} md={6}>
          <Card withBorder p="md" style={{ height: '100%' }}>
            <Title order={3} mb="sm">Finanzierungsübersicht</Title>
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Gesamtkosten:</Text>
                <Text>{formatCurrency(results.totalCost)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Eigenkapital:</Text>
                <Text>{formatCurrency(results.initialEquity)}</Text>
              </Grid.Col>
              
              <Grid.Col span={12}>
                <Divider my="xs" />
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Darlehenshöhe:</Text>
                <Group spacing="xs">
                  <Text>{formatCurrency(results.loanAmount)}</Text>
                  {usingDebtValue && (
                    <Badge color="blue" size="sm">Manuell angepasst</Badge>
                  )}
                </Group>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Restschuld in {calculationPeriod} Jahren:</Text>
                <Group spacing="xs">
                  <Text>{formatCurrency(results.remainingLoan)}</Text>
                  {usingDebtValue && (
                    <Badge color="blue" size="sm">Manuell angepasst</Badge>
                  )}
                </Group>
              </Grid.Col>
              
              <Grid.Col span={12}>
                <Divider my="xs" />
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Jährliche Rate:</Text>
                <Text>{formatCurrency(results.annuity)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Monatliche Rate:</Text>
                <Text weight={500}>{formatCurrency(results.monthlyPayment)}</Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>
        
        {/* SECTION 4: Rendite und Kapitalentwicklung */}
        <Grid.Col span={12}>
          <Card withBorder p="md">
            <Title order={3} mb="sm">Eigenkapitalrendite & -entwicklung ({calculationPeriod} Jahre)</Title>
            <Grid>
              <Grid.Col span={3}>
                <Text size="sm" color="dimmed">Immobilienwert zu Beginn:</Text>
                <Text>{formatCurrency(purchaseData.purchasePrice)}</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" color="dimmed">Immobilienwert am Ende:</Text>
                <Group spacing="xs">
                  <Text>{formatCurrency(results.finalPropertyValue)}</Text>
                  {usingMarketValue && (
                    <Badge color="blue" size="sm">Manuell angepasst</Badge>
                  )}
                </Group>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" color="dimmed">Wertsteigerung p.a.:</Text>
                <Text>{appreciationRate.toFixed(1)}%</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" color="dimmed">Eigenkapital zu Beginn:</Text>
                <Text>{formatCurrency(initialEquity)}</Text>
              </Grid.Col>
              
              <Grid.Col span={12}>
                <Divider my="xs" />
              </Grid.Col>
              
              <Grid.Col span={3}>
                <Text size="sm" color="dimmed">Eigenkapital am Ende:</Text>
                <Text>{formatCurrency(finalEquity)}</Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" color="dimmed">Eigenkapitalzuwachs:</Text>
                <Text color={equityGrowth >= 0 ? "green" : "red"}>
                  {formatCurrency(equityGrowth)} ({equityGrowthPercent.toFixed(1)}%)
                </Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" color="dimmed">Annualisierte Rendite:</Text>
                <Text weight={600} color={annualizedReturn >= 0 ? "green" : "red"}>
                  {annualizedReturn.toFixed(2)}% p.a.
                </Text>
              </Grid.Col>
              <Grid.Col span={3}>
                <Text size="sm" color="dimmed">Cash-on-Cash Rendite:</Text>
                <Text weight={600} color={cashOnCashReturn >= 0 ? "green" : "red"}>
                  {cashOnCashReturn.toFixed(2)}%
                </Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>
        
        {/* SECTION 5: Laufende Kosten Detail */}
        <Grid.Col span={12}>
          <Card withBorder p="md">
            <Title order={3} mb="sm">Details zu laufenden Kosten</Title>
            <Grid>
              <Grid.Col span={6} md={3}>
                <Text size="sm" color="dimmed">Grundsteuer (jährlich):</Text>
                <Text>{formatCurrency(ongoingData.propertyTax)}</Text>
              </Grid.Col>
              <Grid.Col span={6} md={3}>
                <Text size="sm" color="dimmed">Hausverwaltung (jährlich):</Text>
                <Text>{formatCurrency(ongoingData.managementFee)}</Text>
              </Grid.Col>
              <Grid.Col span={6} md={3}>
                <Text size="sm" color="dimmed">Instandhaltungsrücklage (jährlich):</Text>
                <Text>{formatCurrency(ongoingData.maintenanceCost)}</Text>
              </Grid.Col>
              <Grid.Col span={6} md={3}>
                <Text size="sm" color="dimmed">Versicherungen (jährlich):</Text>
                <Text>{formatCurrency(ongoingData.insurance)}</Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>
      </Grid>
    </Card>
  );
}