// components/property/PropertyBasicInfo.tsx
import { Checkbox, Grid, NumberInput, Select } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { BUNDESLAENDER } from '../../lib/constants';
import { PropertyDefaults } from '../../lib/types';

interface PropertyBasicInfoProps {
  watch: UseFormWatch<PropertyDefaults & { name: string }>;
  setValue: UseFormSetValue<PropertyDefaults & { name: string }>;
  errors: FieldErrors<PropertyDefaults & { name: string }>;
}

export function PropertyBasicInfo({ watch, setValue, errors }: PropertyBasicInfoProps) {
  const ensureNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  return (
    <Grid>
      <Grid.Col span={6}>
        <NumberInput
          label="Kaufpreis (€)"
          placeholder="z.B. 316500"
          required
          min={0}
          precision={0}
          value={watch('purchasePrice')}
          onChange={(val) => setValue('purchasePrice', ensureNumber(val))}
          error={errors.purchasePrice?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <DateInput
          label="Kaufdatum"
          placeholder="TT.MM.JJJJ"
          required
          value={watch('purchaseDate') ? new Date(watch('purchaseDate')) : null}
          onChange={(date) => {
            if (date) {
              setValue('purchaseDate', date.toISOString().split('T')[0]);
            }
          }}
          error={errors.purchaseDate?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <Select
          label="Bundesland"
          placeholder="Wählen Sie ein Bundesland"
          required
          data={BUNDESLAENDER.map(land => ({
            value: land.code,
            label: `${land.name} (${land.taxRate}%)`
          }))}
          value={watch('bundesland')}
          onChange={(val) => val && setValue('bundesland', val)}
          error={errors.bundesland?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Notarkosten (% vom Kaufpreis)"
          placeholder="z.B. 1.5"
          required
          min={0}
          max={10}
          step={0.1}
          precision={1}
          value={watch('notaryRate')}
          onChange={(val) => setValue('notaryRate', ensureNumber(val))}
          error={errors.notaryRate?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Maklerprovision (% vom Kaufpreis)"
          placeholder="z.B. 3.0"
          required
          min={0}
          max={10}
          step={0.1}
          precision={1}
          value={watch('brokerRate')}
          onChange={(val) => setValue('brokerRate', ensureNumber(val))}
          error={errors.brokerRate?.message}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Checkbox
          label="Maklerkosten als Beratungsleistung (sofortige Absetzung im 1. Jahr)"
          checked={watch('brokerAsConsulting')}
          onChange={(e) => setValue('brokerAsConsulting', e.currentTarget.checked)}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="AfA-Satz (% p.a.)"
          placeholder="z.B. 2.0"
          required
          min={0}
          max={10}
          step={0.1}
          precision={1}
          value={watch('depreciationRate')}
          onChange={(val) => setValue('depreciationRate', ensureNumber(val))}
          error={errors.depreciationRate?.message}
        />
      </Grid.Col>
    </Grid>
  );
}