import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Skeleton, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useApprovalQueue, useReviewOrganization } from '../fund-vehicles/queries';
import { VerificationBadge } from '../../components/VerificationBadge';
import { isApiError } from '../../mock/errors';
import { formatUsdCompact } from '../../lib/format';
import type { Organization } from '../../types/entities';

function OrgCard({ org, onApprove, onReject, busy }: { org: Organization; onApprove?: () => void; onReject?: () => void; busy: boolean }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
              <Typography fontWeight={600} component={RouterLink} to={`/orgs/${org.id}`} sx={{ color: 'inherit' }}>{org.name}</Typography>
              <VerificationBadge organization={org} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {org.kind === 'FUND_MANAGER' ? `Fund manager · ${org.aum ? formatUsdCompact(org.aum) + ' AUM · ' : ''}` : 'Investor · '}{org.hqLocation}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>{org.bio}</Typography>
            {org.rejectionReason && <Alert severity="warning" sx={{ mt: 1 }}>Previously rejected: {org.rejectionReason}</Alert>}
          </Box>
          {onApprove && (
            <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1} sx={{ flexShrink: 0 }}>
              <Button variant="contained" disabled={busy} onClick={onApprove}>Approve</Button>
              <Button variant="outlined" color="error" disabled={busy} onClick={onReject}>Reject…</Button>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ApprovalsPage() {
  const { data: queue, isLoading } = useApprovalQueue();
  const review = useReviewOrganization();
  const [rejecting, setRejecting] = useState<Organization | null>(null);
  const [reason, setReason] = useState('');
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const decide = async (org: Organization, decision: 'APPROVE' | 'REJECT', why?: string) => {
    try {
      await review.mutateAsync({ organizationId: org.id, decision, reason: why });
      setToast({ severity: 'success', message: decision === 'APPROVE' ? `${org.name} is now verified — their permissions have changed immediately.` : `${org.name} was rejected; they've been notified with your reason.` });
      setRejecting(null);
      setReason('');
    } catch (e) {
      setToast({ severity: 'error', message: isApiError(e) ? e.message : 'That didn’t work — please try again.' });
    }
  };

  const pending = (queue ?? []).filter((o) => o.accreditation === 'PENDING');
  const others = (queue ?? []).filter((o) => o.accreditation !== 'PENDING');

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h5" component="h1" gutterBottom>Accreditation approvals</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680 }}>
          Nobody transacts on Atlas until Greenstone has verified who they are. Approve an organization and the right to submit indications,
          open data rooms and message managers (or to publish listings) switches on immediately. Every decision is written to the audit trail.
        </Typography>
      </Box>
      {isLoading ? <Skeleton variant="rounded" height={160} /> : (
        <>
          <Box>
            <Typography variant="h6" gutterBottom>Waiting for review ({pending.length})</Typography>
            <Stack spacing={1.5}>
              {pending.length === 0 && <Alert severity="success">Nothing waiting — every application has been decided.</Alert>}
              {pending.map((o) => <OrgCard key={o.id} org={o} busy={review.isPending} onApprove={() => decide(o, 'APPROVE')} onReject={() => setRejecting(o)} />)}
            </Stack>
          </Box>
          <Box>
            <Typography variant="h6" gutterBottom>Not accredited ({others.length})</Typography>
            <Stack spacing={1.5}>
              {others.length === 0 && <Typography color="text.secondary">None.</Typography>}
              {others.map((o) => <OrgCard key={o.id} org={o} busy={false} />)}
            </Stack>
          </Box>
        </>
      )}

      <Dialog open={!!rejecting} onClose={() => setRejecting(null)} fullWidth maxWidth="sm">
        <DialogTitle>Reject {rejecting?.name}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>The applicant sees this reason. Be specific about what they would need to provide.</Typography>
          <TextField autoFocus fullWidth multiline minRows={3} label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejecting(null)}>Cancel</Button>
          <Button color="error" variant="contained" disabled={!reason.trim() || review.isPending} onClick={() => rejecting && decide(rejecting, 'REJECT', reason)}>Reject application</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!toast} autoHideDuration={6000} onClose={() => setToast(null)}>
        <Alert severity={toast?.severity} onClose={() => setToast(null)} sx={{ width: '100%' }}>{toast?.message}</Alert>
      </Snackbar>
    </Stack>
  );
}
