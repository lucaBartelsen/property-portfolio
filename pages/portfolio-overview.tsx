// pages/portfolio-overview.tsx
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Tabs,
  Grid,
  Card,
  SimpleGrid,
  Loader,
  Select,
  Progress,
  Divider
} from '@mantine/core';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import CashflowChart from '../components/CashflowChart';
import YearTable from '../components/YearTable';
import { formatCurrency } from '../lib/utils/formatters';
import { usePropertyStore } from '../store/PropertyContext';
import { Property } from '../lib/types';

// Define color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function PortfolioOverview() {

  const router = useRouter();
  const { customerId, portfolioId } = router.query; // Get URL parameters
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/login');
    },
  });
  
  const { state, dispatch } = usePropertyStore();
  
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [portfolioStats, setPortfolioStats] = useState({
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
        const augmentedProperty = {
          ...property,
          // Ensure all required fields have valid values
          defaults: property.defaults || {},
          purchaseData: property.purchaseData || null,
          ongoingData: property.ongoingData || null,
          calculationResults: property.calculationResults || null,
          yearlyData: property.yearlyData || null
        };
        
        dispatch({ type: 'ADD_PROPERTY', property: augmentedProperty });
      });
      
      // Calculate combined results
      dispatch({ type: 'CALCULATE_COMBINED_RESULTS' });
      
      // Mark data as loaded to trigger re-renders of child components
      setDataLoaded(true);
    }
  }, [properties]);
  
  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      let allPortfolios = [];
      
      // If customerId and portfolioId are provided, load only that specific portfolio
      if (customerId && portfolioId) {
        // Fetch customer info to get the name
        const customerResponse = await fetch(`/api/customers/${customerId}`);
        if (!customerResponse.ok) throw new Error('Failed to fetch customer');
        const customer = await customerResponse.json();
        
        // Fetch the specific portfolio
        const portfolioResponse = await fetch(`/api/portfolios/${portfolioId}`);
        if (!portfolioResponse.ok) throw new Error('Failed to fetch portfolio');
        const portfolio = await portfolioResponse.json();
        
        // Add customer name to the portfolio object
        portfolio.customerName = customer.name;
        allPortfolios = [portfolio];
        setSelectedPortfolio(portfolio.id);
      } else {
        // If no specific parameters, load all portfolios
        const customersResponse = await fetch('/api/customers');
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        
        const customers = await customersResponse.json();
        
        // Fetch portfolios for each customer
        for (const customer of customers) {
          const portfoliosResponse = await fetch(`/api/portfolios?customerId=${customer.id}`);
          if (portfoliosResponse.ok) {
            const customerPortfolios = await portfoliosResponse.json();
            // Add the customer name to each portfolio for better display
            customerPortfolios.forEach(portfolio => {
              portfolio.customerName = customer.name;
            });
            allPortfolios = [...allPortfolios, ...customerPortfolios];
          }
        }
      }
      
      setPortfolios(allPortfolios);
      
      // If there are portfolios but none selected yet, select the first one
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
  
  const fetchProperties = async (portfolioId) => {
    setLoading(true);
    setDataLoaded(false); // Reset data loaded flag
    try {
        // First, find which customer this portfolio belongs to
        const portfolioInfo = portfolios.find(p => p.id === portfolioId);
        if (portfolioInfo && portfolioInfo.customerName) {
        const customerId = portfolioInfo.customerId;
        
        // Fetch tax info for this customer
        const taxResponse = await fetch(`/api/customers/${customerId}/tax-info`);
        if (taxResponse.ok) {
            const taxInfo = await taxResponse.json();
            // Update the tax info in the global store
            dispatch({ type: 'UPDATE_TAX_INFO', taxInfo: {
            annualIncome: taxInfo.annualIncome,
            taxStatus: taxInfo.taxStatus,
            hasChurchTax: taxInfo.hasChurchTax,
            churchTaxRate: taxInfo.churchTaxRate,
            taxRate: taxInfo.taxRate
            }});
        }
      }// Then fetch properties data
        const response = await fetch(`/api/properties?portfolioId=${portfolioId}`);
        if (!response.ok) throw new Error('Failed to fetch properties');
      
      const propertiesData = await response.json();
      
      // Ensure the properties are properly structured
      const validProperties = propertiesData.map(prop => ({
        ...prop,
        defaults: prop.defaults || {},
        purchaseData: prop.purchaseData || null,
        ongoingData: prop.ongoingData || null,
        calculationResults: prop.calculationResults || null,
        yearlyData: prop.yearlyData || null
      }));
      
      setProperties(validProperties);
      
      // Calculate portfolio statistics
      calculatePortfolioStats(validProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties. Please try again later.');
      setProperties([]);
      resetPortfolioStats();
    } finally {
      setLoading(false);
    }
  };
  
  const calculatePortfolioStats = (propertiesData) => {
    if (!propertiesData || propertiesData.length === 0) {
      resetPortfolioStats();
      return;
    }
    
    const stats = {
      totalValue: 0,
      totalEquity: 0,
      totalDebt: 0,
      avgCashflow: 0,
      avgROI: 0,
      propertyCount: propertiesData.length,
      cashflowPositive: 0,
      cashflowNegative: 0
    };
    
    let totalCashflow = 0;
    let totalROI = 0;
    
    propertiesData.forEach(property => {
      if (property.calculationResults) {
        // Property value
        stats.totalValue += property.calculationResults.finalPropertyValue || 0;
        
        // Equity & Debt
        stats.totalEquity += property.calculationResults.finalEquity || 0;
        stats.totalDebt += property.calculationResults.remainingLoan || 0;
        
        // Cashflow
        const monthlyCashflow = property.calculationResults.monthlyCashflow || 0;
        totalCashflow += monthlyCashflow;
        
        if (monthlyCashflow >= 0) {
          stats.cashflowPositive += 1;
        } else {
          stats.cashflowNegative += 1;
        }
        
        // ROI
        const initialEquity = property.calculationResults.initialEquity || 1;
        const roi = (monthlyCashflow * 12) / initialEquity * 100;
        totalROI += roi;
      }
    });
    
    stats.avgCashflow = totalCashflow / stats.propertyCount;
    stats.avgROI = totalROI / stats.propertyCount;
    
    setPortfolioStats(stats);
  };
  
  const resetPortfolioStats = () => {
    setPortfolioStats({
      totalValue: 0,
      totalEquity: 0,
      totalDebt: 0,
      avgCashflow: 0,
      avgROI: 0,
      propertyCount: 0,
      cashflowPositive: 0,
      cashflowNegative: 0
    });
  };
  
  // Prepare pie chart data for value distribution (Equity vs Debt)
  const valueDistributionData = [
    { name: 'Eigenkapital', value: portfolioStats.totalEquity },
    { name: 'Restschuld', value: portfolioStats.totalDebt }
  ];
  
  // Prepare pie chart data for cashflow distribution
  const cashflowDistributionData = [
    { name: 'Positiver Cashflow', value: portfolioStats.cashflowPositive },
    { name: 'Negativer Cashflow', value: portfolioStats.cashflowNegative }
  ];
  
  // Prepare data for cashflow by property chart
  const cashflowByPropertyData = properties
    .filter(property => property.calculationResults)
    .map(property => ({
      name: property.name,
      cashflow: property.calculationResults.monthlyCashflow || 0
    }))
    .sort((a, b) => b.cashflow - a.cashflow); // Sort by cashflow descending
  
  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
  };
  
  // Recalculate data
  const handleRecalculate = () => {
    // Clear the store and reload properties
    dispatch({ type: 'RESET_PROPERTIES' });
    fetchProperties(selectedPortfolio);
  };
  
  if (status === 'loading' || (loading && portfolios.length === 0)) {
    return (
      <Container size="lg" py="xl" style={{ textAlign: 'center' }}>
        <Loader size="xl" />
      </Container>
    );
  }
  
  // Determine if the portfolio selector should be visible
  // Hide it if we came directly from a customer page with specific IDs
  const showPortfolioSelector = !(customerId && portfolioId) && portfolios.length > 1;
  
  return (
    <Container size="lg" py="xl">
      <Paper p="md" withBorder mb="xl">
        <Group position="apart">
          <Group>
            <Title order={2}>Portfolio Übersicht</Title>
            {!showPortfolioSelector && portfolios.length > 0 && (
              <Text size="lg" ml="md">
                {portfolios[0].name} ({portfolios[0].customerName})
              </Text>
            )}
          </Group>
          <Group>
            {customerId && (
              <Button variant="outline" onClick={() => router.push(`/customers/${customerId}`)}>
                Zurück zum Kunden
              </Button>
            )}
          </Group>
        </Group>
      </Paper>
      
      {error && (
        <Paper p="md" withBorder mb="xl">
          <Text color="red">{error}</Text>
        </Paper>
      )}
      
      {selectedPortfolio && (
        <Tabs value={activeTab} onTabChange={handleTabChange}>
          <Tabs.List mb="md">
            <Tabs.Tab value="overview">Übersicht</Tabs.Tab>
            <Tabs.Tab value="cashflow">Cashflow</Tabs.Tab>
            <Tabs.Tab value="yeartable">Jahrestabelle</Tabs.Tab>
            <Tabs.Tab value="properties">Immobilien</Tabs.Tab>
          </Tabs.List>
          
          <Tabs.Panel value="overview">
            {loading ? (
              <Loader />
            ) : (
              <div>
                <SimpleGrid cols={3} spacing="lg" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
                  <Card withBorder p="md">
                    <Title order={4}>Portfolio Bewertung</Title>
                    <Text size="xl" mt="md" weight={700}>{formatCurrency(portfolioStats.totalValue)}</Text>
                    <Group mt="md" position="apart">
                      <div>
                        <Text size="xs" color="dimmed">Eigenkapital</Text>
                        <Text size="lg">{formatCurrency(portfolioStats.totalEquity)}</Text>
                      </div>
                      <div>
                        <Text size="xs" color="dimmed">Restschuld</Text>
                        <Text size="lg">{formatCurrency(portfolioStats.totalDebt)}</Text>
                      </div>
                    </Group>
                    <Progress
                      mt="md"
                      sections={[
                        { value: (portfolioStats.totalEquity / portfolioStats.totalValue) * 100, color: 'green' },
                        { value: (portfolioStats.totalDebt / portfolioStats.totalValue) * 100, color: 'red' }
                      ]}
                    />
                  </Card>
                  
                  <Card withBorder p="md">
                    <Title order={4}>Cashflow Performance</Title>
                    <Text size="xl" mt="md" weight={700} color={portfolioStats.avgCashflow >= 0 ? 'green' : 'red'}>
                      {formatCurrency(portfolioStats.avgCashflow)} / Monat
                    </Text>
                    <Text size="sm">Durchschnittlicher ROI: {portfolioStats.avgROI.toFixed(2)}%</Text>
                    <Divider my="md" />
                    <Group mt="sm" position="apart">
                      <div>
                        <Text size="xs" color="dimmed">Positive Cashflows</Text>
                        <Text>{portfolioStats.cashflowPositive}</Text>
                      </div>
                      <div>
                        <Text size="xs" color="dimmed">Negative Cashflows</Text>
                        <Text>{portfolioStats.cashflowNegative}</Text>
                      </div>
                    </Group>
                  </Card>
                  
                  <Card withBorder p="md">
                    <Title order={4}>Immobilien</Title>
                    <Text size="xl" mt="md" weight={700}>{portfolioStats.propertyCount}</Text>
                    <Divider my="md" />
                    <Button fullWidth onClick={() => router.push(`/portfolios/${selectedPortfolio}/properties/new`)}>
                      Neue Immobilie hinzufügen
                    </Button>
                  </Card>
                </SimpleGrid>
                
                <Grid mt="xl">
                  <Grid.Col md={6}>
                    <Card withBorder p="md">
                      <Title order={4} mb="md">Vermögensverteilung</Title>
                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={valueDistributionData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {valueDistributionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </Grid.Col>
                  
                  <Grid.Col md={6}>
                    <Card withBorder p="md">
                      <Title order={4} mb="md">Cashflow nach Immobilie</Title>
                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={cashflowByPropertyData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey="cashflow"
                              stroke="#8884d8"
                              activeDot={{ r: 8 }}
                            />
                            <Line
                              type="monotone"
                              dataKey="roi"
                              stroke="#82ca9d"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </Card>
                  </Grid.Col>
                </Grid>
              </div>
            )}
          </Tabs.Panel>
          
          <Tabs.Panel value="cashflow">
            {/* We use a key to force re-mount when data is loaded */}
            <CashflowChart key={`cashflow-${dataLoaded}`} combined />
          </Tabs.Panel>
          
          <Tabs.Panel value="yeartable">
            {/* We use a key to force re-mount when data is loaded */}
            <YearTable key={`yeartable-${dataLoaded}`} combined />
          </Tabs.Panel>
          
          <Tabs.Panel value="properties">
            <Title order={3} mb="md">Immobilien im Portfolio</Title>
            {properties.length === 0 ? (
              <Paper p="xl" withBorder>
                <Text align="center">Keine Immobilien gefunden.</Text>
                <Button 
                  mt="md" 
                  fullWidth 
                  onClick={() => router.push(`/portfolios/${selectedPortfolio}/properties/new`)}
                >
                  Erste Immobilie hinzufügen
                </Button>
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
                {properties.map((property) => (
                  <Card key={property.id} withBorder shadow="sm" p="lg" radius="md" className="property-card">
                    <Title order={4} mb="md">{property.name}</Title>
                    
                    {property.purchaseData && (
                      <Text>Kaufpreis: {formatCurrency(property.purchaseData.purchasePrice)}</Text>
                    )}
                    
                    {property.calculationResults && (
                      <>
                        <Text>Aktueller Wert: {formatCurrency(property.calculationResults.finalPropertyValue)}</Text>
                        <Text>Monatlicher Cashflow: {formatCurrency(property.calculationResults.monthlyCashflow)}</Text>
                        <Text>ROI: {((property.calculationResults.monthlyCashflow * 12 / property.calculationResults.initialEquity) * 100).toFixed(2)} %</Text>
                      </>
                    )}
                    
                    <Button
                      fullWidth
                      mt="md"
                      onClick={() => router.push(`/properties/${property.id}`)}
                    >
                      Details anzeigen
                    </Button>
                  </Card>
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        </Tabs>
      )}
    </Container>
  );
}