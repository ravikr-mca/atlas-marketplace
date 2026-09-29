import { AnimatePresence, motion } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { FundVehicleListPage } from './features/fund-vehicles/FundVehicleListPage';
import { FundVehicleDetailPage } from './features/fund-vehicles/FundVehicleDetailPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { usePrefersReducedMotion } from './motion/usePrefersReducedMotion';

export function App() {
  const location = useLocation();
  const reducedMotion = usePrefersReducedMotion();

  return (
    <AppShell>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <Routes location={location}>
            <Route path="/" element={<FundVehicleListPage />} />
            <Route path="/funds/:id" element={<FundVehicleDetailPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
}
