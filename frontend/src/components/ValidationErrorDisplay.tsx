import React from 'react';
import { Alert, Box, Typography, List, ListItem, ListItemIcon, ListItemText, alpha } from '@mui/material';
import { ErrorOutline, ArrowRight } from '@mui/icons-material';

interface ValidationErrorDisplayProps {
  error: any;
  onClose?: () => void;
}

/**
 * Component to display validation errors from the backend
 * Handles different error formats including:
 * - Simple error messages
 * - Field-specific errors
 * - Lists of validation errors 
 */
const ValidationErrorDisplay: React.FC<ValidationErrorDisplayProps> = ({ error, onClose }) => {
  // If no error, don't render anything
  if (!error) return null;
  
  // Extract error details
  const message = error.message || 'An error occurred';
  const field = error.field || null;
  const validationErrors = error.validationErrors || [];
  
  return (
    <Alert 
      severity="error" 
      onClose={onClose}
      sx={{
        mb: 3,
        borderRadius: 1.5,
        '& .MuiAlert-icon': {
          alignItems: 'flex-start',
          pt: 1.5,
        }
      }}
    >
      <Box>
        <Typography variant="subtitle1" fontWeight={500} sx={{ mb: 0.5 }}>
          {message}
        </Typography>
        
        {field && (
          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
            Field: <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 500 }}>{field}</Box>
          </Typography>
        )}
        
        {validationErrors && validationErrors.length > 0 && (
          <>
            {validationErrors.length === 1 ? (
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {validationErrors[0]}
              </Typography>
            ) : (
              <List dense disablePadding sx={{ mt: 1 }}>
                {validationErrors.map((error: string, index: number) => (
                  <ListItem key={index} disablePadding sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <ArrowRight fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={error} 
                      primaryTypographyProps={{ variant: 'body2' }} 
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </Box>
    </Alert>
  );
};

export default ValidationErrorDisplay;