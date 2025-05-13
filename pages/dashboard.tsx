// pages/dashboard.tsx
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
  SimpleGrid,
  Header,
  Menu,
  Avatar,
  ActionIcon,
  Divider,
  Modal,
  PasswordInput,
  Box
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  const handleChangePassword = async () => {
    // Reset states
    setPasswordError('');
    setPasswordSuccess('');
    setIsSubmitting(true);

    // Basic validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Alle Felder müssen ausgefüllt werden.');
      setIsSubmitting(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Die neuen Passwörter stimmen nicht überein.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Passwortänderung fehlgeschlagen');
      }

      // Success
      setPasswordSuccess('Passwort erfolgreich geändert!');
      // Reset form after success
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal after a short delay
      setTimeout(() => {
        closePasswordModal();
        setPasswordSuccess('');
      }, 2000);
      
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError('Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (status === 'loading' || loading) {
    return (
      <Box>
        <DashboardHeader session={session} onLogout={handleLogout} onPasswordChange={openPasswordModal} />
        <Container size="xl" py="xl" style={{ textAlign: 'center' }}>
          <Loader size="xl" />
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <DashboardHeader session={session} onLogout={handleLogout} onPasswordChange={openPasswordModal} />
      
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

      {/* Password Change Modal */}
      <Modal
        opened={passwordModalOpened}
        onClose={closePasswordModal}
        title="Passwort ändern"
        size="sm"
      >
        <div>
          {passwordSuccess && (
            <Text color="green" mb="md">{passwordSuccess}</Text>
          )}
          
          {passwordError && (
            <Text color="red" mb="md">{passwordError}</Text>
          )}
          
          <PasswordInput
            label="Aktuelles Passwort"
            placeholder="Ihr aktuelles Passwort"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.currentTarget.value)}
            required
            mb="md"
          />
          
          <PasswordInput
            label="Neues Passwort"
            placeholder="Ihr neues Passwort"
            value={newPassword}
            onChange={(e) => setNewPassword(e.currentTarget.value)}
            required
            mb="md"
          />
          
          <PasswordInput
            label="Passwort bestätigen"
            placeholder="Neues Passwort wiederholen"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.currentTarget.value)}
            required
            mb="xl"
          />
          
          <Group position="right">
            <Button variant="outline" onClick={closePasswordModal}>Abbrechen</Button>
            <Button 
              onClick={handleChangePassword} 
              loading={isSubmitting}
            >
              Passwort ändern
            </Button>
          </Group>
        </div>
      </Modal>
    </Box>
  );
}

// Header Component
function DashboardHeader({ session, onLogout, onPasswordChange }: { 
  session: any;
  onLogout: () => void;
  onPasswordChange: () => void;
}) {
  return (
    <Header height={70} p="md">
      <Container size="xl">
        <Group position="apart">
          <Title order={3}>Immobilien-Steuerrechner Deutschland</Title>
          
          {session?.user && (
            <Menu
              position="bottom-end"
              shadow="md"
              width={200}
            >
              <Menu.Target>
                <Group spacing="xs" style={{ cursor: 'pointer' }}>
                  <Avatar color="blue" radius="xl">
                    {session.user.name?.charAt(0) || 'U'}
                  </Avatar>
                  <div>
                    <Text weight={500} size="sm" sx={{ lineHeight: 1 }}>
                      {session.user.name}
                    </Text>
                    <Text color="dimmed" size="xs">
                      {session.user.email}
                    </Text>
                  </div>
                </Group>
              </Menu.Target>
              
              <Menu.Dropdown>
                <Menu.Label>Einstellungen</Menu.Label>
                <Menu.Item onClick={onPasswordChange}>
                  Passwort ändern
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item color="red" onClick={onLogout}>
                  Abmelden
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </Container>
    </Header>
  );
}