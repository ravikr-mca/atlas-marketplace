import { Box, Typography, useTheme } from '@mui/material';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FundVehicle } from '../../../types/entities';
import { color } from '../../../theme/tokens';

export function FundPerformanceChart({ fund }: { fund: FundVehicle }) {
  const theme = useTheme();

  if (fund.benchmarkSeries.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Net IRR vs. benchmark
      </Typography>
      {/* ResponsiveContainer makes this chart inherently responsive — width tracks its
          parent, so no separate mobile layout is needed here. */}
      <Box sx={{ width: '100%', height: { xs: 220, sm: 280 } }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={fund.benchmarkSeries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={color.neutral[200]} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: color.ink[700] }} tickLine={false} axisLine={{ stroke: color.neutral[200] }} />
            <YAxis
              tick={{ fontSize: 12, fill: color.ink[700] }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              width={40}
            />
            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{ borderRadius: 8, borderColor: color.neutral[200], fontFamily: theme.typography.fontFamily }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="fundIrr" name="Fund" stroke={color.forest[700]} strokeWidth={2.5} dot={false} />
            <Line
              type="monotone"
              dataKey="benchmarkIrr"
              name="Benchmark"
              stroke={color.ink[500]}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
