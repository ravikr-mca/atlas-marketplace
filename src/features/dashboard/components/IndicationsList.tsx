import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardContent, Chip, Link, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { FundVehicle, IndicationOfInterest, Organization } from '../../../types/entities';
import { formatUsd, indicationStatusLabel } from '../../../lib/format';
import { color } from '../../../theme/tokens';
import { Reveal } from '../../../motion/Reveal';
import { AnimatedNumber } from '../../../motion/AnimatedNumber';

const statusColor: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  UNDER_REVIEW: 'info',
  ALLOCATED_FULL: 'success',
  ALLOCATED_PARTIAL: 'warning',
  DECLINED: 'error',
  WITHDRAWN: 'default',
  SUBSCRIPTION_SENT: 'info',
  KYC_VERIFIED: 'info',
  SIGNED: 'success',
  FUNDED: 'success',
};

// Same statuses, as hex — used for the mobile cards' left accent stripe, where a MUI
// palette-key string isn't directly usable as a CSS color.
const statusHex: Record<string, string> = {
  UNDER_REVIEW: color.semantic.info,
  ALLOCATED_FULL: color.semantic.success,
  ALLOCATED_PARTIAL: color.semantic.warning,
  DECLINED: color.semantic.danger,
  WITHDRAWN: color.ink[500],
  SUBSCRIPTION_SENT: color.semantic.info,
  KYC_VERIFIED: color.semantic.info,
  SIGNED: color.semantic.success,
  FUNDED: color.semantic.success,
};

interface Row {
  indication: IndicationOfInterest;
  fundName: string;
  orgName: string;
  orgId?: string;
}

export function IndicationsList({
  indications,
  funds,
  organizations,
  orgColumnLabel,
  resolveOrgId,
  renderActions,
}: {
  indications: IndicationOfInterest[];
  funds: FundVehicle[];
  organizations: Organization[];
  orgColumnLabel: string;
  /** Which org to show per row — the LP (investor) from a GP/audit view, or the fund's
   * GP (manager) from an LP view. Defaults to the LP, the more common case. */
  resolveOrgId?: (indication: IndicationOfInterest) => string | undefined;
  renderActions?: (indication: IndicationOfInterest) => ReactNode;
}) {
  const theme = useTheme();
  // MUI X Data Grid forces its own horizontal scroll rather than genuinely reflowing —
  // exactly what the responsive rule (see the plan) says a grid must never do to the
  // page itself, so below `sm` this renders as stacked cards instead of the grid.
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fundName = (id: string) => funds.find((f) => f.id === id)?.name ?? id;
  const orgName = (id: string | undefined) => (id && organizations.find((o) => o.id === id)?.name) ?? '—';

  const rows: Row[] = indications.map((indication) => {
    const orgId = (resolveOrgId ?? ((i) => i.lpOrganizationId))(indication);
    return { indication, fundName: fundName(indication.fundVehicleId), orgName: orgName(orgId), orgId };
  });

  if (indications.length === 0) {
    return (
      <Paper
        variant="outlined"
        sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', borderColor: color.neutral[200] }}
      >
        <Typography variant="body2" color="text.secondary">
          Nothing here yet.
        </Typography>
      </Paper>
    );
  }

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {rows.map(({ indication, fundName: fn, orgName: on, orgId }, index) => (
          <Reveal key={indication.id} delay={index * 0.05}>
            <Card
              variant="outlined"
              sx={{ borderLeft: `4px solid ${statusHex[indication.status] ?? color.neutral[200]}` }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" rowGap={1}>
                  <Box>
                    <Typography variant="subtitle2">{fn}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {orgColumnLabel}:{' '}
                      {orgId ? <Link component={RouterLink} to={`/orgs/${orgId}`}>{on}</Link> : on}
                    </Typography>
                  </Box>
                  <Chip size="small" label={indicationStatusLabel[indication.status]} color={statusColor[indication.status]} />
                </Stack>
                <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Requested
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatUsd(indication.requestedAmountUsd)}
                    </Typography>
                  </Box>
                  {indication.allocatedAmountUsd !== undefined && (
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Allocated
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        <AnimatedNumber value={indication.allocatedAmountUsd} format={formatUsd} />
                      </Typography>
                    </Box>
                  )}
                </Stack>
                {renderActions && <Box sx={{ mt: 1.5 }}>{renderActions(indication)}</Box>}
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </Stack>
    );
  }

  const columns: GridColDef<Row>[] = [
    { field: 'fundName', headerName: 'Fund', flex: 1.2, minWidth: 160 },
    {
      field: 'orgName', headerName: orgColumnLabel, flex: 1, minWidth: 160,
      renderCell: ({ row }) => (row.orgId ? <Link component={RouterLink} to={`/orgs/${row.orgId}`}>{row.orgName}</Link> : row.orgName),
    },
    {
      field: 'requested',
      headerName: 'Requested',
      flex: 0.7,
      minWidth: 120,
      valueGetter: (_value, row) => row.indication.requestedAmountUsd,
      valueFormatter: (value: number) => formatUsd(value),
    },
    {
      field: 'allocated',
      headerName: 'Allocated',
      flex: 0.7,
      minWidth: 120,
      valueGetter: (_value, row) => row.indication.allocatedAmountUsd ?? null,
      valueFormatter: (value: number | null) => (value == null ? '—' : formatUsd(value)),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.9,
      minWidth: 160,
      renderCell: (params) => (
        <Chip
          size="small"
          label={indicationStatusLabel[params.row.indication.status]}
          color={statusColor[params.row.indication.status]}
        />
      ),
    },
    ...(renderActions
      ? [
          {
            field: 'actions',
            headerName: '',
            flex: 1,
            minWidth: 200,
            sortable: false,
            renderCell: (params: { row: Row }) => renderActions(params.row.indication),
          } satisfies GridColDef<Row>,
        ]
      : []),
  ];

  return (
    <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.indication.id}
        getRowClassName={(params) => `status-${params.row.indication.status}`}
        autoHeight
        density="comfortable"
        hideFooter={rows.length <= 10}
        disableRowSelectionOnClick
        sx={{
          border: 'none',
          '--DataGrid-rowBorderColor': color.neutral[200],
          '& .MuiDataGrid-columnHeaders': {
            bgcolor: color.forest[100],
          },
          '& .MuiDataGrid-columnHeader': {
            '&:focus, &:focus-within': { outline: 'none' },
          },
          '& .MuiDataGrid-columnHeaderTitle': {
            fontWeight: 700,
            color: color.forest[700],
            fontSize: 13,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          },
          '& .MuiDataGrid-cell': {
            '&:focus, &:focus-within': { outline: 'none' },
          },
          '& .MuiDataGrid-row': {
            transition: 'background-color 150ms ease',
            borderLeft: '3px solid transparent',
          },
          '& .MuiDataGrid-row:hover': {
            bgcolor: color.forest[100],
          },
          '& .status-UNDER_REVIEW': { borderLeftColor: statusHex.UNDER_REVIEW },
          '& .status-ALLOCATED_FULL': { borderLeftColor: statusHex.ALLOCATED_FULL },
          '& .status-ALLOCATED_PARTIAL': { borderLeftColor: statusHex.ALLOCATED_PARTIAL },
          '& .status-DECLINED': { borderLeftColor: statusHex.DECLINED },
          '& .status-WITHDRAWN': { borderLeftColor: statusHex.WITHDRAWN },
          '& .status-SUBSCRIPTION_SENT': { borderLeftColor: statusHex.SUBSCRIPTION_SENT },
          '& .status-KYC_VERIFIED': { borderLeftColor: statusHex.KYC_VERIFIED },
          '& .status-SIGNED': { borderLeftColor: statusHex.SIGNED },
          '& .status-FUNDED': { borderLeftColor: statusHex.FUNDED },
        } as const}
      />
    </Paper>
  );
}
