// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { 
  Container, 
  Grid, 
  Title, 
  Text, 
  Button, 
  Card, 
  Group,
  Loader,
  SimpleGrid
} from '@mantine/core';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    // Fetch customers if authenticated
    if (status === 'authenticated') {
      fetchCustomers();
    }
  }, [status, router]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Container size="xl" py="xl" style={{ textAlign: 'center' }}>
        <Loader size="xl" />
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group position="apart" mb="xl">
        <Title>Dashboard</Title>
        <Button onClick={() => router.push('/customers/new')}>
          Neuen Kunden anlegen
        </Button>
      </Group>

      <Title order={2} mb="md">Ihre Kunden</Title>
      
      {customers.length === 0 ? (
        <Card withBorder p="xl" mb="xl">
          <Text align="center">
            Sie haben noch keine Kunden. Klicken Sie auf "Neuen Kunden anlegen", um loszulegen.
          </Text>
        </Card>
      ) : (
        <SimpleGrid cols={3} spacing="lg" breakpoints={[
          { maxWidth: 1200, cols: 2, spacing: 'md' },
          { maxWidth: 800, cols: 1, spacing: 'sm' },
        ]}>
          {customers.map((customer: any) => (
            <Card key={customer.id} withBorder shadow="sm" p="lg">
              <Title order={3}>{customer.name}</Title>
              <Text color="dimmed" mb="md">{customer.email}</Text>
              <Button fullWidth onClick={() => router.push(`/customers/${customer.id}`)}>
                Portfolios anzeigen
              </Button>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}