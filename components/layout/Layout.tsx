// components/layout/Layout.tsx
import { ReactNode, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { Box } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DashboardHeader } from './DashboardHeader';
import { PasswordChangeModal } from '../auth/PasswordChangeModal';

interface LayoutProps {
  children: ReactNode;
  requireAuth?: boolean;
  checkAdmin?: boolean;
}

export function Layout({ children, requireAuth = true, checkAdmin = false }: LayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);

  // Check admin status when the component mounts
  useEffect(() => {
    if (status === 'authenticated') {
      checkAdminStatus();
    }
  }, [status]);

  // Check if user is authenticated
  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/login');
    }
  }, [requireAuth, status, router]);

  // Function to check admin status
  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        if (checkAdmin) {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      if (checkAdmin) {
        router.push('/dashboard');
      }
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  if (requireAuth && status === 'loading') {
    return <Box>Loading...</Box>;
  }

  return (
    <Box>
      {requireAuth && (
        <DashboardHeader 
          session={session} 
          onLogout={handleLogout} 
          onPasswordChange={openPasswordModal} 
          isAdmin={isAdmin} 
        />
      )}
      
      {children}
      
      {requireAuth && (
        <PasswordChangeModal
          opened={passwordModalOpened}
          onClose={closePasswordModal}
        />
      )}
    </Box>
  );
}