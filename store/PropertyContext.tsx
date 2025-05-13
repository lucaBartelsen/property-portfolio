// Fixed store/PropertyContext.tsx
import { createContext, useContext, useReducer, ReactNode, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AppState, Property, TaxInfo, YearlyData } from '../lib/types';
import { calculatePurchase } from '../lib/calculators/purchaseCalculator';
import { calculateOngoing } from '../lib/calculators/ongoingCalculator';
import { calculateCashflow } from '../lib/calculators/cashflowCalculator';
import { DEFAULT_PROPERTY_VALUES } from '../lib/constants';

// Aktionstypen
type Action = 
  | { type: 'SET_ACTIVE_PROPERTY'; index: number }
  | { type: 'ADD_PROPERTY'; property: Property }
  | { type: 'UPDATE_PROPERTY'; property: Property }
  | { type: 'DELETE_PROPERTY'; id: string }
  | { type: 'UPDATE_TAX_INFO'; taxInfo: TaxInfo }
  | { type: 'CALCULATE_COMBINED_RESULTS' }
  | { type: 'RESET_PROPERTIES' }
  | { type: 'RESET_COMBINED_RESULTS' };

// Anfänglicher Zustand
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

// Context erstellen
const PropertyContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Berechnet alle Daten für eine Immobilie
function calculatePropertyData(property: Property, taxInfo: TaxInfo): Property {
  try {
    // Berechne Kauf- und laufende Daten
    const purchaseData = calculatePurchase(property);
    const ongoingData = calculateOngoing(property);
    
    // Berechne Cashflow
    const calculationPeriod = 10; // Standard-Betrachtungszeitraum
    const { results, yearlyData } = calculateCashflow(
      { ...property, purchaseData, ongoingData },
      taxInfo,
      calculationPeriod
    );
    
    // Aktualisiere die Immobilie mit berechneten Daten
    return {
      ...property,
      purchaseData,
      ongoingData,
      calculationResults: results,
      yearlyData
    };
  } catch (error) {
    console.error("Fehler bei der Berechnung der Immobiliendaten:", error);
    return property;
  }
}

// Reducer-Funktion
function propertyReducer(state: AppState, action: Action): AppState {
  try {
    switch (action.type) {
    case 'SET_ACTIVE_PROPERTY':
      return {
        ...state,
        activePropertyIndex: action.index
      };
    case 'ADD_PROPERTY': {
        
      // Bei neuer Immobilie sofort alle Berechnungen durchführen
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
        // Bei Update sofort alle Berechnungen durchführen
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
      // Bei Steueränderungen alle Immobilien neu berechnen
      const updatedProperties = state.properties.map(property => 
        calculatePropertyData(property, action.taxInfo)
      );
      
      return {
        ...state,
        taxInfo: action.taxInfo,
        properties: updatedProperties,
        combinedResults: null // Reset combined results to force recalculation
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
      // Berechne kombinierte Ergebnisse
      const { properties, taxInfo } = state;
      const calculationPeriod = 10; // Dies sollte aus einem UI-Wert kommen
      
      // Berechne alle Immobilien, wenn nötig
      const updatedProperties = properties.map(property => {
        if (!property.calculationResults || !property.yearlyData) {
          return calculatePropertyData(property, taxInfo);
        }
        return property;
      });
      
      // Don't proceed if there are no properties
      if (updatedProperties.length === 0) {
        return {
          ...state,
          combinedResults: null
        };
      }
      
      // Kombinierte Ergebnisse berechnen
      const combinedResults = {
        calculationResults: {
          totalCost: 0,
          downPayment: 0,
          loanAmount: 0,
          annuity: 0,
          monthlyPayment: 0,
          monthlyCashflow: 0,
          finalPropertyValue: 0,
          remainingLoan: 0,
          finalEquity: 0,
          initialEquity: 0
        },
        yearlyData: Array(calculationPeriod).fill(0).map((_, index) => ({
          year: index + 1,
          rent: 0,
          ongoingCosts: 0,
          interest: 0,
          principal: 0,
          payment: 0,
          loanBalance: 0,
          buildingDepreciation: 0,
          furnitureDepreciation: 0,
          maintenanceDeduction: 0,
          totalDepreciation: 0,
          taxableIncome: 0,
          firstYearDeductibleCosts: 0,
          previousIncome: 0,
          previousTax: 0,
          previousChurchTax: 0,
          newTotalIncome: 0,
          newTax: 0,
          newChurchTax: 0,
          taxSavings: 0,
          cashflow: 0,
          cashflowBeforeTax: 0,
          propertyValue: 0,
          equity: 0,
          initialEquity: 0,
          vacancyRate: 0,
          propertyTax: 0,
          managementFee: 0,
          maintenanceReserve: 0,
          insurance: 0,
          cashflowBeforeFinancing: 0
        }))
      };
      
      // Summiere die Werte aller Immobilien
      updatedProperties.forEach(property => {
        if (property.calculationResults && property.yearlyData) {
          // Summiere die Berechnungsergebnisse
          const results = property.calculationResults;
          combinedResults.calculationResults.totalCost += results.totalCost;
          combinedResults.calculationResults.downPayment += results.downPayment;
          combinedResults.calculationResults.loanAmount += results.loanAmount;
          combinedResults.calculationResults.annuity += results.annuity;
          combinedResults.calculationResults.monthlyPayment += results.monthlyPayment;
          combinedResults.calculationResults.monthlyCashflow += results.monthlyCashflow;
          combinedResults.calculationResults.finalPropertyValue += results.finalPropertyValue;
          combinedResults.calculationResults.remainingLoan += results.remainingLoan;
          combinedResults.calculationResults.finalEquity += results.finalEquity;
          combinedResults.calculationResults.initialEquity += results.initialEquity;
          
          // Summiere die jährlichen Daten
          property.yearlyData.forEach((yearData, index) => {
            if (index < calculationPeriod) {
              const combinedYear = combinedResults.yearlyData[index];
              
              // Summiere alle numerischen Werte außer Jahr und Prozentsätzen
              Object.keys(yearData).forEach(key => {
                const typedKey = key as keyof YearlyData;
                if (
                  typedKey !== 'year' && 
                  typedKey !== 'vacancyRate' && 
                  typeof yearData[typedKey] === 'number'
                ) {
                  // @ts-ignore (TypeScript versteht nicht, dass wir nur numerische Werte summieren)
                  combinedYear[typedKey] += yearData[typedKey];
                }
              });
            }
          });
        }
      });
      
      return {
        ...state,
        properties: updatedProperties,
        combinedResults
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

// Provider-Komponente
export function PropertyProvider({ children }: { children: ReactNode }) {
  
  const [state, dispatch] = useReducer(propertyReducer, initialState);
  
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    return { state, dispatch };
  }, [state]);
  
  return (
    <PropertyContext.Provider value={contextValue}>
      {children}
    </PropertyContext.Provider>
  );
}

// Custom Hook für einfacheren Zugriff
export function usePropertyStore() {
  const context = useContext(PropertyContext);
  
  if (context === undefined) {
    throw new Error("usePropertyStore must be used within a PropertyProvider");
  }
  
  return context;
}

// Hilfsfunktionen
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