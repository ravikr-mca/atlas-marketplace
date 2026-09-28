import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { FundVehicleListPage } from './features/fund-vehicles/FundVehicleListPage';
import { FundVehicleDetailPage } from './features/fund-vehicles/FundVehicleDetailPage';
import { DashboardPage } from './features/dashboard/DashboardPage';

export function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<FundVehicleListPage />} />
        <Route path="/funds/:id" element={<FundVehicleDetailPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </AppShell>
  );
}
