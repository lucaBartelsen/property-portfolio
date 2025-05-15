// components/layout/Layout.tsx - Updated version
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
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);

  // Check if user is authenticated
  useEffect(() => {
    if (requireAuth && status === 'unauthenticated') {
      router.push('/login');
    }

    // If this page requires admin access and user is not an admin, redirect to dashboard
    if (checkAdmin && session && session.user && !session.user.isAdmin) {
      router.push('/dashboard');
    }
  }, [requireAuth, status, router, checkAdmin, session]);

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
          isAdmin={session?.user?.isAdmin || false} 
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