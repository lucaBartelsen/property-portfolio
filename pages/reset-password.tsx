// pages/reset-password.tsx
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Container,
  Paper,
  Title,
  Text,
  PasswordInput,
  Button,
  Group,
  Alert,
  LoadingOverlay,
  Center,
  Stack
} from '@mantine/core';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [validToken, setValidToken] = useState(true);
  
  // Validate token when component mounts
  useEffect(() => {
    if (token) {
      validateToken(token as string);
    }
  }, [token]);
  
  const validateToken = async (token: string) => {
    setValidating(true);
    
    try {
      // Check if token is valid
      const response = await fetch('/api/auth/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });
      
      if (!response.ok) {
        setValidToken(false);
      } else {
        setValidToken(true);
      }
    } catch (error) {
      console.error('Error validating token:', error);
      setValidToken(false);
    } finally {
      setValidating(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Zurücksetzen des Passworts');
      }
      
      setSuccess(true);
      
      // Redirect to login after success
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setError(error.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };
  
  if (validating) {
    return (
      <Container size={420} my={40}>
        <Center>
          <Text>Token wird überprüft...</Text>
        </Center>
      </Container>
    );
  }
  
  if (!validToken) {
    return (
      <Container size={420} my={40}>
        <Paper withBorder shadow="md" p={30} radius="md">
          <Title align="center" mb="lg">Ungültiger oder abgelaufener Link</Title>
          <Text align="center" mb="xl">
            Der Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen.
            Bitte fordern Sie einen neuen Link an.
          </Text>
          <Button fullWidth onClick={() => router.push('/forgot-password')}>
            Neuen Link anfordern
          </Button>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container size={420} my={40}>
      <Paper withBorder shadow="md" p={30} radius="md" pos="relative">
        <LoadingOverlay visible={loading} />
        
        {success ? (
          <Stack spacing="md">
            <Title align="center" order={2}>Passwort erfolgreich zurückgesetzt!</Title>
            <Text align="center">
              Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden in Kürze zur Anmeldeseite weitergeleitet.
            </Text>
            <Button fullWidth onClick={() => router.push('/login')}>
              Zur Anmeldeseite
            </Button>
          </Stack>
        ) : (
          <>
            <Title align="center" order={2} mb="lg">Passwort zurücksetzen</Title>
            
            {error && (
              <Alert color="red" mb="md">
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <PasswordInput
                label="Neues Passwort"
                placeholder="Mindestens 8 Zeichen"
                required
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                mb="md"
              />
              
              <PasswordInput
                label="Passwort bestätigen"
                placeholder="Passwort wiederholen"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                mb="xl"
              />
              
              <Button type="submit" fullWidth>
                Passwort zurücksetzen
              </Button>
            </form>
          </>
        )}
      </Paper>
    </Container>
  );
}