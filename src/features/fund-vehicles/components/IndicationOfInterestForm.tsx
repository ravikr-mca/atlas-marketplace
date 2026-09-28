import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSubmitIndication } from '../queries';
import { formatUsd, indicationStatusLabel } from '../../../lib/format';
import { useAppSelector } from '../../../hooks/useTypedRedux';
import type { FundVehicle } from '../../../types/entities';

// A demo LP org standing in for "whichever org the signed-in user represents" — this
// prototype has no real multi-tenant auth (see proposal for the Entra ID production
// plan), so submissions are attributed to a fixed sample investor org.
const DEMO_LP_ORG_ID = 'org-lp-1';

export function IndicationOfInterestForm({ fund }: { fund: FundVehicle }) {
  const { viewAs } = useAppSelector((s) => s.session);
  const [amount, setAmount] = useState(fund.minimumCommitmentUsd);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'warning' | 'error' } | null>(null);
  const submit = useSubmitIndication(fund.id);

  const belowMinimum = amount < fund.minimumCommitmentUsd;
  const closed = fund.status === 'CLOSED' || fund.status === 'WITHDRAWN';

  if (viewAs !== 'LP') {
    return (
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          Switch "Viewing as" to <strong>LP</strong> in the header to submit an indication
          of interest for this fund.
        </Typography>
      </Paper>
    );
  }

  const handleSubmit = async () => {
    try {
      const result = await submit.mutateAsync({
        // A fresh key per attempt is correct here — this is a new user action, not a
        // retry of a dropped request (which would reuse the same key; see api.ts).
        idempotencyKey: `${fund.id}-${DEMO_LP_ORG_ID}-${Date.now()}`,
        fundVehicleId: fund.id,
        lpOrganizationId: DEMO_LP_ORG_ID,
        requestedAmountUsd: amount,
      });
      setSnackbar({
        message: `${indicationStatusLabel[result.status]} — ${formatUsd(result.allocatedAmountUsd ?? 0)} allocated of ${formatUsd(amount)} requested.`,
        severity: result.status === 'ALLOCATED_FULL' ? 'success' : 'warning',
      });
    } catch {
      setSnackbar({ message: 'Submission failed — please try again.', severity: 'error' });
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Submit an indication of interest
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Minimum commitment {formatUsd(fund.minimumCommitmentUsd)}. This is a non-binding
        indication — allocation is confirmed against the fund's live capacity when you
        submit.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
        <TextField
          label="Requested amount (USD)"
          type="number"
          size="small"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          error={belowMinimum}
          helperText={belowMinimum ? `Below the ${formatUsd(fund.minimumCommitmentUsd)} minimum` : ' '}
          sx={{ minWidth: { sm: 220 } }}
          disabled={closed}
        />
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={belowMinimum || closed || submit.isPending}
          sx={{ height: 40 }}
        >
          {submit.isPending ? 'Submitting…' : 'Submit indication'}
        </Button>
      </Stack>

      {closed && (
        <Chip size="small" label="This fund is no longer accepting indications" sx={{ mt: 2 }} />
      )}

      <Snackbar open={!!snackbar} autoHideDuration={6000} onClose={() => setSnackbar(null)}>
        <Alert severity={snackbar?.severity} onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
          <Box component="span">{snackbar?.message}</Box>
        </Alert>
      </Snackbar>
    </Paper>
  );
}
