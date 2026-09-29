import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useFundVehicles } from './queries';
import { formatUsdCompact, strategyLabel, fundStatusLabel } from '../../lib/format';
import type { FundStrategy } from '../../types/entities';
import { Reveal } from '../../motion/Reveal';
import { TiltCard } from '../../motion/TiltCard';
import { AnimatedNumber } from '../../motion/AnimatedNumber';

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  OPEN: 'success',
  OVERSUBSCRIBED: 'warning',
  ALLOCATING: 'warning',
  CLOSED: 'default',
  WITHDRAWN: 'error',
  DRAFT: 'default',
};

export function FundVehicleListPage() {
  const { data: funds, isLoading, isError, refetch } = useFundVehicles();
  const [strategyFilter, setStrategyFilter] = useState<FundStrategy | 'ALL'>('ALL');

  const filtered = useMemo(
    () => (funds ?? []).filter((f) => strategyFilter === 'ALL' || f.strategy === strategyFilter),
    [funds, strategyFilter],
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'stretch', sm: 'baseline' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" gutterBottom>
              Fund Vehicles
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Open capital raises across private equity, credit, venture and real assets.
            </Typography>
          </Box>
          <TextField
            select
            size="small"
            label="Strategy"
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value as FundStrategy | 'ALL')}
            sx={{ minWidth: { xs: '100%', sm: 220 }, bgcolor: 'background.default' }}
          >
            <MenuItem value="ALL">All strategies</MenuItem>
            {Object.entries(strategyLabel).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Typography
              component="button"
              onClick={() => refetch()}
              variant="body2"
              sx={{ border: 0, bgcolor: 'transparent', cursor: 'pointer', fontWeight: 600, color: 'inherit' }}
            >
              Retry
            </Typography>
          }
        >
          Couldn't load fund vehicles. Please try again.
        </Alert>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No fund vehicles match this filter.
        </Typography>
      )}

      <Stack spacing={2}>
        {filtered.map((fund, index) => {
          const pctSubscribed = Math.min(100, Math.round((fund.committedUsd / fund.hardCapUsd) * 100));
          return (
            <Reveal key={fund.id} delay={index * 0.06}>
              <TiltCard>
                <Card variant="outlined">
                  <CardActionArea component={RouterLink} to={`/funds/${fund.id}`}>
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        flexWrap="wrap"
                        rowGap={1}
                      >
                        <Box>
                          <Typography variant="h6">{fund.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {strategyLabel[fund.strategy]} · Vintage {fund.vintage} · {fund.geography.join(', ')}
                          </Typography>
                        </Box>
                        <Chip
                          size="small"
                          label={fundStatusLabel[fund.status]}
                          color={statusColor[fund.status] ?? 'default'}
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 4 }} sx={{ mt: 2 }}>
                        <Stat label="Target size" value={formatUsdCompact(fund.targetSizeUsd)} />
                        <Stat label="Minimum commitment" value={formatUsdCompact(fund.minimumCommitmentUsd)} />
                        <Stat label="Fees" value={`${fund.managementFeePct}% / ${fund.carryPct}% carry`} />
                      </Stack>

                      <Box sx={{ mt: 2 }}>
                        <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            <AnimatedNumber value={fund.committedUsd} format={formatUsdCompact} /> committed of{' '}
                            {formatUsdCompact(fund.hardCapUsd)} hard cap
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            <AnimatedNumber value={pctSubscribed} format={(n) => `${Math.round(n)}%`} />
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={pctSubscribed}
                          color={pctSubscribed >= 100 ? 'warning' : 'primary'}
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </TiltCard>
            </Reveal>
          );
        })}
      </Stack>
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}
