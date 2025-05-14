// components/property/PropertyFinancing.tsx
import { Box, Radio, Card, Grid, NumberInput, Text, Switch, Divider, Group } from '@mantine/core';
import { UseFormWatch, UseFormSetValue, FieldErrors } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { PropertyDefaults } from '../../lib/types';
import { calculateTotalCost } from '../../lib/utils/calculations';

interface PropertyFinancingProps {
  watch: UseFormWatch<PropertyDefaults & { name: string }>;
  setValue: UseFormSetValue<PropertyDefaults & { name: string }>;
  errors: FieldErrors<PropertyDefaults & { name: string }>;
  financingType: 'loan' | 'cash';
  setFinancingType: (type: 'loan' | 'cash') => void;
  useSecondLoan: boolean;
  setUseSecondLoan: (use: boolean) => void;
}

export function PropertyFinancing({
  watch,
  setValue,
  errors,
  financingType,
  setFinancingType,
  useSecondLoan,
  setUseSecondLoan
}: PropertyFinancingProps) {
  const ensureNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Get purchase price and related values
  const purchasePrice = ensureNumber(watch('purchasePrice'));
  const totalCost = calculateTotalCost(
    watch('purchasePrice'),
    watch('bundesland'),
    watch('notaryRate'),
    watch('brokerRate')
  );
  const downPayment = ensureNumber(watch('downPayment'));
  const loanAmount1 = ensureNumber(watch('loanAmount1'));
  const loanAmount2 = ensureNumber(watch('loanAmount2')) * (useSecondLoan ? 1 : 0);

  // Calculate totals
  const totalLoanAmount = loanAmount1 + loanAmount2;
  const totalFinancing = downPayment + totalLoanAmount;
  const financingError = Math.abs(totalFinancing - totalCost) > 1;

  // Calculate the available financing
  const calculateAvailableFinancing = () => {
    if (financingType !== 'loan') return 0;
    return Math.max(0, totalCost - downPayment);
  };

  // Calculate remaining amount for second loan
  const remainingForSecondLoan = calculateAvailableFinancing() - loanAmount1;

  // Auto-update loan amount when related values change
  useEffect(() => {
    if (financingType === 'loan') {
      // Get the total cost including extra costs
      const requiredLoan = totalCost - downPayment - (useSecondLoan ? loanAmount2 : 0);
      setValue('loanAmount1', Math.max(0, requiredLoan));
    }
  }, [totalCost, downPayment, useSecondLoan, loanAmount2, financingType, setValue]);

  return (
    <>
      <Radio.Group
        label="Finanzierungsart"
        value={financingType}
        onChange={(value) => setFinancingType(value as 'loan' | 'cash')}
        required
        name="financingType"
      >
        <Radio value="loan" label="Kredit" />
        <Radio value="cash" label="Eigenkapital" />
      </Radio.Group>
      
      {financingType === 'loan' && (
        <Box mt="md">
          <Card withBorder p="sm" mb="md">
            <Grid>
              <Grid.Col span={12}>
                <Text weight={500} mb="xs">Gesamtkosten & Eigenkapital</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Kaufpreis inkl. Nebenkosten (€)"
                  value={totalCost}
                  disabled
                  precision={0}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Eigenkapital (€)"
                  placeholder="z.B. 25000"
                  required
                  min={0}
                  max={totalCost}
                  precision={0}
                  value={watch('downPayment')}
                  onChange={(val) => setValue('downPayment', ensureNumber(val))}
                  error={errors.downPayment?.message}
                />
              </Grid.Col>
              
              <Grid.Col span={12}>
                <Text weight={500} size="sm" mt="xs">Zu finanzierender Betrag: {(totalCost - downPayment).toLocaleString('de-DE')} €</Text>
              </Grid.Col>
            </Grid>
          </Card>
          
          <Card withBorder p="sm" mb="md">
            <Text weight={500} mb="xs">Darlehen 1</Text>
            <Grid>
              <Grid.Col span={4}>
                <NumberInput
                  label="Darlehensbetrag (€)"
                  placeholder="z.B. 291500"
                  required
                  min={0}
                  max={calculateAvailableFinancing()}
                  precision={0}
                  value={watch('loanAmount1')}
                  onChange={(val) => setValue('loanAmount1', ensureNumber(val))}
                  error={errors.loanAmount1?.message}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Zinssatz (%)"
                  placeholder="z.B. 4.0"
                  required
                  min={0}
                  max={20}
                  step={0.01}
                  precision={2}
                  value={watch('interestRate1')}
                  onChange={(val) => setValue('interestRate1', ensureNumber(val))}
                  error={errors.interestRate1?.message}
                />
              </Grid.Col>
              <Grid.Col span={4}>
                <NumberInput
                  label="Tilgungssatz (% p.a.)"
                  placeholder="z.B. 1.5"
                  required
                  min={0}
                  max={20}
                  step={0.1}
                  precision={1}
                  value={watch('repaymentRate1')}
                  onChange={(val) => setValue('repaymentRate1', ensureNumber(val))}
                  error={errors.repaymentRate1?.message}
                />
              </Grid.Col>
              
              <Grid.Col span={12}>
                <Box mt="md">
                  <Switch
                    label="Zweites Darlehen hinzufügen"
                    checked={useSecondLoan}
                    onChange={(event) => {
                      const newValue = event.currentTarget.checked;
                      setUseSecondLoan(newValue);
                      // Reset second loan when deactivated
                      if (!newValue) {
                        setValue('loanAmount2', 0);
                        setValue('interestRate2', 0);
                        setValue('repaymentRate2', 0);
                      }
                    }}
                  />
                </Box>
              </Grid.Col>
            </Grid>
          </Card>
          
          {useSecondLoan && (
            <Card withBorder p="sm" mb="md">
              <Text weight={500} mb="xs">Darlehen 2</Text>
              <Grid>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Darlehensbetrag (€)"
                    placeholder="z.B. 50000"
                    required
                    min={0}
                    max={calculateAvailableFinancing()}
                    precision={0}
                    value={watch('loanAmount2')}
                    onChange={(val) => setValue('loanAmount2', ensureNumber(val))}
                    error={errors.loanAmount2?.message}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Zinssatz (%)"
                    placeholder="z.B. 3.0"
                    required
                    min={0}
                    max={20}
                    step={0.01}
                    precision={2}
                    value={watch('interestRate2')}
                    onChange={(val) => setValue('interestRate2', ensureNumber(val))}
                    error={errors.interestRate2?.message}
                  />
                </Grid.Col>
                <Grid.Col span={4}>
                  <NumberInput
                    label="Tilgungssatz (% p.a.)"
                    placeholder="z.B. 2.0"
                    required
                    min={0}
                    max={20}
                    step={0.1}
                    precision={1}
                    value={watch('repaymentRate2')}
                    onChange={(val) => setValue('repaymentRate2', ensureNumber(val))}
                    error={errors.repaymentRate2?.message}
                  />
                </Grid.Col>
              </Grid>
            </Card>
          )}
          
          <Box>
            <Divider my="md" />
            <Grid>
              <Grid.Col span={6}>
                <Text weight={600}>Finanzierungssumme:</Text>
              </Grid.Col>
              <Grid.Col span={6}>
                <Text align="right" weight={600}>
                  {(downPayment + loanAmount1 + loanAmount2).toLocaleString('de-DE')} €
                </Text>
              </Grid.Col>
            </Grid>
            
            {financingError && (
              <Text color="red" mt="sm">
                Warnung: Die Finanzierungssumme ({(downPayment + loanAmount1 + loanAmount2).toLocaleString('de-DE')} €) 
                stimmt nicht mit dem Kaufpreis ({totalCost.toLocaleString('de-DE')} €) überein!
              </Text>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}