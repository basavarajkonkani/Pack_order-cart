import { createTheme } from '@mui/material/styles';

/**
 * Admin Portal theme. Kept distinct from the Buyer App's palette
 * (constants/colors.ts) since this is a separate product surface, but uses
 * the same primary brand hue for visual consistency.
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#166534',
      light: '#16a34a',
      dark: '#14532d',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#0f172a',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    error: { main: '#dc2626' },
    warning: { main: '#d97706' },
    success: { main: '#16a34a' },
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});
