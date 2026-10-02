import { useSession } from '../../auth/useSession';
import { GpDashboard } from './components/GpDashboard';
import { LpDashboard } from './components/LpDashboard';
import { AuditDashboard } from './components/AuditDashboard';

export function DashboardPage() {
  const { user } = useSession();
  if (user?.role === 'GP') return <GpDashboard />;
  if (user?.role === 'LP') return <LpDashboard />;
  return <AuditDashboard />; // ADMIN / COMPLIANCE
}
