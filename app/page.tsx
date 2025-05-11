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
  const [opened, setOpened] = useState(false);
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
                sx={{
                  width: '100%',
                  margin: '0 auto',
                }}
              >
                {state.properties.map((property, index) => (
                  <Box key={property.id} sx={{ width: '100%' }}>
                    <PropertyCard
                      property={property}
                      isActive={index === state.activePropertyIndex}
                      onEdit={() => handleEditProperty(property.id)}
                      onDelete={() => handleDeleteProperty(property.id)}
                      onViewOverview={() => handleViewPropertyDetails('overview', property.id)}
                      onViewCashflow={() => handleViewPropertyDetails('cashflow', property.id)}
                      onViewYearTable={() => handleViewPropertyDetails('yeartable', property.id)}
                    />
                  </Box>
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
    <Box>
      {/* Header-Bereich */}
      <Box 
        sx={{
          padding: theme.spacing.md,
          backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          borderBottom: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
          height: 70,
          display: 'flex',
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Burger
            opened={opened}
            onClick={() => setOpened((o) => !o)}
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
        </Box>
      </Box>

      <Box sx={{ display: 'flex', marginTop: 70 }}>
        {/* Sidebar-Navigation */}
        <Box 
          sx={{ 
            width: 250,
            padding: theme.spacing.md,
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
            borderRight: `1px solid ${theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[2]}`,
            height: 'calc(100vh - 70px)',
            position: 'fixed',
            left: 0,
            top: 70,
            zIndex: 100,
            display: opened ? 'block' : 'none',
            '@media (min-width: 768px)': {
              display: 'block',
            },
            overflowY: 'auto',
          }}
        >
          <Text weight={700} size="xl" mb="md">Immobilien-Steuerrechner</Text>
          
          <Button 
            fullWidth 
            variant={activeTab === 'portfolio' ? 'filled' : 'subtle'}
            onClick={() => setActiveTab('portfolio')}
          >
            Immobilien-Portfolio
          </Button>
          <Button 
            fullWidth 
            variant={activeTab === 'total-cashflow' ? 'filled' : 'subtle'} 
            mt="xs"
            onClick={() => setActiveTab('total-cashflow')}
          >
            Gesamtcashflow
          </Button>
          <Button 
            fullWidth 
            variant={activeTab === 'total-yeartable' ? 'filled' : 'subtle'} 
            mt="xs"
            onClick={() => setActiveTab('total-yeartable')}
          >
            Gesamtjahrestabelle
          </Button>
          <Button 
            fullWidth 
            variant={activeTab === 'tax' ? 'filled' : 'subtle'} 
            mt="xs"
            onClick={() => setActiveTab('tax')}
          >
            Steuerinformationen
          </Button>
          
          <Group position="center" mt="xl">
            <Button variant="default" fullWidth>Berechnungen aktualisieren</Button>
          </Group>
        </Box>

        {/* Hauptinhalt */}
        <Box 
          sx={{ 
            flexGrow: 1, 
            marginLeft: { base: 0, md: 250 },
            padding: theme.spacing.md,
            backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0],
            minHeight: 'calc(100vh - 70px)',
            width: { base: '100%', md: 'calc(100% - 250px)' },
          }}
        >
          <Container size="xl">
            {renderContent()}
          </Container>
        </Box>
      </Box>
      
      <PropertyFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        property={selectedProperty}
        onSave={handleSaveProperty}
      />
    </Box>
  );
}