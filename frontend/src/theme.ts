import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Create base theme
let theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7289DA', // Discord blue-purple color
      light: '#8EA1E1',
      dark: '#5B6EAE',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#43B581', // Discord green
      light: '#70C29C',
      dark: '#2D7D59',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F8F9FB', // Slightly lighter/cooler background
      paper: '#FFFFFF',
    },
    error: {
      main: '#F04747', // Discord red
    },
    warning: {
      main: '#FAA61A', // Discord orange/yellow
    },
    info: {
      main: '#5865F2', // Discord blurple (brighter)
    },
    text: {
      primary: '#2E3338',
      secondary: '#72767D',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
          margin: 0,
          padding: 0,
        },
        html: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
        },
        body: {
          margin: 0,
          padding: 0,
          width: '100%',
          height: '100%',
        },
        '#root': {
          width: '100%',
          height: '100%',
        },
        input: {
          '&[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
          },
        },
        img: {
          maxWidth: '100%',
          display: 'block',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#FFFFFF', 0.95),
          transition: 'box-shadow 0.2s ease-in-out, background-color 0.2s ease-in-out',
        },
      },
      defaultProps: {
        color: 'default',
        elevation: 0,
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          padding: '10px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          textTransform: 'none',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
            transform: 'translateY(-1px)',
          },
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        },
        sizeMedium: {
          borderRadius: 8,
        },
        sizeLarge: {
          borderRadius: 10,
          padding: '12px 24px',
        },
        sizeSmall: {
          borderRadius: 6,
          padding: '6px 16px',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#5B6EAE',
          },
        },
        containedSecondary: {
          '&:hover': {
            backgroundColor: '#2D7D59',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.05)',
          borderRadius: 20,
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          overflow: 'hidden',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 24,
          '&:last-child': {
            paddingBottom: '24px !important',
          },
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '20px 24px',
        },
      },
    },
    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'box-shadow 0.2s ease-in-out',
            '&.Mui-focused': {
              boxShadow: '0 0 0 3px rgba(114, 137, 218, 0.15)',
            },
            '& fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.1)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        input: {
          '&::placeholder': {
            opacity: 0.7,
            color: '#72767D',
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '4px 0',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: alpha('#7289DA', 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#7289DA', 0.12),
            '&:hover': {
              backgroundColor: alpha('#7289DA', 0.18),
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        },
        elevation2: {
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.05), 0 3px 6px rgba(0, 0, 0, 0.08)',
        },
        elevation8: {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          transition: 'padding 0.2s ease-in-out',
          paddingLeft: 16,
          paddingRight: 16,
          [createTheme().breakpoints.up('sm')]: {
            paddingLeft: 24,
            paddingRight: 24,
          },
          [createTheme().breakpoints.up('md')]: {
            paddingLeft: 32,
            paddingRight: 32,
          },
          [createTheme().breakpoints.up('lg')]: {
            paddingLeft: 40,
            paddingRight: 40,
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          transition: 'margin 0.2s ease-in-out, width 0.2s ease-in-out',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'transform 0.15s ease-in-out, background 0.15s ease-in-out',
          '&:hover': {
            transform: 'scale(1.05)',
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 46,
          height: 26,
          padding: 0,
          margin: 8,
        },
        switchBase: {
          padding: 1,
          '&.Mui-checked': {
            transform: 'translateX(20px)',
            color: '#fff',
            '& + .MuiSwitch-track': {
              opacity: 1,
              backgroundColor: '#43B581',
              borderColor: '#43B581',
            },
          },
        },
        thumb: {
          width: 24,
          height: 24,
        },
        track: {
          borderRadius: 13,
          border: '1px solid #E0E0E0',
          backgroundColor: '#E0E0E0',
          opacity: 1,
          transition: 'background-color 0.2s, border-color 0.2s',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          overflow: 'hidden',
        },
      },
    },
  },
});

// Apply responsive font sizes with custom options
theme = responsiveFontSizes(theme, {
  breakpoints: ['sm', 'md', 'lg', 'xl'],
  factor: 2,
  variants: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2'],
});

export default theme;
