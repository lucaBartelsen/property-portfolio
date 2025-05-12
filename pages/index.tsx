// pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to login page
    router.push('/login');
  }, [router]);
  
  return <div>Redirecting...</div>;
}