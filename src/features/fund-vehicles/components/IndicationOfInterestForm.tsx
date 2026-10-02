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
import { useSession } from '../../../auth/useSession';
import { fundAcceptsIndications } from '../../../domain/fundRules';
import { isApiError } from '../../../mock/errors';
import type { FundVehicle } from '../../../types/entities';
import { color } from '../../../theme/tokens';

export function IndicationOfInterestForm({ fund }: { fund: FundVehicle }) {
  const { user, decide } = useSession();
  const [amount, setAmount] = useState(fund.minimumCommitmentUsd);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'warning' | 'error' } | null>(null);
  const submit = useSubmitIndication(fund.id);

  const belowMinimum = amount < fund.minimumCommitmentUsd;
  const acceptance = fundAcceptsIndications(fund);
  const closed = !acceptance.ok;
  const permission = decide('ioi:submit');

  // The same rule table the API enforces — here it explains instead of refusing.
  if (!permission.allowed) {
    return (
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Submit an indication of interest</Typography>
        <Typography variant="body2" color="text.secondary">
          {user?.role === 'LP' ? permission.reason : 'Only accredited investor accounts can submit indications of interest.'}
        </Typography>
      </Paper>
    );
  }

  const handleSubmit = async () => {
    try {
      const result = await submit.mutateAsync({
        // A fresh key per attempt is correct here — this is a new user action, not a
        // retry of a dropped request (which would reuse the same key; see api.ts).
        idempotencyKey: `${fund.id}-${user!.id}-${Date.now()}`,
        fundVehicleId: fund.id,
        requestedAmountUsd: amount,
      });
      setSnackbar({
        message: `${indicationStatusLabel[result.status]} — ${formatUsd(result.allocatedAmountUsd ?? 0)} allocated of ${formatUsd(amount)} requested.`,
        severity: result.status === 'ALLOCATED_FULL' ? 'success' : 'warning',
      });
    } catch (e) {
      setSnackbar({ message: isApiError(e) ? e.message : 'Submission failed — please try again.', severity: 'error' });
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderTop: `3px solid ${color.sky[600]}`,
        // The sky accent marks this as an LP-initiated action surface, distinct from the
        // green used for GP/platform actions elsewhere — a semantic use of the new
        // secondary color, not decoration for its own sake.
        background: `linear-gradient(180deg, ${color.sky[100]}80 0%, transparent 140px)`,
      }}
    >
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
          color="secondary"
          onClick={handleSubmit}
          disabled={belowMinimum || closed || submit.isPending}
          sx={{ height: 40 }}
        >
          {submit.isPending ? 'Submitting…' : 'Submit indication'}
        </Button>
      </Stack>

      {closed && (
        <Chip size="small" label={acceptance.ok ? '' : acceptance.message} sx={{ mt: 2, height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } }} />
      )}

      <Snackbar open={!!snackbar} autoHideDuration={6000} onClose={() => setSnackbar(null)}>
        <Alert severity={snackbar?.severity} onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
          <Box component="span">{snackbar?.message}</Box>
        </Alert>
      </Snackbar>
    </Paper>
  );
}
