// pages/portfolios/[id]/properties/new.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Title,
  Button,
  Group,
  Text,
  Loader
} from '@mantine/core';
import PropertyForm from '../../../../components/PropertyForm';
import { createNewProperty } from '../../../../store/PropertyContext';
import { Property } from '../../../../lib/types';
import { PropertyApiService, PortfolioApiService } from '../../../../services/apiService';

export default function NewProperty() {
  const router = useRouter();
  const { id: portfolioId } = router.query;
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (status === 'authenticated' && portfolioId) {
      fetchPortfolio();
    }
  }, [status, portfolioId]);
  
  const fetchPortfolio = async () => {
    try {
      // Fetch portfolio data to verify it exists and get customer info
      const portfolioData = await PortfolioApiService.getPortfolio(portfolioId as string);
      setPortfolio(portfolioData);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError(error instanceof Error ? error.message : 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveProperty = async (property: Property) => {
    setLoading(true);
    try {
      // Use API service to create property
      await PropertyApiService.createProperty(property, portfolioId as string);
      
      // Get customer ID from portfolio
      const customerId = portfolio?.customerId;
      
      // Navigate back to customer page
      if (customerId) {
        router.push(`/customers/${customerId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error saving property:', error);
      setError(error instanceof Error ? error.message : 'Failed to create property');
      setLoading(false);
    }
  };
  
  if (status === 'loading' || (loading && !error)) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center' }}>
        <Loader size="xl" />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Title order={2} mb="md">Fehler</Title>
          <Text color="red">{error}</Text>
          <Button mt="md" onClick={() => router.back()}>
            Zurück
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // Create a new property with default values
  const newProperty = createNewProperty(`Neue Immobilie`);
  
  return (
    <Container size="lg" py="xl">
      <Paper p="md" withBorder mb="xl">
        <Group position="apart">
          <Title order={2}>Neue Immobilie hinzufügen</Title>
          <Button variant="outline" onClick={() => router.back()}>
            Abbrechen
          </Button>
        </Group>
      </Paper>
      
      <PropertyForm
        property={newProperty}
        onSave={handleSaveProperty}
        onCancel={() => router.back()}
      />
    </Container>
  );
}