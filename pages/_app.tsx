// pages/_app.tsx
import { useState } from 'react';
import { AppProps } from 'next/app';
import { MantineProvider, ColorScheme, ColorSchemeProvider } from '@mantine/core';
import { SessionProvider } from 'next-auth/react';
import '../styles/globals.css';

export default function App({ 
  Component, 
  pageProps: { session, ...pageProps } 
}: AppProps) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  
  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <SessionProvider session={session}>
      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
        <MantineProvider
          withGlobalStyles
          withNormalizeCSS
          theme={{ colorScheme }}
        >
          <Component {...pageProps} />
        </MantineProvider>
      </ColorSchemeProvider>
    </SessionProvider>
  );
}