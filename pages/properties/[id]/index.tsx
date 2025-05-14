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
import { CustomerApiService, PropertyApiService } from '@/services/apiService';

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
    try {
      setLoading(true);
      const propertyData = await PropertyApiService.getProperty(id as string);
      setProperty(propertyData);
      
      // If you need to fetch tax info, use CustomerApiService
      if (propertyData?.portfolio?.customer?.id) {
        const customerId = propertyData.portfolio.customer.id;
        const taxInfo = await CustomerApiService.getTaxInfo(customerId);
        if (taxInfo) {
          dispatch({ type: 'UPDATE_TAX_INFO', taxInfo });
        }
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch property');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteProperty = async () => {
    if (!property) return;
    
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      await PropertyApiService.deleteProperty(id as string);
      
      // Navigate back to the customer page
      const portfolio = property.portfolio;
      if (portfolio?.customerId) {
        router.push(`/customers/${portfolio.customerId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting property:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete property');
      setLoading(false);
    }
  };
  
  const handleEditProperty = () => {
    // Navigate to edit page
    router.push(`/properties/${id}/edit`);
  };
  
  const navigateBack = () => {
    // Navigate back to the customer page if possible
    if (property?.portfolio?.customerId) {
      router.push(`/customers/${property.portfolio.customerId}`);
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