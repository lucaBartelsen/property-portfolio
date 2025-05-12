// pages/properties/[id]/edit.tsx
// A page for editing property data

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
import PropertyForm from '../../../components/PropertyForm';
import { Property } from '../../../lib/types';

export default function EditProperty() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  
  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (status === 'authenticated' && id) {
      fetchPropertyData();
    }
  }, [status, id]);
  
  const fetchPropertyData = async () => {
    try {
      // Fetch property data
      const response = await fetch(`/api/properties/${id}`);
      if (!response.ok) throw new Error('Failed to fetch property');
      
      const data = await response.json();
      setProperty(data);
    } catch (error: any) {
      console.error('Error fetching property:', error);
      setError(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveProperty = async (updatedProperty: Property) => {
    setLoading(true);
    try {
      // Prepare property data for saving
      const propertyData = {
        name: updatedProperty.name,
        defaults: updatedProperty.defaults
      };
      
      // Update property
      const response = await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(propertyData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update property');
      }
      
      // Navigate back to property details page
      router.push(`/properties/${id}`);
    } catch (error: any) {
      console.error('Error updating property:', error);
      setError(error.message || 'An error occurred while saving the property');
      setLoading(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center' }}>
        <Loader size="xl" />
      </Container>
    );
  }
  
  if (error || !property) {
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
      <Paper p="md" withBorder mb="xl">
        <Group position="apart">
          <Title order={2}>Immobilie bearbeiten: {property.name}</Title>
          <Button variant="outline" onClick={() => router.back()}>
            Abbrechen
          </Button>
        </Group>
      </Paper>
      
      <PropertyForm
        property={property}
        onSave={handleSaveProperty}
        onCancel={() => router.back()}
      />
    </Container>
  );
}