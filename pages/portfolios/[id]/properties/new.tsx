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
      const response = await fetch(`/api/portfolios/${portfolioId}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      
      const portfolioData = await response.json();
      setPortfolio(portfolioData);
    } catch (error: any) {
      console.error('Error fetching portfolio:', error);
      setError(error.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveProperty = async (property: Property) => {
    setLoading(true);
    try {
      // Prepare property data for saving
      const propertyData = {
        name: property.name,
        portfolioId: portfolioId as string,
        defaults: property.defaults
      };
      
      // Save property
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create property');
      }
      
      // Get customer ID from portfolio
      const customerId = portfolio?.customerId;
      
      // Navigate back to customer page
      if (customerId) {
        router.push(`/customers/${customerId}`);
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Error saving property:', error);
      setError(error.message || 'An error occurred while saving the property');
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