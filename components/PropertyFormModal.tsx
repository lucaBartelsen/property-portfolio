// src/components/PropertyFormModal.tsx
import { Modal } from '@mantine/core';
import PropertyForm from './PropertyForm';
import { Property } from '../lib/types';

interface PropertyFormModalProps {
  opened: boolean;
  onClose: () => void;
  property?: Property;
  onSave: (property: Property) => void;
}

export default function PropertyFormModal({ 
  opened, 
  onClose, 
  property, 
  onSave 
}: PropertyFormModalProps) {
  const handleSave = (property: Property) => {
    onSave(property);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={property ? `Immobilie bearbeiten: ${property.name}` : 'Neue Immobilie erstellen'}
      size="xl"
    >
      <PropertyForm 
        property={property} 
        onSave={handleSave} 
        onCancel={onClose} 
      />
    </Modal>
  );
}