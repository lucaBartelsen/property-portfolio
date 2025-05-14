// pages/admin/users.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Container,
  Title,
  Table,
  Button,
  Group,
  Text,
  Modal,
  TextInput,
  Checkbox,
  ActionIcon,
  Menu,
  Loader,
  Badge,
  Paper,
  Switch
} from '@mantine/core';

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    customers: number;
  };
}

export default function UsersAdmin() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({ name: '', email: '', isAdmin: false });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    if (status === 'authenticated') {
      checkAdminStatus();
      fetchUsers();
    }
  }, [status]);
  
  const checkAdminStatus = async () => {
    try {
      // Check if the current user is an admin
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/dashboard');
          return;
        }
        throw new Error('Failed to check admin status');
      }
      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      router.push('/dashboard');
    }
  };
  
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/admin/users');
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Sie haben keine Administratorrechte');
        }
        throw new Error('Benutzer konnten nicht geladen werden');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateUser = async () => {
    setFormError('');
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUserData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create user');
      }
      
      // Success
      const data = await response.json();
      setUsers([...users, data]);
      setNewUserData({ name: '', email: '', isAdmin: false });
      setCreateModalOpen(false);
      setSuccessMessage(`Benutzer ${data.name} wurde erfolgreich erstellt und eine E-Mail wurde gesendet.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Error creating user:', error);
      setFormError(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }
      
      // Remove user from list
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setDeleteModalOpen(false);
      setUserToDelete(null);
      setSuccessMessage(`Benutzer ${userToDelete.name} wurde erfolgreich gelöscht.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setFormError(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleSendPasswordReset = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}?action=reset-password`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send password reset');
      }
      
      setSuccessMessage('Password reset E-Mail wurde gesendet.');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Error sending password reset:', error);
      setError(error.message || 'Ein Fehler ist aufgetreten');
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <Container size="lg" py="xl">
        <Loader size="xl" />
      </Container>
    );
  }
  
  if (!isAdmin) {
    return (
      <Container size="lg" py="xl">
        <Text>Sie haben keine Berechtigung, diese Seite anzuzeigen.</Text>
        <Button mt="md" onClick={() => router.push('/dashboard')}>
          Zurück zum Dashboard
        </Button>
      </Container>
    );
  }
  
  return (
    <Container size="lg" py="xl">
      <Paper p="md" withBorder mb="xl">
        <Group position="apart">
          <Title order={2}>Benutzerverwaltung</Title>
          <Button onClick={() => setCreateModalOpen(true)}>
            Neuen Benutzer anlegen
          </Button>
        </Group>
      </Paper>
      
      {error && (
        <Paper p="md" withBorder mb="xl" sx={{ backgroundColor: '#FEE2E2' }}>
          <Text color="red">{error}</Text>
        </Paper>
      )}
      
      {successMessage && (
        <Paper p="md" withBorder mb="xl" sx={{ backgroundColor: '#D1FAE5' }}>
          <Text color="green">{successMessage}</Text>
        </Paper>
      )}
      
      <Paper p="md" withBorder>
        <Table striped>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Rolle</th>
              <th>Kunden</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <Text align="center">Keine Benutzer gefunden</Text>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <Badge color={user.isAdmin ? 'blue' : 'gray'}>
                      {user.isAdmin ? 'Administrator' : 'Benutzer'}
                    </Badge>
                  </td>
                  <td>{user._count?.customers || 0}</td>
                  <td>
                    <Group spacing="xs">
                      <Menu>
                        <Menu.Target>
                          <Button compact variant="light">Aktionen</Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item onClick={() => handleSendPasswordReset(user.id)}>
                            Passwort zurücksetzen
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item 
                            color="red" 
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteModalOpen(true);
                            }}
                            disabled={user.id === session?.user.id || (user._count?.customers || 0) > 0}
                          >
                            Löschen
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Paper>
      
      {/* Create User Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Neuen Benutzer anlegen"
      >
        <div>
          {formError && (
            <Text color="red" mb="md">{formError}</Text>
          )}
          
          <TextInput
            label="Name"
            placeholder="Vollständiger Name"
            required
            value={newUserData.name}
            onChange={(e) => setNewUserData({ ...newUserData, name: e.currentTarget.value })}
            mb="md"
          />
          
          <TextInput
            label="E-Mail"
            placeholder="email@beispiel.de"
            required
            value={newUserData.email}
            onChange={(e) => setNewUserData({ ...newUserData, email: e.currentTarget.value })}
            mb="md"
          />
          
          <Checkbox
            label="Administrator"
            checked={newUserData.isAdmin}
            onChange={(e) => setNewUserData({ ...newUserData, isAdmin: e.currentTarget.checked })}
            mb="xl"
          />
          
          <Group position="right">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleCreateUser} 
              loading={submitting}
              disabled={!newUserData.name || !newUserData.email}
            >
              Benutzer erstellen
            </Button>
          </Group>
        </div>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Benutzer löschen"
      >
        {userToDelete && (
          <>
            <Text mb="xl">
              Sind Sie sicher, dass Sie den Benutzer "{userToDelete.name}" löschen möchten?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </Text>
            <Group position="right">
              <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                color="red" 
                onClick={handleDeleteUser}
                loading={submitting}
              >
                Löschen
              </Button>
            </Group>
          </>
        )}
      </Modal>
    </Container>
  );
}