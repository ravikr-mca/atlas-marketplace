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
      main: color.neutral.charcoal,
      contrastText: color.neutral.onCharcoal,
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
        root: { borderRadius: radius.sm },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: radius.sm },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: color.neutral[0],
          color: color.ink[900],
          boxShadow: 'none',
          borderBottom: `1px solid ${color.neutral[200]}`,
        },
      },
    },
  },
});
