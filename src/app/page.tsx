import Dashboard from '@/components/Dashboard';
import LandingPage from '@/components/LandingPage';
import { isAuthenticated } from '@/lib/auth';

export default async function Home() {
  const authenticated = await isAuthenticated();
  
  if (!authenticated) {
    return <LandingPage />;
  }
  
  return <Dashboard />;
}