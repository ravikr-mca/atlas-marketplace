import { Box, Typography } from '@mui/material';

// Phase 3 fills this in with the GP allocation dashboard / LP watchlist view.
export function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary">
        GP and LP dashboards (subscription progress, allocation tools, submitted
        indications) land in Phase 3 of the build.
      </Typography>
    </Box>
  );
}
