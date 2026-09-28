import { useState, type ReactNode, type MouseEvent } from 'react';
import {
  AppBar,
  Avatar,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks/useTypedRedux';
import { color, font } from '../../theme/tokens';
import { setViewAs, type SessionState } from '../../app/store';

const navItems = [
  { label: 'Fund Vehicles', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
];

const viewAsOptions: SessionState['viewAs'][] = ['LP', 'GP', 'ADMIN', 'COMPLIANCE'];

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, viewAs } = useAppSelector((s) => s.session);
  const dispatch = useAppDispatch();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const openMenu = (e: MouseEvent<HTMLElement>) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" component="header">
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

          <Typography
            component={RouterLink}
            to="/"
            variant="h6"
            noWrap
            sx={{ fontFamily: font.display, color: 'primary.main', textDecoration: 'none', mr: { xs: 0, sm: 2 } }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Atlas Marketplace
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              Atlas
            </Box>
          </Typography>

          <Stack direction="row" spacing={2} sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}>
            {navItems.map((item) => (
              <Typography key={item.to} component={RouterLink} to={item.to} variant="body2" sx={navLinkSx}>
                {item.label}
              </Typography>
            ))}
          </Stack>
          <Box sx={{ flexGrow: { xs: 1, sm: 0 } }} />

          <Select
            size="small"
            value={viewAs}
            onChange={(e) => dispatch(setViewAs(e.target.value as SessionState['viewAs']))}
            renderValue={(value) => value}
            aria-label="Viewing as"
            sx={{
              bgcolor: color.forest[100],
              color: 'primary.main',
              fontWeight: 600,
              fontSize: 13,
              '& .MuiSelect-select': { py: 0.5, px: 1.25 },
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
            }}
          >
            {viewAsOptions.map((role) => (
              <MenuItem key={role} value={role} sx={{ fontSize: 13 }}>
                Viewing as {role}
              </MenuItem>
            ))}
          </Select>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 13 }}>
              {currentUser.name.charAt(0)}
            </Avatar>
            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }} noWrap>
              {currentUser.name}
            </Typography>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 2, sm: 3 } }}>
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
