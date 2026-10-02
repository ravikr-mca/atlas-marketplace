import { useState, type ReactNode, type MouseEvent } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Chip,
  Divider,
  Stack,
  Toolbar,
  Typography,
  useScrollTrigger,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSession } from '../../auth/useSession';
import { useAuthActions, DEMO_MODE } from '../../auth/useAuthActions';
import { ROLE_LABEL } from '../../auth/permissions';
import { resetDb } from '../../mock/db';
import { color, font } from '../../theme/tokens';
import { AtlasLogo } from '../AtlasLogo';
import { ChartPatternBackground } from '../ChartPatternBackground';

const NAV = [
  { label: 'Fund Vehicles', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Approvals', to: '/admin/approvals', permission: 'org:verify' as const },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, organization, can } = useSession();
  const navItems = NAV.filter((n) => !n.permission || can(n.permission));
  const { endSession } = useAuthActions();
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const location = useLocation();

  const openMenu = (e: MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  // Native MUI helper for "elevate on scroll" — no new dependency needed for a detail
  // this small.
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 4 });

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <ChartPatternBackground />
      <AppBar
        position="sticky"
        component="header"
        sx={{
          boxShadow: scrolled ? `0 4px 16px -6px ${color.ink[900]}1F` : 'none',
          borderBottomColor: scrolled ? 'transparent' : color.neutral[200],
          backdropFilter: 'blur(10px)',
          backgroundColor: `${color.neutral[0]}E6`, // semi-transparent so the fixed chart
          // background shows faintly through the bar, instead of the nav feeling like a
          // separate opaque plate glued on top of the page
        }}
      >
        <Toolbar sx={{ gap: { xs: 1, sm: 3 } }}>
          {/* Mobile: hamburger opens the same nav items as a menu — only 2 links, so a
              full drawer would be over-engineering; a Menu is the honest minimum. */}
          <IconButton
            aria-label="Open navigation"
            onClick={openMenu}
            sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
            {navItems.map((item) => (
              <MenuItem key={item.to} component={RouterLink} to={item.to} onClick={closeMenu}>
                {item.label}
              </MenuItem>
            ))}
          </Menu>

          <Stack
            component={RouterLink}
            to="/"
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ textDecoration: 'none', mr: { xs: 0, sm: 2 }, transition: 'opacity 150ms ease', '&:hover': { opacity: 0.8 } }}
          >
            <AtlasLogo size={26} />
            <Typography
              variant="h6"
              noWrap
              sx={{ fontFamily: font.display, color: 'primary.main' }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Atlas Marketplace
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Atlas
              </Box>
            </Typography>
          </Stack>

          <Stack
            direction="row"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' }, position: 'relative', height: '100%' }}
          >
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Box key={item.to} sx={{ position: 'relative', px: 2, display: 'flex', alignItems: 'center' }}>
                  {active && (
                    <motion.div
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      style={{
                        position: 'absolute',
                        inset: '8px 0px',
                        borderRadius: 999,
                        backgroundColor: color.forest[100],
                        zIndex: 0,
                      }}
                    />
                  )}
                  <Typography
                    component={RouterLink}
                    to={item.to}
                    variant="body2"
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      color: active ? 'primary.main' : 'text.secondary',
                      textDecoration: 'none',
                      fontWeight: 600,
                      py: 1,
                      transition: 'color 150ms ease',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {item.label}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
          <Box sx={{ flexGrow: { xs: 1, sm: 0 } }} />

          <Button
            onClick={(e) => setUserAnchor(e.currentTarget)}
            aria-label={`Account menu for ${user?.name ?? ''}`}
            aria-haspopup="menu"
            color="inherit"
            sx={{ textTransform: 'none', gap: 1, px: 1, minWidth: 0 }}
          >
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 13 }}>{user?.name.charAt(0)}</Avatar>
            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }} noWrap>{user?.name}</Typography>
          </Button>
          <Menu anchorEl={userAnchor} open={!!userAnchor} onClose={() => setUserAnchor(null)} slotProps={{ paper: { sx: { minWidth: 260 } } }}>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography fontWeight={600}>{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{user && ROLE_LABEL[user.role]} · {organization?.name}</Typography>
              {organization && user?.role !== 'ADMIN' && user?.role !== 'COMPLIANCE' && (
                <Chip size="small" sx={{ mt: 1 }} color={organization.accreditation === 'VERIFIED' ? 'success' : 'warning'}
                  label={organization.accreditation === 'VERIFIED' ? 'Accredited' : organization.accreditation === 'PENDING' ? 'Accreditation pending' : 'Not yet accredited'} />
              )}
            </Box>
            <Divider />
            <MenuItem component={RouterLink} to={`/orgs/${organization?.id}`} onClick={() => setUserAnchor(null)}>My organization</MenuItem>
            {DEMO_MODE && (
              <MenuItem onClick={async () => { setUserAnchor(null); await endSession(); }}>Switch persona</MenuItem>
            )}
            {DEMO_MODE && (
              <MenuItem onClick={() => { resetDb(); window.location.assign('/login'); }}>Reset demo data</MenuItem>
            )}
            <MenuItem onClick={async () => { setUserAnchor(null); await endSession(); }}>Sign out</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 }, position: 'relative', zIndex: 1 }}>
        {children}
      </Container>
    </Box>
  );
}
