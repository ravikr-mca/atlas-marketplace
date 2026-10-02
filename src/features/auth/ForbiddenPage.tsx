import { Box, Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export function ForbiddenPage({ reason }: { reason?: string }) {
  return (
    <Stack alignItems="flex-start" spacing={2} sx={{ py: { xs: 4, sm: 8 }, maxWidth: 560 }}>
      <Typography variant="overline" color="text.secondary">Error 403</Typography>
      <Typography variant="h4" component="h1">You don’t have access to this page</Typography>
      <Typography color="text.secondary">
        {reason ?? 'Your role doesn’t include this.'} Access on Atlas is decided by your role, your organization’s accreditation, and whether the record belongs to your organization.
      </Typography>
      <Box>
        <Button component={RouterLink} to="/" variant="contained">Back to fund vehicles</Button>
      </Box>
    </Stack>
  );
}

export function NotFoundPage() {
  return (
    <Stack alignItems="flex-start" spacing={2} sx={{ py: { xs: 4, sm: 8 }, maxWidth: 560 }}>
      <Typography variant="overline" color="text.secondary">Error 404</Typography>
      <Typography variant="h4" component="h1">We couldn’t find that page</Typography>
      <Typography color="text.secondary">It may have moved, or it may belong to another organization.</Typography>
      <Box>
        <Button component={RouterLink} to="/" variant="contained">Back to fund vehicles</Button>
      </Box>
    </Stack>
  );
}
