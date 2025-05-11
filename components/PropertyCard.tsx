// src/components/PropertyCard.tsx
import { Card, Text, Group, Button, Stack, Grid } from '@mantine/core';
import { Property } from '../lib/types';
import { formatCurrency } from '../lib/utils/formatters';

interface PropertyCardProps {
  property: Property;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onViewOverview: () => void;
  onViewCashflow: () => void;
  onViewYearTable: () => void;
}

export default function PropertyCard({
  property,
  isActive,
  onEdit,
  onDelete,
  onViewOverview,
  onViewCashflow,
  onViewYearTable
}: PropertyCardProps) {
  // Get key metrics
  const purchasePrice = property.purchaseData?.purchasePrice || property.defaults.purchasePrice;
  const currentValue = property.calculationResults?.finalPropertyValue || purchasePrice;
  const roi = property.calculationResults 
    ? ((property.calculationResults.monthlyCashflow * 12) / property.calculationResults.initialEquity * 100).toFixed(2)
    : '0.00';
  const cashflow = property.calculationResults?.monthlyCashflow || 0;

  return (
    <Card 
      shadow="sm" 
      padding="lg" 
      radius="md" 
      withBorder
      sx={(theme) => ({
        backgroundColor: isActive 
          ? theme.colorScheme === 'dark' 
            ? theme.colors.dark[6] 
            : theme.colors.blue[0]
          : undefined,
        borderColor: isActive 
          ? theme.colors.blue[6] 
          : theme.colorScheme === 'dark' 
            ? theme.colors.dark[4] 
            : theme.colors.gray[3],
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows.md,
        },
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      })}
    >
      <Card.Section p="md" withBorder inheritPadding>
        <Group position="apart">
          <Text size="lg" weight={700}>{property.name}</Text>
          <Group spacing="xs">
            <Button size="xs" variant="outline" color="blue" onClick={onEdit}>
              Bearbeiten
            </Button>
            <Button size="xs" variant="outline" color="red" onClick={onDelete}>
              Löschen
            </Button>
          </Group>
        </Group>
      </Card.Section>

      <Stack mt="md" spacing="xs">
        <Grid>
          <Grid.Col span={6}>
            <Text size="sm" color="dimmed">Kaufpreis:</Text>
            <Text weight={500}>{formatCurrency(purchasePrice)}</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" color="dimmed">Aktueller Wert:</Text>
            <Text weight={500}>{formatCurrency(currentValue)}</Text>
          </Grid.Col>
        </Grid>

        <Grid mt="sm">
          <Grid.Col span={6}>
            <Text size="sm" color="dimmed">ROI:</Text>
            <Text weight={500}>{roi} %</Text>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text size="sm" color="dimmed">Monatlicher Cashflow:</Text>
            <Text weight={500} color={cashflow >= 0 ? "green" : "red"}>
              {formatCurrency(cashflow)}
            </Text>
          </Grid.Col>
        </Grid>
      </Stack>

      <Group mt="xl" position="apart" grow>
        <Button variant="light" color="blue" onClick={onViewOverview}>
          Übersicht
        </Button>
        <Button variant="light" color="green" onClick={onViewCashflow}>
          Cashflow
        </Button>
        <Button variant="light" color="orange" onClick={onViewYearTable}>
          Jahrestabelle
        </Button>
      </Group>
    </Card>
  );
}