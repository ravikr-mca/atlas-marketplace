import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useFundVehicles, useIndicationsForGpOrg, useOrganizations, useTransitionIndication } from '../../fund-vehicles/queries';
import { IndicationsList } from './IndicationsList';
import { formatUsdCompact } from '../../../lib/format';
import type { IndicationOfInterest } from '../../../types/entities';
import { Reveal } from '../../../motion/Reveal';
import { AnimatedNumber } from '../../../motion/AnimatedNumber';

const GP_ORG_ID = 'org-gp-1'; // demo GP org — see IndicationOfInterestForm for the equivalent LP-side note

export function GpDashboard() {
  const { data: allFunds } = useFundVehicles();
  const { data: organizations } = useOrganizations();
  const { data: indications } = useIndicationsForGpOrg(GP_ORG_ID);
  const transition = useTransitionIndication();
  const [declining, setDeclining] = useState<IndicationOfInterest | null>(null);
  const [reason, setReason] = useState('');

  const ownFunds = (allFunds ?? []).filter((f) => f.gpOrganizationId === GP_ORG_ID);

  const confirmDecline = async () => {
    if (!declining) return;
    await transition.mutateAsync({ id: declining.id, action: 'DECLINE', notes: reason });
    setDeclining(null);
    setReason('');
  };

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h5" gutterBottom>
          Your fund vehicles
        </Typography>
        <Stack spacing={1.5}>
          {ownFunds.map((fund, index) => {
            const pct = Math.min(100, Math.round((fund.committedUsd / fund.hardCapUsd) * 100));
            return (
              <Reveal key={fund.id} delay={index * 0.06}>
                <Card variant="outlined">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
                      <Typography variant="subtitle1">{fund.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        <AnimatedNumber value={fund.committedUsd} format={formatUsdCompact} /> /{' '}
                        {formatUsdCompact(fund.hardCapUsd)} (<AnimatedNumber value={pct} format={(n) => `${Math.round(n)}%`} />)
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      color={pct >= 100 ? 'warning' : 'primary'}
                      sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    />
                  </CardContent>
                </Card>
              </Reveal>
            );
          })}
        </Stack>
      </Box>

      <Box>
        <Typography variant="h5" gutterBottom>
          Indications of interest
        </Typography>
        <IndicationsList
          indications={indications ?? []}
          funds={allFunds ?? []}
          organizations={organizations ?? []}
          orgColumnLabel="Investor"
          renderActions={(indication) => {
            if (indication.status === 'UNDER_REVIEW') {
              return (
                <Button size="small" color="error" variant="outlined" onClick={() => setDeclining(indication)}>
                  Decline
                </Button>
              );
            }
            if (['SUBSCRIPTION_SENT', 'KYC_VERIFIED', 'SIGNED'].includes(indication.status)) {
              return (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => transition.mutate({ id: indication.id, action: 'ADVANCE' })}
                >
                  Advance
                </Button>
              );
            }
            return null;
          }}
        />
      </Box>

      <Dialog open={!!declining} onClose={() => setDeclining(null)} fullWidth maxWidth="xs">
        <DialogTitle>Decline indication</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            A reason is required — it's shown to the LP and kept in the audit log.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeclining(null)}>Cancel</Button>
          <Button variant="contained" color="error" disabled={!reason.trim()} onClick={confirmDecline}>
            Decline
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
