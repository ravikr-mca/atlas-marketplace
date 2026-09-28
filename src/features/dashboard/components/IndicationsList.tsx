import type { ReactNode } from 'react';
import { Box, Card, CardContent, Chip, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import type { FundVehicle, IndicationOfInterest, Organization } from '../../../types/entities';
import { formatUsd, indicationStatusLabel } from '../../../lib/format';

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

interface Row {
  indication: IndicationOfInterest;
  fundName: string;
  orgName: string;
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

  const rows: Row[] = indications.map((indication) => ({
    indication,
    fundName: fundName(indication.fundVehicleId),
    orgName: orgName((resolveOrgId ?? ((i) => i.lpOrganizationId))(indication)),
  }));

  if (indications.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nothing here yet.
      </Typography>
    );
  }

  if (isMobile) {
    return (
      <Stack spacing={1.5}>
        {rows.map(({ indication, fundName: fn, orgName: on }) => (
          <Card key={indication.id} variant="outlined">
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" rowGap={1}>
                <Box>
                  <Typography variant="subtitle2">{fn}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {orgColumnLabel}: {on}
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
                      {formatUsd(indication.allocatedAmountUsd)}
                    </Typography>
                  </Box>
                )}
              </Stack>
              {renderActions && <Box sx={{ mt: 1.5 }}>{renderActions(indication)}</Box>}
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  const columns: GridColDef<Row>[] = [
    { field: 'fundName', headerName: 'Fund', flex: 1.2, minWidth: 160 },
    { field: 'orgName', headerName: orgColumnLabel, flex: 1, minWidth: 160 },
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
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.indication.id}
        autoHeight
        density="comfortable"
        hideFooter={rows.length <= 10}
        disableRowSelectionOnClick
      />
    </Box>
  );
}
