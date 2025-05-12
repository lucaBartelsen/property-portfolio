// src/components/PropertyForm.tsx
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  TextInput,
  NumberInput,
  Checkbox,
  Button,
  Group,
  Paper,
  Title,
  Select,
  Grid,
  Tabs,
  Text,
  Radio,
} from '@mantine/core';
import { Property, PropertyDefaults } from '../lib/types';
import { createNewProperty } from '../store/PropertyContext';
import { v4 as uuidv4 } from 'uuid';
import { 
  BUNDESLAENDER, 
  DEFAULT_PROPERTY_VALUES,
  MAINTENANCE_DISTRIBUTION_OPTIONS 
} from '../lib/constants';

interface PropertyFormProps {
  property?: Property;
  onSave: (property: Property) => void;
  onCancel: () => void;
}

export default function PropertyForm({ property, onSave, onCancel }: PropertyFormProps) {
  const isEditing = !!property;
  const [activeTab, setActiveTab] = useState('immobiliendaten');
  const [financingType, setFinancingType] = useState<'loan' | 'cash'>(
    property?.defaults.financingType || 'loan'
  );

  // Initialize form with property data or defaults
  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<PropertyDefaults & { name: string }>({
    defaultValues: {
      name: property?.name || 'Neue Immobilie',
      purchasePrice: property?.defaults.purchasePrice || 316500,
      bundesland: property?.defaults.bundesland || "3.5",
      notaryRate: property?.defaults.notaryRate || 1.5,
      brokerRate: property?.defaults.brokerRate || 3.0,
      brokerAsConsulting: property?.defaults.brokerAsConsulting || true,
      depreciationRate: property?.defaults.depreciationRate || 2.0,
      landValue: property?.defaults.landValue || 45000,
      buildingValue: property?.defaults.buildingValue || 255000,
      maintenanceCost: property?.defaults.maintenanceCost || 35000,
      furnitureValue: property?.defaults.furnitureValue || 16500,
      maintenanceDistribution: property?.defaults.maintenanceDistribution || 1,
      financingType: property?.defaults.financingType || 'loan',
      downPayment: property?.defaults.downPayment || 25000,
      interestRate: property?.defaults.interestRate || 4.0,
      repaymentRate: property?.defaults.repaymentRate || 1.5,
      monthlyRent: property?.defaults.monthlyRent || 1200,
      vacancyRate: property?.defaults.vacancyRate || 3.0,
      propertyTax: property?.defaults.propertyTax || 500,
      managementFee: property?.defaults.managementFee || 600,
      maintenanceReserve: property?.defaults.maintenanceReserve || 600,
      insurance: property?.defaults.insurance || 300,
      appreciationRate: property?.defaults.appreciationRate || 2.0,
      rentIncreaseRate: property?.defaults.rentIncreaseRate || 1.5,
    }
  });

 // Watch values for validation
  const watchPurchasePrice = watch('purchasePrice');
  const watchLandValue = watch('landValue');
  const watchBuildingValue = watch('buildingValue');
  const watchMaintenanceCost = watch('maintenanceCost');
  const watchFurnitureValue = watch('furnitureValue');

  // Convert to numbers with fallbacks
  const purchasePrice = Number(watchPurchasePrice || 0);
  const landValue = Number(watchLandValue || 0);
  const buildingValue = Number(watchBuildingValue || 0);
  const maintenanceCost = Number(watchMaintenanceCost || 0);
  const furnitureValue = Number(watchFurnitureValue || 0);

  // Calculate total allocation with maintenance cost included
  const totalAllocation = landValue + buildingValue + maintenanceCost + furnitureValue;
  const allocationError = Math.abs(totalAllocation - purchasePrice) > 1;

  const onSubmit = (data: PropertyDefaults & { name: string }) => {
    const { name, ...defaults } = data;
    
    if (isEditing && property) {
      // Update existing property
      const updatedProperty: Property = {
        ...property,
        name,
        defaults: {
          ...defaults,
          financingType,
        },
      };
      onSave(updatedProperty);
    } else {
      // Create new property
      const newProperty: Property = {
        id: uuidv4(),
        name,
        purchaseData: null,
        ongoingData: null,
        calculationResults: null,
        yearlyData: null,
        defaults: {
          ...defaults,
          financingType,
        },
      };
      onSave(newProperty);
    }
  };

  return (
    <Paper p="md" withBorder>
      <Title order={2} mb="md">{isEditing ? `Immobilie bearbeiten: ${property.name}` : 'Neue Immobilie erstellen'}</Title>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <TextInput
          label="Immobilienname"
          placeholder="z.B. Meine Eigentumswohnung"
          required
          mb="md"
          {...register('name', { required: true })}
        />
        
        <Tabs value={activeTab} onTabChange={(value) => setActiveTab(value as string)}>
          <Tabs.List>
            <Tabs.Tab value="immobiliendaten">Immobiliendaten</Tabs.Tab>
            <Tabs.Tab value="kaufpreisaufteilung">Kaufpreisaufteilung</Tabs.Tab>
            <Tabs.Tab value="finanzierung">Finanzierung</Tabs.Tab>
            <Tabs.Tab value="vermietung">Vermietung & laufende Kosten</Tabs.Tab>
            <Tabs.Tab value="rendite">Kapitalwert & Rendite</Tabs.Tab>
          </Tabs.List>

          {/* Immobiliendaten Tab */}
          <Tabs.Panel value="immobiliendaten" pt="xs">
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label="Kaufpreis (€)"
                  placeholder="z.B. 316500"
                  required
                  min={0}
                  {...register('purchasePrice', { required: true, min: 0 })}
                  onChange={(val) => setValue('purchasePrice', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Controller
                  name="bundesland"
                  control={control}
                  defaultValue={property?.defaults.bundesland || DEFAULT_PROPERTY_VALUES.bundesland}
                  render={({ field }) => (
                    <Select
                      label="Bundesland"
                      placeholder="Wählen Sie ein Bundesland"
                      required
                      data={BUNDESLAENDER.map(land => ({
                        value: land.code,
                        label: `${land.name} (${land.taxRate}%)`
                      }))}
                      {...field}
                    />
                  )}
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
                  {...register('notaryRate', { required: true, min: 0, max: 10 })}
                  onChange={(val) => setValue('notaryRate', val || 0)}
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
                  {...register('brokerRate', { required: true, min: 0, max: 10 })}
                  onChange={(val) => setValue('brokerRate', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Checkbox
                  label="Maklerkosten als Beratungsleistung (sofortige Absetzung im 1. Jahr)"
                  {...register('brokerAsConsulting')}
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
                  {...register('depreciationRate', { required: true, min: 0, max: 10 })}
                  onChange={(val) => setValue('depreciationRate', val || 0)}
                />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* Kaufpreisaufteilung Tab */}
          <Tabs.Panel value="kaufpreisaufteilung" pt="xs">
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label="Grundstücksanteil (€)"
                  placeholder="z.B. 45000"
                  required
                  min={0}
                  {...register('landValue', { required: true, min: 0 })}
                  onChange={(val) => setValue('landValue', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Gebäudeanteil (€)"
                  placeholder="z.B. 255000"
                  required
                  min={0}
                  {...register('buildingValue', { required: true, min: 0 })}
                  onChange={(val) => setValue('buildingValue', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Erhaltungsaufwand (€)"
                  placeholder="z.B. 35000"
                  required
                  min={0}
                  {...register('maintenanceCost', { required: true, min: 0 })}
                  onChange={(val) => setValue('maintenanceCost', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Kaufpreis Möbel (€)"
                  placeholder="z.B. 16500"
                  required
                  min={0}
                  {...register('furnitureValue', { required: true, min: 0 })}
                  onChange={(val) => setValue('furnitureValue', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Controller
                  name="maintenanceDistribution"
                  control={control}
                  defaultValue={property?.defaults.maintenanceDistribution || DEFAULT_PROPERTY_VALUES.maintenanceDistribution}
                  render={({ field }) => (
                    <Select
                      label="Verteilung Erhaltungsaufwand"
                      placeholder="Wählen Sie die Verteilung"
                      required
                      data={MAINTENANCE_DISTRIBUTION_OPTIONS}
                      value={String(field.value)}
                      onChange={(val) => field.onChange(parseInt(val || "1"))}
                    />
                  )}
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
          </Tabs.Panel>

          {/* Finanzierung Tab */}
          <Tabs.Panel value="finanzierung" pt="xs">
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
              <Grid mt="md">
                <Grid.Col span={4}>
                  <NumberInput
                    label="Eigenkapital (€)"
                    placeholder="z.B. 25000"
                    required
                    min={0}
                    {...register('downPayment', { required: true, min: 0 })}
                    onChange={(val) => setValue('downPayment', val || 0)}
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
                    {...register('interestRate', { required: true, min: 0, max: 20 })}
                    onChange={(val) => setValue('interestRate', val || 0)}
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
                    {...register('repaymentRate', { required: true, min: 0, max: 20 })}
                    onChange={(val) => setValue('repaymentRate', val || 0)}
                  />
                </Grid.Col>
              </Grid>
            )}
          </Tabs.Panel>

          {/* Vermietung Tab */}
          <Tabs.Panel value="vermietung" pt="xs">
            <Grid>
              <Grid.Col span={6}>
                <NumberInput
                  label="Monatliche Kaltmiete (€)"
                  placeholder="z.B. 1200"
                  required
                  min={0}
                  {...register('monthlyRent', { required: true, min: 0 })}
                  onChange={(val) => setValue('monthlyRent', val || 0)}
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
                  {...register('vacancyRate', { required: true, min: 0, max: 100 })}
                  onChange={(val) => setValue('vacancyRate', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Grundsteuer (€ p.a.)"
                  placeholder="z.B. 500"
                  required
                  min={0}
                  {...register('propertyTax', { required: true, min: 0 })}
                  onChange={(val) => setValue('propertyTax', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Hausverwaltung (€ p.a.)"
                  placeholder="z.B. 600"
                  required
                  min={0}
                  {...register('managementFee', { required: true, min: 0 })}
                  onChange={(val) => setValue('managementFee', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Instandhaltungsrücklage (€ p.a.)"
                  placeholder="z.B. 600"
                  required
                  min={0}
                  {...register('maintenanceReserve', { required: true, min: 0 })}
                  onChange={(val) => setValue('maintenanceReserve', val || 0)}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label="Versicherungen (€ p.a.)"
                  placeholder="z.B. 300"
                  required
                  min={0}
                  {...register('insurance', { required: true, min: 0 })}
                  onChange={(val) => setValue('insurance', val || 0)}
                />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* Kapitalwert & Rendite Tab */}
          <Tabs.Panel value="rendite" pt="xs">
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
                  {...register('appreciationRate', { required: true, min: 0, max: 20 })}
                  onChange={(val) => setValue('appreciationRate', val || 0)}
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
                  {...register('rentIncreaseRate', { required: true, min: 0, max: 20 })}
                  onChange={(val) => setValue('rentIncreaseRate', val || 0)}
                />
              </Grid.Col>
            </Grid>
          </Tabs.Panel>
        </Tabs>
        
        <Group position="right" mt="xl">
          <Button type="button" variant="outline" onClick={onCancel}>Abbrechen</Button>
          <Button type="submit" color="blue">Speichern</Button>
        </Group>
      </form>
    </Paper>
  );
}