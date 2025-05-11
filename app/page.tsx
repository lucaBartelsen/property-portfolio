// src/app/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { 
  Box,
  Burger,
  Button, 
  Container,
  Group,
  Paper,
  SimpleGrid,
  Text,
  Title,
  useMantineTheme,
} from '@mantine/core';
import { usePropertyStore, createNewProperty } from '../store/PropertyContext';
import PropertyCard from '../components/PropertyCard';
import PropertyFormModal from '../components/PropertyFormModal';
import TaxSettings from '../components/TaxSettings';
import PropertyDetails from '../components/PropertyDetails';
import CashflowChart from '../components/CashflowChart';
import YearTable from '../components/YearTable';
import { Property } from '../lib/types';

export default function HomePage() {
  const theme = useMantineTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { state, dispatch } = usePropertyStore();
  
  const [activeTab, setActiveTab] = useState('portfolio');
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>(undefined);
  const [detailView, setDetailView] = useState<{
    type: 'overview' | 'cashflow' | 'yeartable';
    propertyId: string;
  } | null>(null);
  
  // Erstelle eine Standardimmobilie, wenn keine vorhanden ist
  useEffect(() => {
    if (state.properties.length === 0) {
      const newProperty = createNewProperty('Immobilie 1');
      dispatch({ type: 'ADD_PROPERTY', property: newProperty });
    }
  }, [state.properties.length, dispatch]);

  const handleEditProperty = (id: string) => {
    const property = state.properties.find(p => p.id === id);
    if (property) {
      setSelectedProperty(property);
      setModalOpened(true);
    }
  };

  const handleDeleteProperty = (id: string) => {
    if (window.confirm('Möchten Sie diese Immobilie wirklich löschen?')) {
      dispatch({ type: 'DELETE_PROPERTY', id });
    }
  };

  const handleAddProperty = () => {
    setSelectedProperty(undefined);
    setModalOpened(true);
  };

  const handleSaveProperty = (property: Property) => {
    if (selectedProperty) {
      // Update existing property
      dispatch({ type: 'UPDATE_PROPERTY', property });
    } else {
      // Add new property
      dispatch({ type: 'ADD_PROPERTY', property });
    }
  };

  const handleViewPropertyDetails = (type: 'overview' | 'cashflow' | 'yeartable', id: string) => {
    setDetailView({ type, propertyId: id });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Mobile Nav schließen, wenn ein Tab ausgewählt wird
    setMobileNavOpen(false);
  };

  const renderContent = () => {
    // Wenn eine Detailansicht aktiv ist
    if (detailView) {
      const property = state.properties.find(p => p.id === detailView.propertyId);
      if (!property) {
        return <Text>Immobilie nicht gefunden</Text>;
      }
      
      switch (detailView.type) {
        case 'overview':
          return <PropertyDetails property={property} onBack={() => setDetailView(null)} />;
        case 'cashflow':
          return <CashflowChart property={property} onBack={() => setDetailView(null)} />;
        case 'yeartable':
          return <YearTable property={property} onBack={() => setDetailView(null)} />;
      }
    }
    
    // Sonst Tab-Inhalte anzeigen
    switch (activeTab) {
      case 'portfolio':
        return (
          <>
            <Group position="apart" mb="lg">
              <Title order={2}>Mein Immobilien-Portfolio</Title>
              <Button onClick={handleAddProperty}>Neue Immobilie hinzufügen</Button>
            </Group>
            
            {state.properties.length === 0 ? (
              <Paper p="xl" withBorder>
                <Text align="center">Keine Immobilien vorhanden. Fügen Sie Ihre erste Immobilie hinzu!</Text>
              </Paper>
            ) : (
              <SimpleGrid
                cols={3}
                spacing="lg"
                breakpoints={[
                  { maxWidth: 1200, cols: 2, spacing: 'md' },
                  { maxWidth: 800, cols: 1, spacing: 'sm' },
                ]}
              >
                {state.properties.map((property, index) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isActive={index === state.activePropertyIndex}
                    onEdit={() => handleEditProperty(property.id)}
                    onDelete={() => handleDeleteProperty(property.id)}
                    onViewOverview={() => handleViewPropertyDetails('overview', property.id)}
                    onViewCashflow={() => handleViewPropertyDetails('cashflow', property.id)}
                    onViewYearTable={() => handleViewPropertyDetails('yeartable', property.id)}
                  />
                ))}
              </SimpleGrid>
            )}
          </>
        );
      case 'total-cashflow':
        return <CashflowChart combined />;
      case 'total-yeartable':
        return <YearTable combined />;
      case 'tax':
        return <TaxSettings />;
      default:
        return (
          <Paper p="xl" withBorder>
            <Text align="center">In Entwicklung...</Text>
          </Paper>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ 
        height: '70px', 
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
        borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <Burger
            opened={mobileNavOpen}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            size="sm"
            color={theme.colors.gray[6]}
            mr="xl"
            sx={{ 
              '@media (min-width: 768px)': {
                display: 'none',
              },
            }}
          />
          <Text weight={700} size="xl">Immobilien-Steuerrechner Deutschland</Text>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{
          width: '250px',
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
          borderRight: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
          padding: '16px',
          position: 'fixed',
          top: '70px',
          bottom: 0,
          left: 0,
          zIndex: 99,
          overflowY: 'auto',
          transform: mobileNavOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          '@media (min-width: 768px)': {
            transform: 'translateX(0)',
          } as any,
        }}>
          <Text weight={700} size="xl" mb="md">Immobilien-Steuerrechner</Text>
          
          <Button 
            fullWidth 
            variant={activeTab === 'portfolio' ? 'filled' : 'subtle'}
            onClick={() => handleTabChange('portfolio')}
            mb="xs"
          >
            Immobilien-Portfolio
          </Button>
          <Button 
            fullWidth 
            variant={activeTab === 'total-cashflow' ? 'filled' : 'subtle'} 
            onClick={() => handleTabChange('total-cashflow')}
            mb="xs"
          >
            Gesamtcashflow
          </Button>
          <Button 
            fullWidth 
            variant={activeTab === 'total-yeartable' ? 'filled' : 'subtle'} 
            onClick={() => handleTabChange('total-yeartable')}
            mb="xs"
          >
            Gesamtjahrestabelle
          </Button>
          <Button 
            fullWidth 
            variant={activeTab === 'tax' ? 'filled' : 'subtle'} 
            onClick={() => handleTabChange('tax')}
            mb="xs"
          >
            Steuerinformationen
          </Button>
          
          <Button variant="default" fullWidth mt="xl">
            Berechnungen aktualisieren
          </Button>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileNavOpen && (
          <div 
            style={{
              position: 'fixed',
              top: '70px',
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 98,
            }}
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        {/* Hauptinhalt */}
        <main style={{
          flex: 1,
          padding: '16px',
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
          marginLeft: 0,
          width: '100%',
          transition: 'margin-left 0.3s ease',
          '@media (min-width: 768px)': {
            marginLeft: '250px',
          } as any,
        }}>
          <Container size="xl">
            {renderContent()}
          </Container>
        </main>
      </div>
      
      <PropertyFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        property={selectedProperty}
        onSave={handleSaveProperty}
      />
    </div>
  );
}