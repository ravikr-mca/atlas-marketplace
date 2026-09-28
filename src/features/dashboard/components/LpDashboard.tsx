import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useFundVehicles, useIndicationsForOrg, useOrganizations, useTransitionIndication } from '../../fund-vehicles/queries';
import { IndicationsList } from './IndicationsList';

const LP_ORG_ID = 'org-lp-1'; // matches IndicationOfInterestForm's demo LP org

export function LpDashboard() {
  const { data: funds } = useFundVehicles();
  const { data: organizations } = useOrganizations();
  const { data: indications } = useIndicationsForOrg(LP_ORG_ID);
  const transition = useTransitionIndication();

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1} sx={{ mb: 2 }}>
        <Typography variant="h5">Your indications</Typography>
        <Button component={RouterLink} to="/" variant="outlined" size="small">
          Browse fund vehicles
        </Button>
      </Stack>
      <IndicationsList
        indications={indications ?? []}
        funds={funds ?? []}
        organizations={organizations ?? []}
        orgColumnLabel="Fund manager"
        resolveOrgId={(indication) => funds?.find((f) => f.id === indication.fundVehicleId)?.gpOrganizationId}
        renderActions={(indication) => {
          if (indication.status === 'ALLOCATED_FULL' || indication.status === 'ALLOCATED_PARTIAL') {
            return (
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => transition.mutate({ id: indication.id, action: 'ACCEPT_ALLOCATION' })}
                >
                  Accept
                </Button>
                {indication.status === 'ALLOCATED_PARTIAL' && (
                  <Button
                    size="small"
                    color="error"
                    variant="outlined"
                    onClick={() => transition.mutate({ id: indication.id, action: 'WITHDRAW' })}
                  >
                    Withdraw
                  </Button>
                )}
              </Stack>
            );
          }
          if (indication.status === 'UNDER_REVIEW') {
            return (
              <Button
                size="small"
                color="error"
                variant="outlined"
                onClick={() => transition.mutate({ id: indication.id, action: 'WITHDRAW' })}
              >
                Withdraw
              </Button>
            );
          }
          return null;
        }}
      />
    </Box>
  );
}
