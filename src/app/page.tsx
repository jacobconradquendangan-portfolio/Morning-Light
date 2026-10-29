import { CalorieCounterAppClient } from '@/components/CalorieCounterAppClient';

export const dynamic = 'force-dynamic';

export default function Home() {
  const today = new Date().toISOString().split('T')[0];
  return <CalorieCounterAppClient initialDate={today} />;
}