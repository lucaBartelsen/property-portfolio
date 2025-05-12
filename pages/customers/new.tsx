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
import { useForm } from 'react-hook-form';
import { calculateGermanIncomeTax, calculateTaxInfo } from '../../lib/calculators/taxCalculator';

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
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      notes: '',
      // Tax info
      annualIncome: 70000,
      taxStatus: 'single',
      hasChurchTax: false,
      churchTaxRate: 9,
      taxRate: 0 // Will be calculated
    }
  });
  
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
      // Use your calculateTaxInfo function to get complete tax info
      const taxInfoData = calculateTaxInfo({
        annualIncome: data.annualIncome,
        taxStatus: data.taxStatus as 'single' | 'married',
        hasChurchTax: data.hasChurchTax,
        churchTaxRate: data.churchTaxRate,
        taxRate: data.taxRate
      });
      
      const customerData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes,
        taxInfo: taxInfoData
      };
      
      // Step 1: Create the customer
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create customer');
      }
      
      const customer = await response.json();
      
      // Step 2: Automatically create a default portfolio for this customer
      const portfolioResponse = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Portfolio von ${data.name}`,
          customerId: customer.id
        }),
      });
      
      if (!portfolioResponse.ok) {
        // If portfolio creation fails, we can still proceed with the customer
        console.warn('Failed to create default portfolio');
      } else {
        // Get the portfolio data if successful
        const portfolio = await portfolioResponse.json();
        console.log('Created portfolio:', portfolio);
      }
      
      // Redirect to the customer detail page
      router.push(`/customers/${customer.id}`);
    } catch (error: any) {
      setError(error.message || 'An error occurred');
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