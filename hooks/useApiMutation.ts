// hooks/useApiMutation.ts
import { useState } from 'react';

export function useApiMutation<TData, TVariables>(
  url: string, 
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
) {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  const mutate = async (variables?: TVariables): Promise<TData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: variables ? JSON.stringify(variables) : undefined,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.status}`);
      }
      
      // For DELETE requests that don't return data
      if (method === 'DELETE' && response.status === 204) {
        setData(null);
        return null;
      }
      
      const responseData = await response.json();
      setData(responseData);
      return responseData;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, data, error, loading };
}