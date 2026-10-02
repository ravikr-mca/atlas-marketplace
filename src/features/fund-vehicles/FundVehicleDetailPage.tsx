import { Link as RouterLink, useParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, Grid, LinearProgress, Link, Skeleton, Stack, Typography } from '@mui/material';
import { useFundVehicle, useOrganization } from './queries';
import { formatUsdCompact, strategyLabel, fundStatusLabel } from '../../lib/format';
import { TiptapViewer } from './components/TiptapViewer';
import { FundPerformanceChart } from './components/FundPerformanceChart';
import { DataRoomList } from './components/DataRoomList';
import { IndicationOfInterestForm } from './components/IndicationOfInterestForm';
import { VerificationBadge } from '../../components/VerificationBadge';
import { Reveal } from '../../motion/Reveal';
import { AnimatedNumber } from '../../motion/AnimatedNumber';

export function FundVehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: fund, isLoading, isError, refetch } = useFundVehicle(id ?? '');
  const { data: gp } = useOrganization(fund?.gpOrganizationId);

  if (isLoading) {
    return <Skeleton variant="rounded" height={240} />;
  }

  if (isError) {
    return (
      <Alert severity="error" action={<Button onClick={() => refetch()}>Retry</Button>}>
        Couldn't load this fund. Please try again.
      </Alert>
    );
  }

  if (!fund) {
    return (
      <Alert severity="warning" action={<Button component={RouterLink} to="/">Back to Fund Vehicles</Button>}>
        This fund vehicle doesn't exist or is no longer listed.
      </Alert>
    );
  }

  const pctSubscribed = Math.min(100, Math.round((fund.committedUsd / fund.hardCapUsd) * 100));

  return (
    <Box>
      <Box sx={{ mb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            {fund.name}
          </Typography>
          <Chip size="small" label={fundStatusLabel[fund.status]} color="primary" variant="outlined" />
        </Stack>
        <Typography variant="body1" color="text.secondary">
          {strategyLabel[fund.strategy]} · Vintage {fund.vintage} · Managed by{' '}
          {gp ? <Link component={RouterLink} to={`/orgs/${gp.id}`}>{gp.name}</Link> : '…'}
        </Typography>
        {gp && <Box sx={{ mt: 1 }}><VerificationBadge organization={gp} /></Box>}
      </Box>

      <Box sx={{ mb: 4, maxWidth: 480 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            <AnimatedNumber value={fund.committedUsd} format={formatUsdCompact} /> committed of{' '}
            {formatUsdCompact(fund.hardCapUsd)} hard cap
          </Typography>
          <Typography variant="caption" color="text.secondary">
            <AnimatedNumber value={pctSubscribed} format={(n) => `${Math.round(n)}%`} />
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={pctSubscribed} sx={{ height: 8, borderRadius: 4 }} />
      </Box>

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Stack spacing={4}>
            <Reveal>
              <TiptapViewer html={fund.narrativeHtml} />
            </Reveal>
            <Reveal delay={0.08}>
              <FundPerformanceChart fund={fund} />
            </Reveal>
            <Reveal delay={0.16}>
              <DataRoomList fundVehicleId={fund.id} />
            </Reveal>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Reveal direction="left" delay={0.1}>
            <IndicationOfInterestForm fund={fund} />
          </Reveal>
        </Grid>
      </Grid>
    </Box>
  );
}
