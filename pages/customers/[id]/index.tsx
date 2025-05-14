// pages/customers/[id]/index.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Grid,
  Card,
  Stack,
  Loader,
  Modal,
  ActionIcon,
  Menu,
  TextInput,
  Textarea,
  NumberInput,
  Radio,
  Select,
  Switch,
  Divider
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import { formatCurrency } from '../../../lib/utils/formatters';
import { calculateTaxInfo } from '../../../lib/calculators/taxCalculator';
import { usePropertyStore } from '@/store/PropertyContext';
import { CustomerApiService, PortfolioApiService, PropertyApiService } from '../../../services/apiService';
import { CustomerMapper } from '@/lib/dto/CustomerDto';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  taxInfo?: {
    id: string;
    annualIncome: number;
    taxStatus: 'single' | 'married';
    hasChurchTax: boolean;
    churchTaxRate: number;
    taxRate: number;
  };
}

interface Portfolio {
  id: string;
  name: string;
}

interface Property {
  id: string;
  name: string;
  purchaseData: any;
  calculationResults: any;
}

export default function CustomerDetail() {
  const { state, dispatch } = usePropertyStore();
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form setup
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
      taxRate: 0
    }
  });
  
  // Watch for form values
  const hasChurchTax = watch('hasChurchTax');
  
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchCustomerData();
    }
  }, [status, id]);
  
  // Populate form with customer data when opening edit modal
  useEffect(() => {
    if (customer && editModalOpen) {
      setValue('name', customer.name);
      setValue('email', customer.email || '');
      setValue('phone', customer.phone || '');
      setValue('notes', customer.notes || '');
      
      if (customer.taxInfo) {
        setValue('annualIncome', customer.taxInfo.annualIncome);
        setValue('taxStatus', customer.taxInfo.taxStatus);
        setValue('hasChurchTax', customer.taxInfo.hasChurchTax);
        setValue('churchTaxRate', customer.taxInfo.churchTaxRate);
        setValue('taxRate', customer.taxInfo.taxRate);
      }
    }
  }, [customer, editModalOpen, setValue]);
  
  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // Fetch customer data
      const customerData = await CustomerApiService.getCustomer(id as string);
      setCustomer(customerData);
      
      // Update tax info in the store if available
      if (customerData.taxInfo) {
        dispatch({ type: 'UPDATE_TAX_INFO', taxInfo: CustomerMapper.mapTaxInfo(customerData.taxInfo) });
      }
      
      // Fetch portfolios for this customer
      const portfoliosData = await PortfolioApiService.getPortfoliosByCustomer(id as string);
      
      // Get the first (and likely only) portfolio
      if (portfoliosData.length > 0) {
        const firstPortfolio = portfoliosData[0];
        setPortfolio(firstPortfolio);
        
        // Fetch properties for this portfolio
        try {
          const propertiesData = await PropertyApiService.getPropertiesByPortfolio(firstPortfolio.id);
          setProperties(propertiesData);
        } catch (propertiesError) {
          console.error('Error fetching properties:', propertiesError);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddProperty = () => {
    if (portfolio) {
      router.push(`/portfolios/${portfolio.id}/properties/new`);
    } else {
      setError('Kein Portfolio gefunden. Bitte erstellen Sie zuerst ein Portfolio.');
    }
  };
  
  const handleViewPortfolio = () => {
    if (portfolio) {
        router.push(`/portfolio-overview?customerId=${id}&portfolioId=${portfolio.id}`);
    } else {
        setError('Kein Portfolio gefunden. Bitte erstellen Sie zuerst ein Portfolio.');
    }
    };
  
  const viewPropertyDetails = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };
  
  const handleDeleteCustomer = async () => {
    setIsSubmitting(true);
    try {
      await CustomerApiService.deleteCustomer(id as string);
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while deleting the customer');
    } finally {
      setIsSubmitting(false);
      setDeleteModalOpen(false);
    }
  };
  
  // Replace handleUpdateCustomer with:
  const handleUpdateCustomer = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Update basic customer information
      const customerData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        notes: data.notes
      };
      
      await CustomerApiService.updateCustomer(id as string, customerData);
      
      // Update tax info if it exists
      const taxInfo = {
        annualIncome: data.annualIncome,
        taxStatus: data.taxStatus,
        hasChurchTax: data.hasChurchTax,
        churchTaxRate: data.churchTaxRate,
        taxRate: data.taxRate
      };
      
      await CustomerApiService.updateTaxInfo(id as string, taxInfo);
      
      // Update the tax info in the store
      dispatch({ type: 'UPDATE_TAX_INFO', taxInfo });
      
      // Refresh the data
      await fetchCustomerData();
      setEditModalOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while updating the customer');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center' }}>
        <Loader size="xl" />
      </Container>
    );
  }
  
  if (!customer) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Text color="red">{error || 'Kunde nicht gefunden'}</Text>
          <Button mt="md" onClick={() => router.push('/dashboard')}>
            Zurück zum Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container size="lg" py="xl">
      <Paper p="xl" withBorder mb="xl">
        <Group position="apart" mb="md">
          <Title order={2}>{customer.name}</Title>
          <Group>
            <Button variant="outline" color="blue" onClick={() => setEditModalOpen(true)}>
              Bearbeiten
            </Button>
            <Button variant="outline" color="red" onClick={() => setDeleteModalOpen(true)}>
              Löschen
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Zurück zum Dashboard
            </Button>
          </Group>
        </Group>
        
        <Grid>
          <Grid.Col span={12} md={6}>
            <Stack spacing="xs">
              <Text weight={500}>E-Mail:</Text>
              <Text>{customer.email || '-'}</Text>
              
              <Text weight={500} mt="md">Telefon:</Text>
              <Text>{customer.phone || '-'}</Text>
              
              {customer.notes && (
                <>
                  <Text weight={500} mt="md">Notizen:</Text>
                  <Text>{customer.notes}</Text>
                </>
              )}
            </Stack>
          </Grid.Col>
          
          <Grid.Col span={12} md={6}>
            {customer.taxInfo ? (
              <Stack spacing="xs">
                <Text weight={500}>Steuerinformationen:</Text>
                <Text>Jahreseinkommen: {formatCurrency(customer.taxInfo.annualIncome)}</Text>
                <Text>Steuerlicher Status: {customer.taxInfo.taxStatus === 'single' ? 'Alleinstehend' : 'Verheiratet'}</Text>
                <Text>Kirchensteuer: {customer.taxInfo.hasChurchTax ? `Ja (${customer.taxInfo.churchTaxRate}%)` : 'Nein'}</Text>
                <Text>Steuersatz: {customer.taxInfo.taxRate}%</Text>
              </Stack>
            ) : (
              <Text color="dimmed">Keine Steuerinformationen verfügbar</Text>
            )}
          </Grid.Col>
        </Grid>
      </Paper>
      
      <Paper p="xl" withBorder>
        <Group position="apart" mb="xl">
          <Title order={3}>Immobilien</Title>
          <Group>
            <Button onClick={handleAddProperty} disabled={!portfolio}>
              Neue Immobilie hinzufügen
            </Button>
            <Button 
              variant="outline" 
              color="blue" 
              onClick={handleViewPortfolio}
              disabled={!portfolio || properties.length === 0}
            >
              Portfolio-Übersicht
            </Button>
          </Group>
        </Group>
        
        {error && (
          <Text color="red" mb="md">{error}</Text>
        )}
        
        {properties.length === 0 ? (
          <Text color="dimmed" align="center" py="xl">
            Keine Immobilien gefunden. Klicken Sie auf "Neue Immobilie hinzufügen", um loszulegen.
          </Text>
        ) : (
          <Grid>
            {properties.map((property) => (
              <Grid.Col key={property.id} span={12} md={6} lg={4}>
                <Card shadow="sm" p="lg" withBorder>
                  <Title order={4} mb="md">{property.name}</Title>
                  
                  {property.purchaseData && (
                    <Text>Kaufpreis: {formatCurrency(property.purchaseData.purchasePrice)}</Text>
                  )}
                  
                  {property.calculationResults && (
                    <>
                      <Text>Monatlicher Cashflow: {formatCurrency(property.calculationResults.monthlyCashflow)}</Text>
                      <Text>ROI: {((property.calculationResults.monthlyCashflow * 12 / property.calculationResults.initialEquity) * 100).toFixed(2)} %</Text>
                    </>
                  )}
                  
                  <Button
                    fullWidth
                    mt="md"
                    onClick={() => viewPropertyDetails(property.id)}
                  >
                    Details anzeigen
                  </Button>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        )}
        
        {!portfolio && (
          <Text color="orange" mt="md">
            Es wurde kein Portfolio für diesen Kunden gefunden. Bitte kontaktieren Sie den Administrator.
          </Text>
        )}
      </Paper>
      
      {/* Edit Customer Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Kundendaten bearbeiten"
        size="lg"
      >
        <form onSubmit={handleSubmit(handleUpdateCustomer)}>
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
                onChange={(val) => setValue('annualIncome', val || 0)}
                error={errors.annualIncome?.message}
              />
            </Grid.Col>
            
            <Grid.Col span={12} md={6}>
              <Radio.Group
                label="Steuerlicher Status"
                required
                value={watch('taxStatus')}
                onChange={(val) => setValue('taxStatus', val)}
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
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Speichern
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Kunde löschen"
        size="sm"
      >
        <Text mb="xl">
          Sind Sie sicher, dass Sie den Kunden "{customer.name}" und alle damit verbundenen Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
        </Text>
        <Group position="right">
          <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Abbrechen
          </Button>
          <Button color="red" onClick={handleDeleteCustomer} loading={isSubmitting}>
            Löschen
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}