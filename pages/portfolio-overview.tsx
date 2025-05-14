// pages/portfolio-overview.tsx (refactored)
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Container,
  Loader,
  Text,
  Button,
  Paper
} from '@mantine/core';
import { PortfolioCharts } from '../components/charts/PortfolioCharts';
import { usePropertyStore } from '../store/PropertyContext';
import { CalculationService } from '../services/calculationService';
import { Property, Portfolio, PortfolioStats } from '../lib/types';
import { CustomerApiService, PortfolioApiService, PropertyApiService } from '../services/apiService';
import { DataValidator } from '../lib/utils/validation';

export default function PortfolioOverview() {
  const router = useRouter();
  const { customerId, portfolioId } = router.query;
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  
  const { state, dispatch } = usePropertyStore();
  
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>({
    totalValue: 0,
    totalEquity: 0,
    totalDebt: 0,
    avgCashflow: 0,
    avgROI: 0,
    propertyCount: 0,
    cashflowPositive: 0,
    cashflowNegative: 0
  });

  // Fetch portfolios
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPortfolios();
    }
  }, [status, customerId, portfolioId]);
  
  // Fetch properties when portfolio is selected
  useEffect(() => {
    if (selectedPortfolio) {
      fetchProperties(selectedPortfolio);
    }
  }, [selectedPortfolio]);
  
  // Update property store and trigger calculations when properties change
  useEffect(() => {
    if (properties.length > 0) {
      // First reset the store to ensure no old properties remain
      dispatch({ type: 'RESET_PROPERTIES' });
      
      // Add properties one by one to the store
      properties.forEach(property => {
        dispatch({ type: 'ADD_PROPERTY', property });
      });
      
      // Calculate combined results
      dispatch({ type: 'CALCULATE_COMBINED_RESULTS' });
      
      // Mark data as loaded to trigger re-renders of child components
      setDataLoaded(true);
    }
  }, [properties, dispatch]);
  
  // Replace fetchPortfolios with:
  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      let allPortfolios: Portfolio[] = [];
      
      // Handle specific portfolio or fetch all
      if (customerId && portfolioId) {
        const customer = await CustomerApiService.getCustomer(customerId as string);
        const portfolio = await PortfolioApiService.getPortfolio(portfolioId as string);
        
        portfolio.customerName = customer.name;
        allPortfolios = [portfolio];
        setSelectedPortfolio(portfolio.id);
      } else {
        // Fetch all customers and their portfolios
        const customers = await CustomerApiService.getCustomers();
        
        for (const customer of customers) {
          try {
            const portfolios = await PortfolioApiService.getPortfoliosByCustomer(customer.id);
            portfolios.forEach((portfolio: any) => {
              portfolio.customerName = customer.name;
            });
            allPortfolios = [...allPortfolios, ...portfolios];
          } catch (error) {
            console.error(`Error fetching portfolios for customer ${customer.id}:`, error);
          }
        }
      }
      
      setPortfolios(allPortfolios);
      
      // Select first portfolio if none selected
      if (allPortfolios.length > 0 && !selectedPortfolio) {
        setSelectedPortfolio(allPortfolios[0].id);
      }
    } catch (error) {
      console.error('Error fetching portfolios:', error);
      setError('Failed to load portfolios. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Replace fetchProperties with:
  const fetchProperties = async (portfolioId: string) => {
    setLoading(true);
    setDataLoaded(false);
    try {
      // Find customer for this portfolio for tax info
      const portfolioInfo = portfolios.find(p => p.id === portfolioId);
      if (portfolioInfo && portfolioInfo.customerId) {
        const customerId = portfolioInfo.customerId;
        
        // Fetch tax info
        const taxInfo = await CustomerApiService.getTaxInfo(customerId);
        if (taxInfo) {
          dispatch({ type: 'UPDATE_TAX_INFO', taxInfo });
        }
      }
        
      // Fetch properties
      const propertiesData = await PropertyApiService.getPropertiesByPortfolio(portfolioId);
      
      // Set properties with validated data
      setProperties(propertiesData);
      
      // Use the calculation service to get portfolio stats
      const stats = CalculationService.calculatePortfolioStats(propertiesData);
      setPortfolioStats(stats);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties. Please try again later.');
      setProperties([]);
      resetPortfolioStats();
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddProperty = () => {
    if (selectedPortfolio) {
      router.push(`/portfolios/${selectedPortfolio}/properties/new`);
    }
  };
  
  const navigateBack = () => {
    if (customerId) {
      router.push(`/customers/${customerId}`);
    } else {
      router.push('/dashboard');
    }
  };
  
  if (status === 'loading' || (loading && portfolios.length === 0)) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center' }}>
        <Loader size="xl" />
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container size="lg" py="xl">
        <Paper p="xl" withBorder>
          <Text color="red">{error}</Text>
          <Button mt="md" onClick={navigateBack}>
            Zurück
          </Button>
        </Paper>
      </Container>
    );
  }
  
  // Find the selected portfolio data
  const currentPortfolio = portfolios.find(p => p.id === selectedPortfolio);
  const pageTitle = currentPortfolio 
    ? `Portfolio: ${currentPortfolio.name} (${currentPortfolio.customerName})`
    : 'Portfolio Übersicht';
  
  return (
    <PortfolioCharts
      properties={properties}
      portfolioStats={portfolioStats}
      title={pageTitle}
      onAddProperty={handleAddProperty}
      dataLoaded={dataLoaded}
      navigateBack={navigateBack}
      showDetailButtons={true}
      portfolioId={selectedPortfolio}
    />
  );
}