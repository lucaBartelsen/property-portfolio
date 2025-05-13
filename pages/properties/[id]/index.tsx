// pages/properties/[id]/index.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Tabs,
  Loader
} from '@mantine/core';
import PropertyDetails from '../../../components/PropertyDetails';
import CashflowChart from '../../../components/CashflowChart';
import YearTable from '../../../components/YearTable';
import { Property } from '../../../lib/types';
import { usePropertyStore } from '@/store/PropertyContext';

export default function PropertyDetailPage() {

  const { state, dispatch } = usePropertyStore();
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchPropertyData();
    }
  }, [status, id]);
  
  const fetchPropertyData = async () => {
  setLoading(true);
  try {
    // Fetch property data
    const response = await fetch(`/api/properties/${id}`);
    if (!response.ok) throw new Error('Failed to fetch property');
    
    const data = await response.json();
    setProperty(data);

    // Now also fetch the tax info for this property's customer
    // The property should include the portfolio and customer reference
    if (data.portfolio?.customer?.id) {
      const customerId = data.portfolio.customer.id;
      const taxResponse = await fetch(`/api/customers/${customerId}/tax-info`);
      
      if (taxResponse.ok) {
        const taxInfo = await taxResponse.json();
        // Update the tax info in the global store
        dispatch({ type: 'UPDATE_TAX_INFO', taxInfo: {
          annualIncome: taxInfo.annualIncome,
          taxStatus: taxInfo.taxStatus,
          hasChurchTax: taxInfo.hasChurchTax,
          churchTaxRate: taxInfo.churchTaxRate,
          taxRate: taxInfo.taxRate
        }});
        
      }
    }
  } catch (error: any) {
    console.error('Error fetching property:', error);
    setError(error.message || 'An error occurred');
  } finally {
    setLoading(false);
  }
};
  
  const handleDeleteProperty = async () => {
    if (!property) return;
    
    if (!confirm('Sind Sie sicher, dass Sie diese Immobilie löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/properties/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete property');
      }
      
      // Navigate back to the customer page
      const portfolio = property.portfolio;
      if (portfolio?.customer?.id) {
        router.push(`/customers/${portfolio.customer.id}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred while deleting the property');
      setLoading(false);
    }
  };
  
  const handleEditProperty = () => {
    // Navigate to edit page
    router.push(`/properties/${id}/edit`);
  };
  
  const navigateBack = () => {
    // Navigate back to the customer page if possible
    if (property?.portfolio?.customer?.id) {
      router.push(`/customers/${property.portfolio.customer.id}`);
    } else {
      router.push('/dashboard');
    }
  };
  
  if (status === 'loading' || (loading && !error)) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center' }}>
        <Loader size="xl" />
      </Container>
    );
  }
  
  if (!property && !loading) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Title order={2} mb="md">Fehler</Title>
          <Text color="red">{error || 'Immobilie nicht gefunden'}</Text>
          <Button mt="md" onClick={() => router.back()}>
            Zurück
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container size="lg" py="xl">
      <Paper p="md" withBorder mb="md">
        <Group position="apart">
          <Title order={2}>{property?.name}</Title>
          <Group>
            <Button variant="outline" color="blue" onClick={handleEditProperty}>
              Bearbeiten
            </Button>
            <Button variant="outline" color="red" onClick={handleDeleteProperty}>
              Löschen
            </Button>
            <Button variant="outline" onClick={navigateBack}>
              Zurück
            </Button>
          </Group>
        </Group>
      </Paper>
      
      <Tabs value={activeTab} onTabChange={(value) => setActiveTab(value as string)}>
        <Tabs.List mb="md">
          <Tabs.Tab value="overview">Übersicht</Tabs.Tab>
          <Tabs.Tab value="cashflow">Cashflow</Tabs.Tab>
          <Tabs.Tab value="yeartable">Jahrestabelle</Tabs.Tab>
        </Tabs.List>
        
        <Tabs.Panel value="overview">
          {property && <PropertyDetails property={property} onBack={navigateBack} />}
        </Tabs.Panel>
        
        <Tabs.Panel value="cashflow">
          {property && <CashflowChart property={property} onBack={navigateBack} />}
        </Tabs.Panel>
        
        <Tabs.Panel value="yeartable">
          {property && <YearTable property={property} onBack={navigateBack} />}
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}