// src/components/PropertyForm.tsx
import { useState, useEffect } from 'react';
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

  // Ensure numeric values are properly converted to numbers
  const ensureNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Initialize form with property data or defaults
  const { register, handleSubmit, watch, setValue, control, formState: { errors }, reset } = useForm<PropertyDefaults & { name: string }>();
  
  // Effect to set form values when property changes or on component mount
  useEffect(() => {
    if (property) {
      // Reset form with property values when editing existing property, ensuring all values are properly typed
      reset({
        name: property.name,
        purchasePrice: ensureNumber(property.defaults.purchasePrice),
        bundesland: property.defaults.bundesland || DEFAULT_PROPERTY_VALUES.bundesland,
        notaryRate: ensureNumber(property.defaults.notaryRate),
        brokerRate: ensureNumber(property.defaults.brokerRate),
        brokerAsConsulting: !!property.defaults.brokerAsConsulting,
        depreciationRate: ensureNumber(property.defaults.depreciationRate),
        landValue: ensureNumber(property.defaults.landValue),
        buildingValue: ensureNumber(property.defaults.buildingValue),
        maintenanceCost: ensureNumber(property.defaults.maintenanceCost),
        furnitureValue: ensureNumber(property.defaults.furnitureValue),
        maintenanceDistribution: ensureNumber(property.defaults.maintenanceDistribution),
        financingType: property.defaults.financingType || 'loan',
        downPayment: ensureNumber(property.defaults.downPayment),
        interestRate: ensureNumber(property.defaults.interestRate),
        repaymentRate: ensureNumber(property.defaults.repaymentRate),
        monthlyRent: ensureNumber(property.defaults.monthlyRent),
        vacancyRate: ensureNumber(property.defaults.vacancyRate),
        propertyTax: ensureNumber(property.defaults.propertyTax),
        managementFee: ensureNumber(property.defaults.managementFee),
        maintenanceReserve: ensureNumber(property.defaults.maintenanceReserve),
        insurance: ensureNumber(property.defaults.insurance),
        appreciationRate: ensureNumber(property.defaults.appreciationRate),
        rentIncreaseRate: ensureNumber(property.defaults.rentIncreaseRate),
      });
      
      // Also set the financing type state
      setFinancingType(property.defaults.financingType || 'loan');
    } else {
      // Use default values for new property
      reset({
        name: 'Neue Immobilie',
        purchasePrice: DEFAULT_PROPERTY_VALUES.purchasePrice,
        bundesland: DEFAULT_PROPERTY_VALUES.bundesland,
        notaryRate: DEFAULT_PROPERTY_VALUES.notaryRate,
        brokerRate: DEFAULT_PROPERTY_VALUES.brokerRate,
        brokerAsConsulting: DEFAULT_PROPERTY_VALUES.brokerAsConsulting,
        depreciationRate: DEFAULT_PROPERTY_VALUES.depreciationRate,
        landValue: DEFAULT_PROPERTY_VALUES.landValue,
        buildingValue: DEFAULT_PROPERTY_VALUES.buildingValue,
        maintenanceCost: DEFAULT_PROPERTY_VALUES.maintenanceCost,
        furnitureValue: DEFAULT_PROPERTY_VALUES.furnitureValue,
        maintenanceDistribution: DEFAULT_PROPERTY_VALUES.maintenanceDistribution,
        financingType: DEFAULT_PROPERTY_VALUES.financingType,
        downPayment: DEFAULT_PROPERTY_VALUES.downPayment,
        interestRate: DEFAULT_PROPERTY_VALUES.interestRate,
        repaymentRate: DEFAULT_PROPERTY_VALUES.repaymentRate,
        monthlyRent: DEFAULT_PROPERTY_VALUES.monthlyRent,
        vacancyRate: DEFAULT_PROPERTY_VALUES.vacancyRate,
        propertyTax: DEFAULT_PROPERTY_VALUES.propertyTax,
        managementFee: DEFAULT_PROPERTY_VALUES.managementFee,
        maintenanceReserve: DEFAULT_PROPERTY_VALUES.maintenanceReserve,
        insurance: DEFAULT_PROPERTY_VALUES.insurance,
        appreciationRate: DEFAULT_PROPERTY_VALUES.appreciationRate,
        rentIncreaseRate: DEFAULT_PROPERTY_VALUES.rentIncreaseRate,
      });
      
      // Set default financing type
      setFinancingType(DEFAULT_PROPERTY_VALUES.financingType);
    }
  }, [property, reset]);

 // Watch values for validation
  const watchPurchasePrice = watch('purchasePrice');
  const watchLandValue = watch('landValue');
  const watchBuildingValue = watch('buildingValue');
  const watchMaintenanceCost = watch('maintenanceCost');
  const watchFurnitureValue = watch('furnitureValue');

  // Convert to numbers with fallbacks
  const purchasePrice = ensureNumber(watchPurchasePrice);
  const landValue = ensureNumber(watchLandValue);
  const buildingValue = ensureNumber(watchBuildingValue);
  const maintenanceCost = ensureNumber(watchMaintenanceCost);
  const furnitureValue = ensureNumber(watchFurnitureValue);

  // Calculate total allocation with maintenance cost included
  const totalAllocation = landValue + buildingValue + maintenanceCost + furnitureValue;
  const allocationError = Math.abs(totalAllocation - purchasePrice) > 1;

  const onSubmit = (data: PropertyDefaults & { name: string }) => {
    const { name, ...formDefaults } = data;
    
    // Convert all numeric values to ensure they are numbers
    const defaults = {
      ...formDefaults,
      purchasePrice: ensureNumber(formDefaults.purchasePrice),
      notaryRate: ensureNumber(formDefaults.notaryRate),
      brokerRate: ensureNumber(formDefaults.brokerRate),
      depreciationRate: ensureNumber(formDefaults.depreciationRate),
      landValue: ensureNumber(formDefaults.landValue),
      buildingValue: ensureNumber(formDefaults.buildingValue),
      maintenanceCost: ensureNumber(formDefaults.maintenanceCost),
      furnitureValue: ensureNumber(formDefaults.furnitureValue),
      maintenanceDistribution: ensureNumber(formDefaults.maintenanceDistribution),
      downPayment: ensureNumber(formDefaults.downPayment),
      interestRate: ensureNumber(formDefaults.interestRate),
      repaymentRate: ensureNumber(formDefaults.repaymentRate),
      monthlyRent: ensureNumber(formDefaults.monthlyRent),
      vacancyRate: ensureNumber(formDefaults.vacancyRate),
      propertyTax: ensureNumber(formDefaults.propertyTax),
      managementFee: ensureNumber(formDefaults.managementFee),
      maintenanceReserve: ensureNumber(formDefaults.maintenanceReserve),
      insurance: ensureNumber(formDefaults.insurance),
      appreciationRate: ensureNumber(formDefaults.appreciationRate),
      rentIncreaseRate: ensureNumber(formDefaults.rentIncreaseRate),
      financingType,
    };
    
    if (isEditing && property) {
      // Update existing property
      const updatedProperty: Property = {
        ...property,
        name,
        defaults,
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
        defaults,
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
                  precision={0}
                  value={watch('purchasePrice')}
                  onChange={(val) => setValue('purchasePrice', ensureNumber(val))}
                  error={errors.purchasePrice?.message}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Controller
                  name="bundesland"
                  control={control}
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
                <Controller
                  name="maintenanceDistribution"
                  control={control}
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
                    precision={0}
                    value={watch('downPayment')}
                    onChange={(val) => setValue('downPayment', ensureNumber(val))}
                    error={errors.downPayment?.message}
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
                    value={watch('interestRate')}
                    onChange={(val) => setValue('interestRate', ensureNumber(val))}
                    error={errors.interestRate?.message}
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
                    value={watch('repaymentRate')}
                    onChange={(val) => setValue('repaymentRate', ensureNumber(val))}
                    error={errors.repaymentRate?.message}
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