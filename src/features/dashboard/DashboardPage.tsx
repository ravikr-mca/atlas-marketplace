import { useAppSelector } from '../../hooks/useTypedRedux';
import { GpDashboard } from './components/GpDashboard';
import { LpDashboard } from './components/LpDashboard';
import { AuditDashboard } from './components/AuditDashboard';

export function DashboardPage() {
  const { viewAs } = useAppSelector((s) => s.session);

  if (viewAs === 'GP') return <GpDashboard />;
  if (viewAs === 'LP') return <LpDashboard />;
  return <AuditDashboard />; // ADMIN / COMPLIANCE
}
