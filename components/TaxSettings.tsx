// src/components/TaxSettings.tsx
import { useState } from 'react';
import {
  Paper,
  Title,
  NumberInput,
  Select,
  Radio,
  Button,
  Group,
  Grid,
  Text,
} from '@mantine/core';
import { usePropertyStore } from '../store/PropertyContext';
import { TaxInfo } from '../lib/types';
import { calculateTaxInfo } from '../lib/calculators/taxCalculator';

export default function TaxSettings() {
  const { state, dispatch } = usePropertyStore();
  const [formValues, setFormValues] = useState<TaxInfo>({
    annualIncome: state.taxInfo.annualIncome,
    taxStatus: state.taxInfo.taxStatus,
    hasChurchTax: state.taxInfo.hasChurchTax,
    churchTaxRate: state.taxInfo.churchTaxRate,
    taxRate: state.taxInfo.taxRate,
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const updatedTaxInfo = calculateTaxInfo(formValues);
    dispatch({ type: 'UPDATE_TAX_INFO', taxInfo: updatedTaxInfo });
  };

  return (
    <Paper p="md" withBorder>
      <Title order={2} mb="md">Persönliche Steuerinformationen</Title>
      
      <form onSubmit={handleSubmit}>
        <Grid>
          <Grid.Col span={12}>
            <Radio.Group
              label="Persönliche Verhältnisse"
              value={formValues.taxStatus}
              onChange={(value) => setFormValues({ ...formValues, taxStatus: value as 'single' | 'married' })}
              required
            >
              <Radio value="single" label="Alleinstehend" />
              <Radio value="married" label="Verheiratet (Splitting-Verfahren)" />
            </Radio.Group>
          </Grid.Col>
          
          <Grid.Col span={12}>
            <NumberInput
              label="Zu versteuerndes Brutto-Jahreseinkommen (€)"
              description="Ihr zu versteuerndes Brutto-Jahreseinkommen ohne die Immobilieneinkünfte"
              value={formValues.annualIncome}
              onChange={(value) => setFormValues({ ...formValues, annualIncome: value || 0 })}
              required
              min={0}
            />
          </Grid.Col>
          
          <Grid.Col span={6}>
            <Radio.Group
              label="Kirchensteuer"
              value={formValues.hasChurchTax ? 'yes' : 'no'}
              onChange={(value) => setFormValues({ ...formValues, hasChurchTax: value === 'yes' })}
              required
            >
              <Radio value="no" label="Nein" />
              <Radio value="yes" label="Ja" />
            </Radio.Group>
          </Grid.Col>
          
          {formValues.hasChurchTax && (
            <Grid.Col span={6}>
              <Select
                label="Kirchensteuersatz (%)"
                description="8% in Bayern und Baden-Württemberg, 9% in anderen Bundesländern"
                value={formValues.churchTaxRate.toString()}
                onChange={(value) => setFormValues({ ...formValues, churchTaxRate: parseInt(value || '9') })}
                data={[
                  { value: '8', label: '8%' },
                  { value: '9', label: '9%' },
                ]}
                required
              />
            </Grid.Col>
          )}
          
          <Grid.Col span={6}>
            <NumberInput
              label="Errechneter Steuersatz (%)"
              value={formValues.taxRate}
              disabled
              precision={1}
            />
          </Grid.Col>
        </Grid>
        
        <Group position="right" mt="xl">
          <Button type="submit" color="blue">Steuerinformationen aktualisieren</Button>
        </Group>
      </form>
    </Paper>
  );
}