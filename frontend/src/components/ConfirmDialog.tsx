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
    >
      <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          {displayMessage}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary" autoFocus>
          {cancelText}
        </Button>
        <Button onClick={onConfirm} color="error">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
