import { createTheme } from '@mui/material/styles';
import { color, font, radius, spacing } from './tokens';

export const theme = createTheme({
  palette: {
    primary: {
      main: color.forest[700],
      light: color.forest[500],
      dark: color.forest[900],
      contrastText: color.neutral[0],
    },
    secondary: {
      main: color.sky[600],
      light: color.sky[200],
      dark: color.sky[700],
      contrastText: color.neutral[0],
    },
    success: { main: color.semantic.success },
    warning: { main: color.semantic.warning },
    error: { main: color.semantic.danger },
    info: { main: color.semantic.info },
    background: {
      default: color.neutral[50],
      paper: color.neutral[0],
    },
    text: {
      primary: color.ink[900],
      secondary: color.ink[700],
    },
    divider: color.neutral[200],
  },
  shape: { borderRadius: radius.md },
  spacing,
  typography: {
    fontFamily: font.body,
    h1: { fontFamily: font.display, fontWeight: 500, letterSpacing: -0.5 },
    h2: { fontFamily: font.display, fontWeight: 500 },
    h3: { fontFamily: font.display, fontWeight: 500 },
    h4: { fontFamily: font.display, fontWeight: 500 },
    h5: { fontFamily: font.body, fontWeight: 600 },
    h6: { fontFamily: font.body, fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: radius.sm,
          transition: 'transform 150ms ease, box-shadow 150ms ease, filter 150ms ease',
          '&:active': { transform: 'scale(0.97)' },
        },
        containedPrimary: {
          backgroundImage: `linear-gradient(155deg, ${color.forest[500]} 0%, ${color.forest[700]} 65%)`,
          boxShadow: `0 2px 8px 0 ${color.forest[900]}33`,
          '&:hover': {
            backgroundImage: `linear-gradient(155deg, ${color.forest[500]} 0%, ${color.forest[900]} 65%)`,
            boxShadow: `0 4px 14px 0 ${color.forest[900]}4D`,
          },
        },
        containedSecondary: {
          backgroundImage: `linear-gradient(155deg, ${color.sky[600]} 0%, ${color.sky[700]} 65%)`,
          boxShadow: `0 2px 8px 0 ${color.sky[700]}33`,
          '&:hover': {
            backgroundImage: `linear-gradient(155deg, ${color.sky[600]} 0%, #022873 65%)`,
            boxShadow: `0 4px 14px 0 ${color.sky[700]}4D`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow 200ms ease, border-color 200ms ease',
          // :has() lifts the CardActionArea child's hover into the parent Card's own
          // shadow/border, so a card "lifts" as one piece instead of just its ripple layer.
          '&:has(.MuiCardActionArea-root:hover)': {
            transform: 'translateY(-3px)',
            boxShadow: `0 12px 24px -8px ${color.ink[900]}26`,
            borderColor: color.forest[500],
          },
        },
      },
    },
    MuiCardActionArea: {
      styleOverrides: {
        root: {
          transition: 'transform 200ms ease',
          '& .MuiTouchRipple-root': { color: color.forest[100] },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radius.sm },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { transition: 'opacity 300ms ease' },
        bar: { transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1)' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: color.neutral[0],
          color: color.ink[900],
          boxShadow: 'none',
          borderBottom: `1px solid ${color.neutral[200]}`,
          transition: 'box-shadow 200ms ease, border-color 200ms ease',
        },
      },
    },
  },
});
