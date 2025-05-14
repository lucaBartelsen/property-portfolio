// components/auth/PasswordChangeModal.tsx
import { useState } from 'react';
import {
  Modal,
  PasswordInput,
  Button,
  Group,
  Text
} from '@mantine/core';

interface PasswordChangeModalProps {
  opened: boolean;
  onClose: () => void;
}

export function PasswordChangeModal({ opened, onClose }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        onClose();
        setPasswordSuccess('');
      }, 2000);
      
    } catch (error) {
      console.error('Password change error:', error);
      setPasswordError(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
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
          <Button variant="outline" onClick={onClose}>Abbrechen</Button>
          <Button 
            onClick={handleChangePassword} 
            loading={isSubmitting}
          >
            Passwort ändern
          </Button>
        </Group>
      </div>
    </Modal>
  );
}