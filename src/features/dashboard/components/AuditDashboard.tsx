import { Box, Typography } from '@mui/material';
import { useAllIndications, useFundVehicles, useOrganizations } from '../../fund-vehicles/queries';
import { IndicationsList } from './IndicationsList';

// Compliance/Admin oversight: every indication across the platform, read-only — no
// allocation authority, matching the "Compliance... read/audit access but no allocation
// authority" separation described in proposal/concept.md.
export function AuditDashboard() {
  const { data: indications } = useAllIndications();
  const { data: funds } = useFundVehicles();
  const { data: organizations } = useOrganizations();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        All indications — audit view
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Read-only across every fund and investor. Every status change here is timestamped
        in the audit log (`updatedAt`) for dispute resolution.
      </Typography>
      <IndicationsList
        indications={indications ?? []}
        funds={funds ?? []}
        organizations={organizations ?? []}
        orgColumnLabel="Investor"
      />
    </Box>
  );
}
