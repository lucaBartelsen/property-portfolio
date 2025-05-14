// hooks/usePropertyValidation.ts (updated)
import { useForm } from 'react-hook-form';
import { Property, PropertyDefaults } from '../lib/types';
import { DataValidator } from '../lib/utils/validation';
import { DEFAULT_PROPERTY_VALUES } from '../lib/constants';

export function usePropertyForm(initialProperty?: Property) {
  // Get default values from initial property or use defaults
  const getDefaultValues = () => {
    if (initialProperty) {
      return {
        name: initialProperty.name,
        ...initialProperty.defaults
      };
    }
    
    return {
      name: 'Neue Immobilie',
      ...DEFAULT_PROPERTY_VALUES
    };
  };
  
  // Use react-hook-form with validation
  const form = useForm({
    defaultValues: getDefaultValues(),
    // Add validation rules if needed
  });
  
  // Helper to get a validated property object from form data
  const getValidatedProperty = (formData: any): Property => {
    const { name, ...defaults } = formData;
    
    // Create a property with validated defaults
    const validatedDefaults = DataValidator.normalizePropertyDefaults(defaults);
    
    return {
      id: initialProperty?.id || 'new',
      name,
      defaults: validatedDefaults,
      purchaseData: initialProperty?.purchaseData || null,
      ongoingData: initialProperty?.ongoingData || null,
      calculationResults: initialProperty?.calculationResults || null,
      yearlyData: initialProperty?.yearlyData || null
    };
  };
  
  return {
    ...form,
    getValidatedProperty
  };
}