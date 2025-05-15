// components/property/PropertyCurrentValues.tsx
import { Box, Grid, NumberInput, Switch, Text } from '@mantine/core';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { PropertyDefaults } from '../../lib/types';

interface PropertyCurrentValuesProps {
  watch: UseFormWatch<PropertyDefaults & { name: string }>;
  setValue: UseFormSetValue<PropertyDefaults & { name: string }>;
  errors: FieldErrors<PropertyDefaults & { name: string }>;
}

export function PropertyCurrentValues({ watch, setValue, errors }: PropertyCurrentValuesProps) {
  const ensureNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  const useMarketValue = watch('useCurrentMarketValue');
  const useDebtValue = watch('useCurrentDebtValue');

  return (
    <Grid>
      <Grid.Col span={12}>
        <Text mb="md" size="sm" color="dimmed">
          Sie können aktuelle Werte eingeben, um die Berechnung zu überschreiben. Dies ist nützlich, wenn der tatsächliche Marktwert oder Darlehensstand von den berechneten Werten abweicht.
        </Text>
      </Grid.Col>
      
      <Grid.Col span={12}>
        <Switch
          label="Aktuellen Marktwert verwenden (überschreibt berechneten Wert)"
          checked={watch('useCurrentMarketValue')}
          onChange={(e) => setValue('useCurrentMarketValue', e.currentTarget.checked)}
          mb="xs"
        />
      </Grid.Col>
      
      {useMarketValue && (
        <Grid.Col span={6}>
          <NumberInput
            label="Aktueller Marktwert (€)"
            description="Der aktuelle Marktwert der Immobilie"
            required={useMarketValue}
            min={0}
            precision={0}
            value={watch('currentMarketValue')}
            onChange={(val) => setValue('currentMarketValue', ensureNumber(val))}
            error={errors.currentMarketValue?.message}
          />
        </Grid.Col>
      )}
      
      <Grid.Col span={12} mt="md">
        <Switch
          label="Aktuelle Darlehensschuld verwenden (überschreibt berechneten Wert)"
          checked={watch('useCurrentDebtValue')}
          onChange={(e) => setValue('useCurrentDebtValue', e.currentTarget.checked)}
          mb="xs"
        />
      </Grid.Col>
      
      {useDebtValue && (
        <Grid.Col span={6}>
          <NumberInput
            label="Aktuelle Darlehensschuld (€)"
            description="Die aktuelle Restschuld aller Darlehen"
            required={useDebtValue}
            min={0}
            precision={0}
            value={watch('currentDebtValue')}
            onChange={(val) => setValue('currentDebtValue', ensureNumber(val))}
            error={errors.currentDebtValue?.message}
          />
        </Grid.Col>
      )}
    </Grid>
  );
}