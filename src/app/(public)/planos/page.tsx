export const dynamic = 'force-dynamic';
import { listActivePlans } from '@/server/services/billing.service';
import PlanosClient from './PlanosClient';
export default async function PlanosPage() {
  const plans = await listActivePlans();
  return <PlanosClient plans={plans} />;
}
