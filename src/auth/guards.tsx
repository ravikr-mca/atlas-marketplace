import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAppSelector } from '../hooks/useTypedRedux';
import { ForbiddenPage } from '../features/auth/ForbiddenPage';
import { useSession } from './useSession';
import type { Permission } from './permissions';

export function RequireAuth() {
  const { status } = useSession();
  const ended = useAppSelector((s) => s.session.endedReason);
  const location = useLocation();

  if (status === 'loading') {
    return (
      <Box role="status" aria-label="Loading your session" sx={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (status === 'anonymous') {
    const next = encodeURIComponent(location.pathname + location.search);
    const reason = ended === 'expired' ? '&reason=expired' : '';
    return <Navigate to={`/login?next=${next}${reason}`} replace />;
  }
  return <Outlet />;
}

/** Route-level gate. Shows a 403 that says *why*, rather than silently redirecting. */
export function RequirePermission({ permission }: { permission: Permission }) {
  const { decide } = useSession();
  const d = decide(permission);
  return d.allowed ? <Outlet /> : <ForbiddenPage reason={d.reason} />;
}
