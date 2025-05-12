// pages/register.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { TextInput, PasswordInput, Button, Paper, Title, Text, Container, Group, Anchor } from '@mantine/core';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registrierung fehlgeschlagen');
        setLoading(false);
        return;
      }

      // Redirect to login
      router.push('/login?registered=true');
    } catch (error) {
      setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title align="center" mb={30}>Neues Konto erstellen</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Name"
            placeholder="Ihr Name"
            required
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            mb="md"
          />
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
            Registrieren
          </Button>
        </form>
        <Text align="center" mt="md">
          Haben Sie bereits ein Konto?{' '}
          <Anchor component="button" onClick={() => router.push('/login')}>
            Anmelden
          </Anchor>
        </Text>
      </Paper>
    </Container>
  );
}