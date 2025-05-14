// components/property/PropertyPurchaseInfo.tsx
import { Grid, NumberInput, Select, Text } from '@mantine/core';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { PropertyDefaults } from '../../lib/types';
import { MAINTENANCE_DISTRIBUTION_OPTIONS } from '../../lib/constants';

interface PropertyPurchaseInfoProps {
  watch: UseFormWatch<PropertyDefaults & { name: string }>;
  setValue: UseFormSetValue<PropertyDefaults & { name: string }>;
  errors: FieldErrors<PropertyDefaults & { name: string }>;
}

export function PropertyPurchaseInfo({ watch, setValue, errors }: PropertyPurchaseInfoProps) {
  const ensureNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Calculate total allocation with maintenance cost included
  const purchasePrice = ensureNumber(watch('purchasePrice'));
  const landValue = ensureNumber(watch('landValue'));
  const buildingValue = ensureNumber(watch('buildingValue'));
  const maintenanceCost = ensureNumber(watch('maintenanceCost'));
  const furnitureValue = ensureNumber(watch('furnitureValue'));
  
  const totalAllocation = landValue + buildingValue + maintenanceCost + furnitureValue;
  const allocationError = Math.abs(totalAllocation - purchasePrice) > 1;

  return (
    <Grid>
      <Grid.Col span={6}>
        <NumberInput
          label="Grundstücksanteil (€)"
          placeholder="z.B. 45000"
          required
          min={0}
          precision={0}
          value={watch('landValue')}
          onChange={(val) => setValue('landValue', ensureNumber(val))}
          error={errors.landValue?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Gebäudeanteil (€)"
          placeholder="z.B. 255000"
          required
          min={0}
          precision={0}
          value={watch('buildingValue')}
          onChange={(val) => setValue('buildingValue', ensureNumber(val))}
          error={errors.buildingValue?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Erhaltungsaufwand (€)"
          placeholder="z.B. 35000"
          required
          min={0}
          precision={0}
          value={watch('maintenanceCost')}
          onChange={(val) => setValue('maintenanceCost', ensureNumber(val))}
          error={errors.maintenanceCost?.message}
        />
      </Grid.Col>
      <Grid.Col span={6}>
        <NumberInput
          label="Kaufpreis Möbel (€)"
          placeholder="z.B. 16500"
          required
          min={0}
          precision={0}
          value={watch('furnitureValue')}
          onChange={(val) => setValue('furnitureValue', ensureNumber(val))}
          error={errors.furnitureValue?.message}
        />
      </Grid.Col>
      <Grid.Col span={12}>
        <Select
          label="Verteilung Erhaltungsaufwand"
          placeholder="Wählen Sie die Verteilung"
          required
          data={MAINTENANCE_DISTRIBUTION_OPTIONS}
          value={String(watch('maintenanceDistribution'))}
          onChange={(val) => setValue('maintenanceDistribution', parseInt(val || "1"))}
          error={errors.maintenanceDistribution?.message}
        />
      </Grid.Col>
      
      {allocationError && (
        <Grid.Col span={12}>
          <Text color="red">
            Warnung: Die Summe der Kaufpreisaufteilung ({Number(totalAllocation).toFixed(2)} €) entspricht nicht dem Gesamtkaufpreis ({Number(purchasePrice).toFixed(2)} €)!
          </Text>
        </Grid.Col>
      )}
    </Grid>
  );
}