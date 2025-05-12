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
  Loader
} from '@mantine/core';
import { formatCurrency } from '../../../lib/utils/formatters';

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
  
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchCustomerData();
    }
  }, [status, id]);
  
  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      // Fetch customer data
      const customerResponse = await fetch(`/api/customers/${id}`);
      if (!customerResponse.ok) throw new Error('Failed to fetch customer');
      const customerData = await customerResponse.json();
      setCustomer(customerData);
      
      // Fetch portfolios for this customer
      const portfoliosResponse = await fetch(`/api/portfolios?customerId=${id}`);
      if (!portfoliosResponse.ok) throw new Error('Failed to fetch portfolios');
      const portfoliosData = await portfoliosResponse.json();
      
      // Get the first (and likely only) portfolio
      if (portfoliosData.length > 0) {
        const firstPortfolio = portfoliosData[0];
        setPortfolio(firstPortfolio);
        
        // Fetch properties for this portfolio
        const propertiesResponse = await fetch(`/api/properties?portfolioId=${firstPortfolio.id}`);
        if (propertiesResponse.ok) {
          const propertiesData = await propertiesResponse.json();
          setProperties(propertiesData);
        }
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.message || 'An error occurred');
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
  
  const viewPropertyDetails = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
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
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Zurück zum Dashboard
          </Button>
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
          <Button onClick={handleAddProperty} disabled={!portfolio}>
            Neue Immobilie hinzufügen
          </Button>
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
    </Container>
  );
}