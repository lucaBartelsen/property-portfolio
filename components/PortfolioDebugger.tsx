// components/PortfolioDebugger.tsx
import { usePropertyStore } from '../store/PropertyContext';
import { Button, Paper, Code, Title, Accordion, Text } from '@mantine/core';

export default function PortfolioDebugger() {
  const { state, dispatch } = usePropertyStore();

  // Function to force recalculation of combined results
  const forceRecalculate = () => {
    console.log("Forcing recalculation of combined results");
    dispatch({ type: 'CALCULATE_COMBINED_RESULTS' });
  };

  // Clear all properties and reset combined results
  const resetStore = () => {
    console.log("Resetting property store");
    dispatch({ type: 'RESET_COMBINED_RESULTS' });
    state.properties.forEach(property => {
      dispatch({ type: 'DELETE_PROPERTY', id: property.id });
    });
  };

  return (
    <Paper p="md" withBorder mb="lg">
      <Title order={3}>Portfolio Debugger</Title>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', marginTop: '10px' }}>
        <Button size="sm" onClick={forceRecalculate}>Force Recalculate</Button>
        <Button size="sm" onClick={resetStore} color="red">Reset Store</Button>
      </div>
      
      <Accordion>
        <Accordion.Item value="properties">
          <Accordion.Control>Properties in Store ({state.properties.length})</Accordion.Control>
          <Accordion.Panel>
            {state.properties.length === 0 ? (
              <Text color="dimmed">No properties in store</Text>
            ) : (
              state.properties.map((property, index) => (
                <div key={property.id} style={{ marginBottom: '10px' }}>
                  <Text weight={700}>{index + 1}. {property.name}</Text>
                  <Text size="sm">ID: {property.id}</Text>
                  <Text size="sm">Has purchaseData: {property.purchaseData ? '✅' : '❌'}</Text>
                  <Text size="sm">Has ongoingData: {property.ongoingData ? '✅' : '❌'}</Text>
                  <Text size="sm">Has calculationResults: {property.calculationResults ? '✅' : '❌'}</Text>
                  <Text size="sm">Has yearlyData: {property.yearlyData?.length ? `✅ (${property.yearlyData.length} years)` : '❌'}</Text>
                </div>
              ))
            )}
          </Accordion.Panel>
        </Accordion.Item>
        
        <Accordion.Item value="combined">
          <Accordion.Control>Combined Results</Accordion.Control>
          <Accordion.Panel>
            {!state.combinedResults ? (
              <Text color="red">No combined results available!</Text>
            ) : (
              <>
                <Text>Combined calculation results exist: ✅</Text>
                <Text>Number of years in yearly data: {state.combinedResults.yearlyData?.length || 0}</Text>
                <Text>Monthly cashflow: {state.combinedResults.calculationResults?.monthlyCashflow || 'N/A'}</Text>
              </>
            )}
          </Accordion.Panel>
        </Accordion.Item>
        
        <Accordion.Item value="taxInfo">
          <Accordion.Control>Tax Information</Accordion.Control>
          <Accordion.Panel>
            <pre>
              <Code block>
                {JSON.stringify(state.taxInfo, null, 2)}
              </Code>
            </pre>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Paper>
  );
}