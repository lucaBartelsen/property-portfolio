// pages/dashboard.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Card, 
  Group,
  Loader,
  SimpleGrid,
  Divider
} from '@mantine/core';
import { Layout } from '../components/layout/Layout';
import { useApiData } from '../hooks/useApiData';

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { data: customers, loading, error } = useApiData<any[]>('/api/customers');
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status
  useEffect(() => {
    if (status === 'authenticated') {
      checkIfAdmin();
    }
  }, [status]);

  const checkIfAdmin = async () => {
    try {
      const response = await fetch('/api/admin/users');
      setIsAdmin(response.ok);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const navigateToCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  const navigateToNewCustomer = () => {
    router.push('/customers/new');
  };

  return (
    <Layout>
      <Container size="xl" py="xl">
        <Group position="apart" mb="xl">
          <Title>Dashboard</Title>
          <Button onClick={navigateToNewCustomer}>
            Neuen Kunden anlegen
          </Button>
        </Group>

        <Title order={2} mb="md">Ihre Kunden</Title>
        
        {loading ? (
          <Card withBorder p="xl" mb="xl" style={{ textAlign: 'center' }}>
            <Loader />
          </Card>
        ) : error ? (
          <Card withBorder p="xl" mb="xl">
            <Text color="red">{error}</Text>
          </Card>
        ) : customers?.length === 0 ? (
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
            {customers?.map((customer: any) => (
              <Card key={customer.id} withBorder shadow="sm" p="lg">
                <Title order={3}>{customer.name}</Title>
                <Text color="dimmed" mb="md">{customer.email || ''}</Text>
                <Button fullWidth onClick={() => navigateToCustomer(customer.id)}>
                  Portfolios anzeigen
                </Button>
              </Card>
            ))}
          </SimpleGrid>
        )}
        
        {isAdmin && (
          <>
            <Divider my="xl" />
            <Title order={2} mb="md">Administrator-Funktionen</Title>
            <SimpleGrid cols={2} spacing="lg" breakpoints={[
              { maxWidth: 800, cols: 1, spacing: 'md' },
            ]}>
              <Card withBorder shadow="sm" p="lg">
                <Title order={3}>Benutzerverwaltung</Title>
                <Text mb="md">Benutzer erstellen, bearbeiten oder löschen.</Text>
                <Button fullWidth onClick={() => router.push('/admin/users')}>
                  Zur Benutzerverwaltung
                </Button>
              </Card>
            </SimpleGrid>
          </>
        )}
      </Container>
    </Layout>
  );
}