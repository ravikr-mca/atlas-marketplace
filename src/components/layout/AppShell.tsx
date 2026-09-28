import type { ReactNode } from 'react';
import { AppBar, Avatar, Box, Chip, Container, Stack, Toolbar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector } from '../../hooks/useTypedRedux';
import { color, font } from '../../theme/tokens';

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, viewAs } = useAppSelector((s) => s.session);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" component="header">
        <Toolbar sx={{ gap: 3 }}>
          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            sx={{ fontFamily: font.display, color: 'primary.main', textDecoration: 'none', mr: 2 }}
          >
            Atlas Marketplace
          </Typography>
          <Stack direction="row" spacing={2} sx={{ flexGrow: 1 }}>
            <Typography component={RouterLink} to="/" variant="body2" sx={navLinkSx}>
              Fund Vehicles
            </Typography>
            <Typography component={RouterLink} to="/dashboard" variant="body2" sx={navLinkSx}>
              Dashboard
            </Typography>
          </Stack>
          <Chip size="small" label={`Viewing as ${viewAs}`} sx={{ bgcolor: color.forest[100], color: 'primary.main' }} />
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 13 }}>
              {currentUser.name.charAt(0)}
            </Avatar>
            <Typography variant="body2">{currentUser.name}</Typography>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {children}
      </Container>
    </Box>
  );
}

const navLinkSx = {
  color: 'text.secondary',
  textDecoration: 'none',
  fontWeight: 600,
  '&:hover': { color: 'primary.main' },
};
