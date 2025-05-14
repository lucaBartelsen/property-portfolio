// components/property/PropertyAppreciation.tsx
import { Grid, NumberInput } from '@mantine/core';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { PropertyDefaults } from '../../lib/types';

interface PropertyAppreciationProps {
  watch: UseFormWatch<PropertyDefaults & { name: string }>;
  setValue: UseFormSetValue<PropertyDefaults & { name: string }>;
  errors: FieldErrors<PropertyDefaults & { name: string }>;
}

export function PropertyAppreciation({ watch, setValue, errors }: PropertyAppreciationProps) {
  const ensureNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <Grid>
      <Grid.Col span={6}>
        <NumberInput
          label="Jährliche Wertsteigerung (%)"
          placeholder="z.B. 2.0"
          required
          min={0}
          max={20}
          step={0.1}
          precision={1}
          value={watch('appreciationRate')}
          onChange={(val) => setValue('appreciationRate', ensureNumber(val))}
          error={errors.appreciationRate?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Jährliche Mietsteigerung (%)"
          placeholder="z.B. 1.5"
          required
          min={0}
          max={20}
          step={0.1}
          precision={1}
          value={watch('rentIncreaseRate')}
          onChange={(val) => setValue('rentIncreaseRate', ensureNumber(val))}
          error={errors.rentIncreaseRate?.message}
        />
      </Grid.Col>
    </Grid>
  );
}