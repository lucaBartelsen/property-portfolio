// components/PropertyForm.tsx (refactored)
import { useState, useEffect } from 'react';
import {
  TextInput,
  Button,
  Group,
  Paper,
  Title,
  Tabs,
  Checkbox
} from '@mantine/core';
import { Property, PropertyDefaults } from '../lib/types';
import { DEFAULT_PROPERTY_VALUES } from '../lib/constants';
import { PropertyBasicInfo } from './property/PropertyBasicInfo';
import { PropertyPurchaseInfo } from './property/PropertyPurchaseInfo';
import { PropertyFinancing } from './property/PropertyFinancing';
import { PropertyOngoingCosts } from './property/PropertyOngoingCosts';
import { PropertyAppreciation } from './property/PropertyAppreciation';
import { usePropertyForm } from '../hooks/usePropertyValidation';

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
  
  // State for second loan option
  const [useSecondLoan, setUseSecondLoan] = useState<boolean>(
    property?.defaults.useSecondLoan || false
  );

  // Ensure numeric values are properly converted
  const ensureNumber = (value: any): number => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Initialize form with property data or defaults
  const { 
    reset,
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors },
    getValidatedProperty
  } = usePropertyForm(property);
  
  // Effect to set form values when property changes or on component mount
  useEffect(() => {
    if (property) {
      // Reset form with property values when editing
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
        loanAmount1: ensureNumber(property.defaults.loanAmount1 || property.defaults.loanAmount || 0),
        interestRate1: ensureNumber(property.defaults.interestRate1 || property.defaults.interestRate || 0),
        repaymentRate1: ensureNumber(property.defaults.repaymentRate1 || property.defaults.repaymentRate || 0),
        useSecondLoan: !!property.defaults.useSecondLoan,
        loanAmount2: ensureNumber(property.defaults.loanAmount2 || 0),
        interestRate2: ensureNumber(property.defaults.interestRate2 || 0),
        repaymentRate2: ensureNumber(property.defaults.repaymentRate2 || 0),
        monthlyRent: ensureNumber(property.defaults.monthlyRent),
        vacancyRate: ensureNumber(property.defaults.vacancyRate),
        propertyTax: ensureNumber(property.defaults.propertyTax),
        managementFee: ensureNumber(property.defaults.managementFee),
        maintenanceReserve: ensureNumber(property.defaults.maintenanceReserve),
        insurance: ensureNumber(property.defaults.insurance),
        appreciationRate: ensureNumber(property.defaults.appreciationRate),
        rentIncreaseRate: ensureNumber(property.defaults.rentIncreaseRate),
      });
      
      // Set financing type and second loan state
      setFinancingType(property.defaults.financingType || 'loan');
      setUseSecondLoan(!!property.defaults.useSecondLoan);
    } else {
      // Use default values for new property
      reset({
        name: 'Neue Immobilie',
        ...DEFAULT_PROPERTY_VALUES,
        loanAmount1: DEFAULT_PROPERTY_VALUES.purchasePrice - DEFAULT_PROPERTY_VALUES.downPayment,
      });
      
      // Set default financing type
      setFinancingType(DEFAULT_PROPERTY_VALUES.financingType);
      setUseSecondLoan(false);
    }
  }, [property, reset]);

  const onSubmit = (data: any) => {
  // Get validated property with all conversions applied
    const validatedProperty = getValidatedProperty(data);
    
    // Update financing options from component state
    validatedProperty.defaults.financingType = financingType;
    validatedProperty.defaults.useSecondLoan = useSecondLoan;
    
    // Save the property
    onSave(validatedProperty);
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
            <PropertyBasicInfo
              watch={watch} 
              setValue={setValue} 
              errors={errors}
            />
          </Tabs.Panel>

          {/* Kaufpreisaufteilung Tab */}
          <Tabs.Panel value="kaufpreisaufteilung" pt="xs">
            <PropertyPurchaseInfo
              watch={watch} 
              setValue={setValue} 
              errors={errors}
            />
          </Tabs.Panel>

          {/* Finanzierung Tab */}
          <Tabs.Panel value="finanzierung" pt="xs">
            <PropertyFinancing
              watch={watch} 
              setValue={setValue} 
              errors={errors}
              financingType={financingType}
              setFinancingType={setFinancingType}
              useSecondLoan={useSecondLoan}
              setUseSecondLoan={setUseSecondLoan}
            />
          </Tabs.Panel>

          {/* Vermietung Tab */}
          <Tabs.Panel value="vermietung" pt="xs">
            <PropertyOngoingCosts
              watch={watch} 
              setValue={setValue} 
              errors={errors}
            />
          </Tabs.Panel>

          {/* Kapitalwert & Rendite Tab */}
          <Tabs.Panel value="rendite" pt="xs">
            <PropertyAppreciation
              watch={watch} 
              setValue={setValue} 
              errors={errors}
            />
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