import { useMemo, useState } from 'react';
import {
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

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'error'> = {
  OPEN: 'success',
  OVERSUBSCRIBED: 'warning',
  ALLOCATING: 'warning',
  CLOSED: 'default',
  WITHDRAWN: 'error',
  DRAFT: 'default',
};

export function FundVehicleListPage() {
  const { data: funds, isLoading } = useFundVehicles();
  const [strategyFilter, setStrategyFilter] = useState<FundStrategy | 'ALL'>('ALL');

  const filtered = useMemo(
    () => (funds ?? []).filter((f) => strategyFilter === 'ALL' || f.strategy === strategyFilter),
    [funds, strategyFilter],
  );

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'baseline' }}
        spacing={2}
        sx={{ mb: 3 }}
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
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
        >
          <MenuItem value="ALL">All strategies</MenuItem>
          {Object.entries(strategyLabel).map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      <Stack spacing={2}>
        {filtered.map((fund) => {
          const pctSubscribed = Math.min(100, Math.round((fund.committedUsd / fund.hardCapUsd) * 100));
          return (
            <Card key={fund.id} variant="outlined">
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
                        {formatUsdCompact(fund.committedUsd)} committed of {formatUsdCompact(fund.hardCapUsd)} hard cap
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pctSubscribed}%
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
