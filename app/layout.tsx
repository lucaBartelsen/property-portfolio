// src/app/layout.tsx
"use client";

import { Inter } from 'next/font/google';
import { MantineProvider, ColorScheme, ColorSchemeProvider } from '@mantine/core';
import { useState } from 'react';
import { PropertyProvider } from '../store/PropertyContext';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
  
  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <html lang="de">
      <body className={inter.className}>
        <MantineProvider 
          withGlobalStyles 
          withNormalizeCSS
          theme={{ colorScheme }}
        >
          <PropertyProvider>
            {children}
          </PropertyProvider>
        </MantineProvider>
      </body>
    </html>
  );
}