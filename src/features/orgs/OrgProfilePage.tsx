import { Link as RouterLink, useParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFundVehicles, useOrganization, useTrackRecords } from '../fund-vehicles/queries';
import { VerificationBadge } from '../../components/VerificationBadge';
import { ForbiddenPage } from '../auth/ForbiddenPage';
import { isApiError } from '../../mock/errors';
import { formatPercent, formatUsdCompact, fundStatusLabel, strategyLabel } from '../../lib/format';
import { color } from '../../theme/tokens';
import { Reveal } from '../../motion/Reveal';
import type { Organization } from '../../types/entities';

const tierLabel: Record<string, string> = {
  FAMILY_OFFICE: 'Family office', SOVEREIGN_WEALTH: 'Sovereign wealth fund', INSTITUTION: 'Institution', UHNWI: 'Ultra-high-net-worth individual',
};

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography fontWeight={600}>{value}</Typography>
    </Box>
  );
}

function ManagerTrackRecord({ orgId }: { orgId: string }) {
  const { data: records } = useTrackRecords(orgId);
  if (!records?.length) {
    return <Typography color="text.secondary">No prior funds on record yet — a manager's track record is added during verification.</Typography>;
  }
  const byVintage = [...records].sort((a, b) => a.vintage - b.vintage).map((r) => ({ vintage: String(r.vintage), netIrr: r.netIrr, name: r.fundName }));
  return (
    <Stack spacing={2}>
      <Box sx={{ width: '100%', height: 220 }} role="img" aria-label={`Net IRR by vintage: ${byVintage.map((r) => `${r.vintage} ${r.netIrr}%`).join(', ')}`}>
        <ResponsiveContainer>
          <BarChart data={byVintage} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={color.neutral[200]} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="vintage" tick={{ fontSize: 12, fill: color.ink[700] }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: color.ink[700] }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
            <Tooltip formatter={(v) => `${v}%`} labelFormatter={(_, p) => p?.[0]?.payload?.name} />
            <Bar dataKey="netIrr" name="Net IRR" fill={color.forest[700]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Box>
      <TableContainer>
        <Table size="small" aria-label="Track record">
          <TableHead>
            <TableRow><TableCell>Fund</TableCell><TableCell>Vintage</TableCell><TableCell>Strategy</TableCell><TableCell align="right">Net IRR</TableCell><TableCell align="right">MOIC</TableCell><TableCell>Status</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {records.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.fundName}</TableCell><TableCell>{r.vintage}</TableCell><TableCell>{r.strategy}</TableCell>
                <TableCell align="right">{formatPercent(r.netIrr)}</TableCell><TableCell align="right">{r.moic.toFixed(1)}x</TableCell>
                <TableCell><Chip size="small" variant="outlined" label={r.status === 'REALIZED' ? 'Realized' : 'Active'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function ManagerFunds({ org }: { org: Organization }) {
  const { data: funds } = useFundVehicles();
  const own = (funds ?? []).filter((f) => f.gpOrganizationId === org.id);
  if (!own.length) return <Typography color="text.secondary">No listings visible to you.</Typography>;
  return (
    <Stack spacing={1}>
      {own.map((f) => (
        <Paper key={f.id} variant="outlined" component={RouterLink} to={`/funds/${f.id}`} sx={{ p: 1.5, textDecoration: 'none', color: 'inherit', '&:hover': { borderColor: 'primary.main' } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={0.5}>
            <Typography fontWeight={600}>{f.name}</Typography>
            <Typography variant="body2" color="text.secondary">{strategyLabel[f.strategy]} · {formatUsdCompact(f.targetSizeUsd)} target · {fundStatusLabel[f.status]}</Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}

export function OrgProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading, error } = useOrganization(id);

  if (isLoading) return <Skeleton variant="rounded" height={240} />;
  if (isApiError(error) && error.code === 'FORBIDDEN') return <ForbiddenPage reason={error.message} />;
  if (!org) return <Alert severity="warning" action={<Button component={RouterLink} to="/">Back</Button>}>This organization doesn't exist.</Alert>;

  const isManager = org.kind === 'FUND_MANAGER';
  return (
    <Stack spacing={3}>
      <Reveal>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" rowGap={1}>
            <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>{org.name}</Typography>
            {org.kind !== 'PLATFORM' && <VerificationBadge organization={org} size="medium" />}
          </Stack>
          <Typography color="text.secondary">
            {isManager ? 'Fund manager' : org.kind === 'INVESTOR' ? tierLabel[org.investorTier ?? ''] ?? 'Investor' : 'Platform operator'} · {org.hqLocation}
          </Typography>
          <Typography sx={{ maxWidth: 720 }}>{org.bio}</Typography>
          {org.rejectionReason && <Alert severity="warning" sx={{ maxWidth: 720 }}>Accreditation application not approved: {org.rejectionReason}</Alert>}
        </Stack>
      </Reveal>

      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' } }}>
          {org.foundedYear && <Fact label="Founded" value={String(org.foundedYear)} />}
          {org.aum && <Fact label="Assets under management" value={formatUsdCompact(org.aum)} />}
          {org.ticketRange && <Fact label="Typical ticket" value={`${formatUsdCompact(org.ticketRange.min)} – ${formatUsdCompact(org.ticketRange.max)}`} />}
          <Fact label="Headquarters" value={org.hqLocation} />
        </Box>
        {org.mandate && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">Mandate</Typography>
            <Typography>{org.mandate}</Typography>
            {!!org.strategiesOfInterest?.length && (
              <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 1 }}>
                {org.strategiesOfInterest.map((s) => <Chip key={s} size="small" label={strategyLabel[s]} />)}
              </Stack>
            )}
          </Box>
        )}
      </Paper>

      {isManager && (
        <>
          <Box><Typography variant="h6" gutterBottom>Track record</Typography><ManagerTrackRecord orgId={org.id} /></Box>
          <Box><Typography variant="h6" gutterBottom>Listings</Typography><ManagerFunds org={org} /></Box>
        </>
      )}
    </Stack>
  );
}
