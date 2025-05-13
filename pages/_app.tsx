// pages/_app.tsx
import { useState } from 'react';
import { AppProps } from 'next/app';
import { MantineProvider, ColorScheme, ColorSchemeProvider } from '@mantine/core';
import { SessionProvider } from 'next-auth/react';
import { PropertyProvider } from '../store/PropertyContext';
import '../styles/globals.css';

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}: AppProps) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  
  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  };

  console.log("App rendering with PropertyProvider");

  return (
    <SessionProvider session={session}>
      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{ colorScheme }}
        >
          <PropertyProvider>
            <Component {...pageProps} />
          </PropertyProvider>
        </MantineProvider>
      </ColorSchemeProvider>
    </SessionProvider>
  );
}