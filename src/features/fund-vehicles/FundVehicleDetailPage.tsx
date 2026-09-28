import { useParams } from 'react-router-dom';
import { Box, Chip, LinearProgress, Skeleton, Stack, Typography } from '@mui/material';
import { useFundVehicle, useOrganization } from './queries';
import { formatUsdCompact, strategyLabel, fundStatusLabel } from '../../lib/format';

// Phase 3 fills this out with the Tiptap narrative render, Recharts benchmark chart,
// data-room PDF viewer, and the Indication-of-Interest submission form. This is the
// Phase-1 scaffold: routing + data fetching wired, so the browse -> detail path already
// works end to end against the mock API.
export function FundVehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: fund, isLoading } = useFundVehicle(id ?? '');
  const { data: gp } = useOrganization(fund?.gpOrganizationId);

  if (isLoading || !fund) {
    return <Skeleton variant="rounded" height={240} />;
  }

  const pctSubscribed = Math.min(100, Math.round((fund.committedUsd / fund.hardCapUsd) * 100));

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1} sx={{ mb: 1 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          {fund.name}
        </Typography>
        <Chip size="small" label={fundStatusLabel[fund.status]} color="primary" variant="outlined" />
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {strategyLabel[fund.strategy]} · Vintage {fund.vintage} · Managed by {gp?.name ?? '…'}
      </Typography>

      <Box sx={{ mb: 3, maxWidth: 480 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {formatUsdCompact(fund.committedUsd)} committed of {formatUsdCompact(fund.hardCapUsd)} hard cap
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {pctSubscribed}%
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={pctSubscribed} sx={{ height: 8, borderRadius: 4 }} />
      </Box>

      <div dangerouslySetInnerHTML={{ __html: fund.narrativeHtml }} />
    </Box>
  );
}
