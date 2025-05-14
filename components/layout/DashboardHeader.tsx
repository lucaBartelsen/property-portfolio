// components/layout/DashboardHeader.tsx
import { useRouter } from 'next/router';
import {
  Header,
  Container,
  Group,
  Title,
  Text,
  Menu,
  Avatar
} from '@mantine/core';

interface DashboardHeaderProps {
  session: any;
  onLogout: () => void;
  onPasswordChange: () => void;
  isAdmin: boolean;
}

export function DashboardHeader({ 
  session, 
  onLogout, 
  onPasswordChange, 
  isAdmin 
}: DashboardHeaderProps) {
  const router = useRouter();
  
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
                <Menu.Label>Navigation</Menu.Label>
                <Menu.Item onClick={() => router.push('/dashboard')}>
                  Dashboard
                </Menu.Item>
                
                {isAdmin && (
                  <Menu.Item onClick={() => router.push('/admin/users')}>
                    Benutzerverwaltung
                  </Menu.Item>
                )}
                
                <Menu.Divider />
                
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