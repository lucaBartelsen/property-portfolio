// pages/customers/new.tsx
import { useState, useEffect } from 'react'; // Add useEffect import
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Title,
  TextInput,
  NumberInput,
  Textarea,
  Button,
  Group,
  Switch,
  Select,
  Grid,
  Text,
  Divider,
  Radio,
  LoadingOverlay
} from '@mantine/core';
import { calculateGermanIncomeTax, calculateTaxInfo } from '../../lib/calculators/taxCalculator';
import { useCustomerForm } from '../../hooks/useCustomerForm';
import { CustomerApiService, PortfolioApiService } from '../../services/apiService';


export default function NewCustomer() {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form setup using react-hook-form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    getCustomerData
  } = useCustomerForm();
  
  // Watch values for conditional rendering and calculations
  const hasChurchTax = watch('hasChurchTax');
  const annualIncome = watch('annualIncome');
  const taxStatus = watch('taxStatus');
  
  // Update tax rate when income or status changes
  const updateTaxRate = () => {
    if (annualIncome) {
      const income = Number(annualIncome);
      const status = taxStatus as 'single' | 'married';
      
      // Use your existing tax calculator
      const incomeTax = calculateGermanIncomeTax(income, status);
      const taxRate = (incomeTax / income) * 100;
      
      setValue('taxRate', parseFloat(taxRate.toFixed(1)));
    }
  };
  
  // Use useEffect instead of useState for side effects
  useEffect(() => {
    updateTaxRate();
  }, [annualIncome, taxStatus]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Handle form submission
  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    
    try {
      // Get validated customer data
      const customerData = getCustomerData(data);
      
      // Step 1: Create the customer
      const customer = await CustomerApiService.createCustomer(customerData);
      
      // Step 2: Automatically create a default portfolio for this customer
      try {
        await PortfolioApiService.createPortfolio({
          name: `Portfolio von ${data.name}`,
          customerId: customer.id
        });
      } catch (portfolioError) {
        // If portfolio creation fails, we can still proceed with the customer
        console.warn('Failed to create default portfolio');
      }
      
      // Redirect to the customer detail page
      router.push(`/customers/${customer.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <Container size="lg" py="xl">
        <Text align="center">Loading...</Text>
      </Container>
    );
  }
  
  return (
    <Container size="lg" py="xl">
      <Paper shadow="md" p="xl" withBorder position="relative">
        <LoadingOverlay visible={loading} />
        <Title order={2} mb="lg">Neuen Kunden erstellen</Title>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid>
            {/* Customer Details Section */}
            <Grid.Col span={12}>
              <Title order={3} mb="md">Kundendaten</Title>
            </Grid.Col>
            
            <Grid.Col span={12} md={6}>
              <TextInput
                label="Name"
                placeholder="Vollständiger Name"
                required
                {...register('name', { required: 'Name ist erforderlich' })}
                error={errors.name?.message}
              />
            </Grid.Col>
            
            <Grid.Col span={12} md={6}>
              <TextInput
                label="E-Mail"
                placeholder="email@beispiel.de"
                {...register('email')}
                error={errors.email?.message}
              />
            </Grid.Col>
            
            <Grid.Col span={12} md={6}>
              <TextInput
                label="Telefon"
                placeholder="+49 123 4567890"
                {...register('phone')}
                error={errors.phone?.message}
              />
            </Grid.Col>
            
            <Grid.Col span={12}>
              <Textarea
                label="Notizen"
                placeholder="Zusätzliche Informationen zum Kunden"
                {...register('notes')}
                error={errors.notes?.message}
                minRows={3}
              />
            </Grid.Col>
            
            <Grid.Col span={12}>
              <Divider my="md" label="Steuerinformationen" labelPosition="center" />
            </Grid.Col>
            
            {/* Tax Information Section */}
            <Grid.Col span={12} md={6}>
              <NumberInput
                label="Zu versteuerndes Jahreseinkommen (€)"
                description="Brutto-Jahreseinkommen ohne Immobilieneinkünfte"
                required
                min={0}
                value={watch('annualIncome')}
                onChange={(val) => {
                  setValue('annualIncome', val || 0);
                }}
                error={errors.annualIncome?.message}
              />
            </Grid.Col>
            
            <Grid.Col span={12} md={6}>
              <Radio.Group
                label="Steuerlicher Status"
                required
                value={watch('taxStatus')}
                onChange={(val) => {
                  setValue('taxStatus', val);
                }}
                error={errors.taxStatus?.message}
              >
                <Radio value="single" label="Alleinstehend" />
                <Radio value="married" label="Verheiratet (Splitting-Verfahren)" />
              </Radio.Group>
            </Grid.Col>
            
            <Grid.Col span={12} md={6}>
              <Switch
                label="Kirchensteuer"
                checked={watch('hasChurchTax')}
                onChange={(event) => setValue('hasChurchTax', event.currentTarget.checked)}
              />
            </Grid.Col>
            
            {hasChurchTax && (
              <Grid.Col span={12} md={6}>
                <Select
                  label="Kirchensteuersatz (%)"
                  description="8% in Bayern und Baden-Württemberg, 9% in anderen Bundesländern"
                  data={[
                    { value: '8', label: '8%' },
                    { value: '9', label: '9%' },
                  ]}
                  value={watch('churchTaxRate').toString()}
                  onChange={(val) => setValue('churchTaxRate', parseInt(val || '9'))}
                  error={errors.churchTaxRate?.message}
                />
              </Grid.Col>
            )}
            
            <Grid.Col span={12} md={6}>
              <NumberInput
                label="Errechneter Steuersatz (%)"
                disabled
                value={watch('taxRate')}
                precision={1}
              />
            </Grid.Col>
            
            {error && (
              <Grid.Col span={12}>
                <Text color="red">{error}</Text>
              </Grid.Col>
            )}
            
            <Grid.Col span={12}>
              <Group position="right" mt="xl">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Abbrechen
                </Button>
                <Button type="submit">
                  Kunden erstellen
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}