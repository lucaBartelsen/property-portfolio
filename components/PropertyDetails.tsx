// src/components/PropertyDetails.tsx
import { Card, Title, Button, Group, Text, Grid, Divider } from '@mantine/core';
import { Property } from '../lib/types';
import { formatCurrency } from '../lib/utils/formatters';

interface PropertyDetailsProps {
  property: Property;
  onBack: () => void;
}

export default function PropertyDetails({ property, onBack }: PropertyDetailsProps) {
  const purchaseData = property.purchaseData;
  const ongoingData = property.ongoingData;
  const results = property.calculationResults;
  
  if (!purchaseData || !ongoingData || !results) {
    return (
      <Card p="md" withBorder>
        <Group position="apart" mb="md">
          <Title order={2}>Übersicht: {property.name}</Title>
          <Button variant="outline" onClick={onBack}>
            Zurück
          </Button>
        </Group>
        <Text align="center" py="xl">Keine Daten vorhanden. Bitte führen Sie die Berechnungen durch.</Text>
      </Card>
    );
  }
  
  return (
    <Card p="md" withBorder>
      <Group position="apart" mb="md">
        <Title order={2}>Übersicht: {property.name}</Title>
        <Button variant="outline" onClick={onBack}>
          Zurück
        </Button>
      </Group>
      
      <Grid gutter="xl">
        <Grid.Col span={12}>
          <Card withBorder p="md">
            <Title order={3} mb="sm">Kaufkosten & Steuern</Title>
            <Grid>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Kaufpreis:</Text>
                <Text>{formatCurrency(purchaseData.purchasePrice)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Grunderwerbsteuer:</Text>
                <Text>{formatCurrency(purchaseData.grunderwerbsteuer)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Notarkosten:</Text>
                <Text>{formatCurrency(purchaseData.notaryCosts)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Maklerprovision:</Text>
                <Text>{formatCurrency(purchaseData.brokerFee)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Gesamte Kaufnebenkosten:</Text>
                <Text>{formatCurrency(purchaseData.totalExtra)}</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text size="sm" color="dimmed">Gesamtkosten:</Text>
                <Text weight={700}>{formatCurrency(purchaseData.totalCost)}</Text>
              </Grid.Col>
            </Grid>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Card withBorder p="md" style={{ height: '100%' }}>
            <Title order={3} mb="sm">Jährliche Kosten & Einnahmen</Title>
            <div>
              <Text size="sm" color="dimmed">Jährliche Mieteinnahmen (brutto):</Text>
              <Text>{formatCurrency(ongoingData.annualRent)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Effektive Mieteinnahmen (nach Leerstand):</Text>
              <Text>{formatCurrency(ongoingData.effectiveRent)}</Text>
            </div>
            <Divider my="sm" />
            <div>
              <Text size="sm" color="dimmed">Grundsteuer:</Text>
              <Text>{formatCurrency(ongoingData.propertyTax)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Hausverwaltung:</Text>
              <Text>{formatCurrency(ongoingData.managementFee)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Instandhaltungsrücklage:</Text>
              <Text>{formatCurrency(ongoingData.maintenanceCost)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Versicherungen:</Text>
              <Text>{formatCurrency(ongoingData.insurance)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Gesamte laufende Kosten:</Text>
              <Text weight={700}>{formatCurrency(ongoingData.totalOngoing)}</Text>
            </div>
          </Card>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Card withBorder p="md" style={{ height: '100%' }}>
            <Title order={3} mb="sm">Zusammenfassung</Title>
            <div>
              <Text size="sm" color="dimmed">Kaufpreis inkl. Nebenkosten:</Text>
              <Text>{formatCurrency(results.totalCost)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Eigenkapital:</Text>
              <Text>{formatCurrency(results.initialEquity)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Fremdkapital:</Text>
              <Text>{formatCurrency(results.loanAmount)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Monatliche Belastung (Bank):</Text>
              <Text>{formatCurrency(results.monthlyPayment)}</Text>
            </div>
            <Divider my="sm" />
            <div>
              <Text size="sm" color="dimmed">Monatlicher Cashflow nach Steuern:</Text>
              <Text weight={700} color={results.monthlyCashflow >= 0 ? "green" : "red"}>
                {formatCurrency(results.monthlyCashflow)}
              </Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Cashflow-Rendite (bezogen auf Eigenkapital):</Text>
              <Text weight={700}>
                {((results.monthlyCashflow * 12 / results.initialEquity) * 100).toFixed(2)} %
              </Text>
            </div>
            <Divider my="sm" />
            <div>
              <Text size="sm" color="dimmed">Immobilienwert nach Betrachtungszeitraum:</Text>
              <Text>{formatCurrency(results.finalPropertyValue)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Restschuld nach Betrachtungszeitraum:</Text>
              <Text>{formatCurrency(results.remainingLoan)}</Text>
            </div>
            <div style={{ marginTop: 10 }}>
              <Text size="sm" color="dimmed">Eigenkapitalentwicklung:</Text>
              <Text weight={700}>{formatCurrency(results.finalEquity - results.initialEquity)}</Text>
            </div>
          </Card>
        </Grid.Col>
      </Grid>
    </Card>
  );
}