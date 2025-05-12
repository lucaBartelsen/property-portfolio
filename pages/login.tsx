// pages/login.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from 'next-auth/react';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Group, Anchor } from '@mantine/core';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Ungültige E-Mail oder Passwort');
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title align="center" mb={30}>Willkommen zurück!</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="E-Mail"
            placeholder="ihre@email.de"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            mb="md"
          />
          <PasswordInput
            label="Passwort"
            placeholder="Ihr Passwort"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            mb="md"
          />
          {error && <Text color="red" size="sm" mb="md">{error}</Text>}
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            Anmelden
          </Button>
        </form>
        <Text align="center" mt="md">
          Noch kein Konto?{' '}
          <Anchor component="button" onClick={() => router.push('/register')}>
            Registrieren
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}