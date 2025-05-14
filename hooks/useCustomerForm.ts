// hooks/useCustomerForm.ts (updated)
import { useForm } from 'react-hook-form';
import { CustomerResponseDto } from '../lib/dto/CustomerDto';
import { DataValidator } from '../lib/utils/validation';

export function useCustomerForm(initialCustomer?: CustomerResponseDto) {
  // Get default values from initial customer or use defaults
  const getDefaultValues = () => {
    if (initialCustomer) {
      return {
        name: initialCustomer.name,
        email: initialCustomer.email || '',
        phone: initialCustomer.phone || '',
        notes: initialCustomer.notes || '',
        // Tax info
        annualIncome: initialCustomer.taxInfo?.annualIncome || 70000,
        taxStatus: initialCustomer.taxInfo?.taxStatus || 'single',
        hasChurchTax: initialCustomer.taxInfo?.hasChurchTax || false,
        churchTaxRate: initialCustomer.taxInfo?.churchTaxRate || 9,
        taxRate: initialCustomer.taxInfo?.taxRate || 0
      };
    }
    
    return {
      name: '',
      email: '',
      phone: '',
      notes: '',
      // Tax info
      annualIncome: 70000,
      taxStatus: 'single',
      hasChurchTax: false,
      churchTaxRate: 9,
      taxRate: 0
    };
  };
  
  // Use react-hook-form with validation
  const form = useForm({
    defaultValues: getDefaultValues(),
    // Add validation if needed
  });
  
  // Helper to get validated tax info from form data
  const getValidatedTaxInfo = (formData: any) => {
    if (!formData) return null;
    
    const taxInfo = {
      annualIncome: formData.annualIncome,
      taxStatus: formData.taxStatus,
      hasChurchTax: formData.hasChurchTax,
      churchTaxRate: formData.churchTaxRate,
      taxRate: formData.taxRate
    };
    
    return DataValidator.normalizeTaxInfo(taxInfo);
  };
  
  // Helper to prepare customer create/update data from form
  const getCustomerData = (formData: any) => {
    return {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      notes: formData.notes,
      taxInfo: getValidatedTaxInfo(formData)
    };
  };
  
  return {
    ...form,
    getCustomerData,
    getValidatedTaxInfo
  };
}