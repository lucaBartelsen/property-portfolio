// components/property/PropertyOngoingCosts.tsx
import { Grid, NumberInput } from '@mantine/core';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { PropertyDefaults } from '../../lib/types';

interface PropertyOngoingCostsProps {
  watch: UseFormWatch<PropertyDefaults & { name: string }>;
  setValue: UseFormSetValue<PropertyDefaults & { name: string }>;
  errors: FieldErrors<PropertyDefaults & { name: string }>;
}

export function PropertyOngoingCosts({ watch, setValue, errors }: PropertyOngoingCostsProps) {
  const ensureNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <Grid>
      <Grid.Col span={6}>
        <NumberInput
          label="Monatliche Kaltmiete (€)"
          placeholder="z.B. 1200"
          required
          min={0}
          precision={0}
          value={watch('monthlyRent')}
          onChange={(val) => setValue('monthlyRent', ensureNumber(val))}
          error={errors.monthlyRent?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Leerstandsquote (% p.a.)"
          placeholder="z.B. 3.0"
          required
          min={0}
          max={100}
          step={0.1}
          precision={1}
          value={watch('vacancyRate')}
          onChange={(val) => setValue('vacancyRate', ensureNumber(val))}
          error={errors.vacancyRate?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Grundsteuer (€ p.a.)"
          placeholder="z.B. 500"
          required
          min={0}
          precision={0}
          value={watch('propertyTax')}
          onChange={(val) => setValue('propertyTax', ensureNumber(val))}
          error={errors.propertyTax?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Hausverwaltung (€ p.a.)"
          placeholder="z.B. 600"
          required
          min={0}
          precision={0}
          value={watch('managementFee')}
          onChange={(val) => setValue('managementFee', ensureNumber(val))}
          error={errors.managementFee?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Instandhaltungsrücklage (€ p.a.)"
          placeholder="z.B. 600"
          required
          min={0}
          precision={0}
          value={watch('maintenanceReserve')}
          onChange={(val) => setValue('maintenanceReserve', ensureNumber(val))}
          error={errors.maintenanceReserve?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Versicherungen (€ p.a.)"
          placeholder="z.B. 300"
          required
          min={0}
          precision={0}
          value={watch('insurance')}
          onChange={(val) => setValue('insurance', ensureNumber(val))}
          error={errors.insurance?.message}
        />
      </Grid.Col>
    </Grid>
  );
}