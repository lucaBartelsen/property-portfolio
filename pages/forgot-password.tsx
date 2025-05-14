// pages/forgot-password.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  Title,
  Text,
  TextInput,
  Button,
  Group,
  Alert,
  LoadingOverlay,
  Stack,
  Anchor
} from '@mantine/core';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Anfordern eines Passwort-Reset-Links');
      }
      
      setSuccess(true);
    } catch (error: any) {
      console.error('Error requesting password reset:', error);
      setError(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} radius="md" pos="relative">
        <LoadingOverlay visible={loading} />
        
        {success ? (
          <Stack spacing="md">
            <Title align="center" order={2}>Passwort-Reset-Link gesendet</Title>
            <Text align="center">
              Wenn ein Konto mit dieser E-Mail-Adresse existiert, haben wir einen Link zum Zurücksetzen des Passworts gesendet. 
              Bitte überprüfen Sie Ihr E-Mail-Postfach.
            </Text>
            <Button fullWidth onClick={() => router.push('/login')}>
              Zurück zum Login
            </Button>
          </Stack>
        ) : (
          <>
            <Title align="center" order={2} mb="lg">Passwort vergessen?</Title>
            <Text size="sm" align="center" mb="md">
              Geben Sie Ihre E-Mail-Adresse ein, und wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
            </Text>
            
            {error && (
              <Alert color="red" mb="md">
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <TextInput
                label="E-Mail-Adresse"
                placeholder="ihre@email.de"
                required
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                mb="xl"
              />
              
              <Button type="submit" fullWidth mb="md">
                Link senden
              </Button>
              
              <Group position="center" mt="md">
                <Anchor size="sm" onClick={() => router.push('/login')}>
                  Zurück zum Login
                </Anchor>
              </Group>
            </form>
          </>
        )}
      </Paper>
    </Container>
  );
}