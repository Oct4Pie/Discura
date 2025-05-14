import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, Box, Button, Typography, Paper, alpha } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component to catch and display React component errors
 * Prevents the whole application from crashing due to errors in a component
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 2,
            border: (theme) => `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
            bgcolor: (theme) => alpha(theme.palette.error.main, 0.05),
            my: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <ErrorOutline color="error" sx={{ mr: 1, mt: 0.5 }} />
            <Typography variant="h6" color="error" fontWeight={500}>
              Something went wrong
            </Typography>
          </Box>

          <Alert severity="error" sx={{ mb: 2 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Alert>

          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Component Stack:
              </Typography>
              <Box
                component="pre"
                sx={{
                  p: 2,
                  borderRadius: 1,
                  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
                  border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}
              >
                {this.state.errorInfo.componentStack}
              </Box>
            </Box>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={this.handleReset}
            sx={{ mt: 2 }}
          >
            Try Again
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;