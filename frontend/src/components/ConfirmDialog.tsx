import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  content?: string; // Added for backward compatibility
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog = ({
  open,
  title,
  message,
  content, // Support both message and content props
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmDialogProps) => {
  // Use message if provided, otherwise use content
  const displayMessage = message || content;
  
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      PaperProps={{
        sx: {
          borderRadius: 2, // Custom border radius for dialog
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {displayMessage}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button 
          onClick={onCancel} 
          color="primary" 
          autoFocus
          sx={{ 
            borderRadius: 1 // Custom border radius for button
          }}
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          color="error"
          sx={{ 
            borderRadius: 1 // Custom border radius for button
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
