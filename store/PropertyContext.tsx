// store/PropertyContext.tsx
import { createContext, useContext, useReducer, ReactNode, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Property, TaxInfo, YearlyData } from '../lib/types';
import { calculatePurchase } from '../lib/calculators/purchaseCalculator';
import { calculateOngoing } from '../lib/calculators/ongoingCalculator';
import { calculateCashflow } from '../lib/calculators/cashflowCalculator';
import { DEFAULT_PROPERTY_VALUES } from '../lib/constants';
import { calculateChurchTax, calculateGermanIncomeTax } from '@/lib/calculators/taxCalculator';

// Action types
type Action = 
  | { type: 'SET_ACTIVE_PROPERTY'; index: number }
  | { type: 'ADD_PROPERTY'; property: Property }
  | { type: 'UPDATE_PROPERTY'; property: Property }
  | { type: 'DELETE_PROPERTY'; id: string }
  | { type: 'UPDATE_TAX_INFO'; taxInfo: TaxInfo }
  | { type: 'CALCULATE_COMBINED_RESULTS' }
  | { type: 'RESET_PROPERTIES' }
  | { type: 'RESET_COMBINED_RESULTS' };

// Initial state
const initialState: AppState = {
  taxInfo: {
    annualIncome: 70000,
    taxStatus: 'single',
    hasChurchTax: false,
    churchTaxRate: 9,
    taxRate: 42.0
  },
  properties: [],
  activePropertyIndex: 0,
  combinedResults: null
};

// Create context
const PropertyContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Calculate all data for a property
function calculatePropertyData(property: Property, taxInfo: TaxInfo): Property {
  try {
    // Calculate purchase and ongoing data
    const purchaseData = calculatePurchase(property);
    const ongoingData = calculateOngoing(property);
    
    // Calculate cashflow
    const calculationPeriod = 10; // Standard period
    const { results, yearlyData } = calculateCashflow(
      { ...property, purchaseData, ongoingData },
      taxInfo,
      calculationPeriod
    );
    
    // Update property with calculated data
    return {
      ...property,
      purchaseData,
      ongoingData,
      calculationResults: results,
      yearlyData
    };
  } catch (error) {
    console.error("Error calculating property data:", error);
    return property;
  }
}

// Reducer function
function propertyReducer(state: AppState, action: Action): AppState {
  try {
    switch (action.type) {
      case 'SET_ACTIVE_PROPERTY':
        return {
          ...state,
          activePropertyIndex: action.index
        };
        
      case 'ADD_PROPERTY': {
        // Calculate all data for new property immediately
        const newPropertyWithCalculations = calculatePropertyData(action.property, state.taxInfo);
        
        return {
          ...state,
          properties: [...state.properties, newPropertyWithCalculations],
          activePropertyIndex: state.properties.length,
          combinedResults: null // Reset combined results to force recalculation
        };
      }
      
      case 'UPDATE_PROPERTY': {
        const updatedProperties = [...state.properties];
        const index = updatedProperties.findIndex(p => p.id === action.property.id);
        if (index !== -1) {
          // Calculate all data for updated property immediately
          const updatedPropertyWithCalculations = calculatePropertyData(action.property, state.taxInfo);
          updatedProperties[index] = updatedPropertyWithCalculations;
        }
        
        return {
          ...state,
          properties: updatedProperties,
          combinedResults: null // Reset combined results to force recalculation
        };
      }
      
      case 'DELETE_PROPERTY': {
        const filteredProperties = state.properties.filter(p => p.id !== action.id);
        let newActiveIndex = state.activePropertyIndex;
        
        // Adjust active index if needed
        if (filteredProperties.length === 0) {
          newActiveIndex = 0;
        } else if (state.activePropertyIndex >= filteredProperties.length) {
          newActiveIndex = filteredProperties.length - 1;
        }
        
        return {
          ...state,
          properties: filteredProperties,
          activePropertyIndex: newActiveIndex,
          combinedResults: null // Reset combined results to force recalculation
        };
      }
      
      case 'UPDATE_TAX_INFO': {
        // When tax info changes, we don't need to recalculate properties
        // since we now calculate them on-demand in the components
        return {
          ...state,
          taxInfo: action.taxInfo,
          // No need to update properties or combined results here
          // since the components will calculate fresh data when they render
        };
      }
      
      case 'RESET_PROPERTIES': {
        return {
          ...state,
          properties: [],
          activePropertyIndex: 0,
          combinedResults: null
        };
      }
      
      case 'CALCULATE_COMBINED_RESULTS': {
        // The combined results are now calculated on-demand in the components
        // This action is kept for backward compatibility but doesn't do much
        return {
          ...state,
          combinedResults: null // Reset to force components to recalculate
        };
      }
      
      case 'RESET_COMBINED_RESULTS':
        return {
          ...state,
          combinedResults: null
        };
        
      default:
        return state;
    }
  } catch (error) {
    console.error("ERROR IN REDUCER:", error);
    return state; // Return unchanged state if there's an error
  }
}

// Provider component
export function PropertyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(propertyReducer, initialState);
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state]);
  
  const recalculateCombinedTaxes = (yearlyData: YearlyData[], taxInfo: TaxInfo): YearlyData[] => {
    // Clone the data to avoid mutating the original
    const updatedData = JSON.parse(JSON.stringify(yearlyData));
    
    // For each year, recalculate the tax effects
    updatedData.forEach((year: YearlyData) => {
      const baseIncome = year.previousIncome;
      const propertyIncome = year.taxableIncome;
      
      // Calculate new total income
      year.newTotalIncome = Math.max(0, baseIncome + propertyIncome);
      
      // Calculate taxes
      const previousTax = year.previousTax;
      const previousChurchTax = year.previousChurchTax;
      
      const newTax = calculateGermanIncomeTax(year.newTotalIncome, taxInfo.taxStatus);
      const newChurchTax = taxInfo.hasChurchTax 
        ? calculateChurchTax(newTax, taxInfo.hasChurchTax, taxInfo.churchTaxRate) 
        : 0;
      
      year.newTax = newTax;
      year.newChurchTax = newChurchTax;
      
      // Calculate tax savings
      year.taxSavings = (previousTax - newTax) + (previousChurchTax - newChurchTax);
      
      // Update cashflow
      year.cashflow = year.cashflowBeforeTax + year.taxSavings;
    });
    
    return updatedData;
  };

  return (
    <PropertyContext.Provider value={contextValue}>
      {children}
    </PropertyContext.Provider>
  );
}

// Custom Hook for easier access
export function usePropertyStore() {
  const context = useContext(PropertyContext);
  
  if (context === undefined) {
    throw new Error("usePropertyStore must be used within a PropertyProvider");
  }
  
  return context;
}

// Helper functions
export function createNewProperty(name: string): Property {
  return {
    id: uuidv4(),
    name,
    purchaseData: null,
    ongoingData: null,
    calculationResults: null,
    yearlyData: null,
    defaults: { ...DEFAULT_PROPERTY_VALUES }
  };
}