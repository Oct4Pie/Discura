import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Tooltip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FormatQuote as QuoteIcon,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useKnowledgeStore } from '../stores/knowledgeStore';
import { KnowledgeItemDto } from '../api';
import ConfirmDialog from './ConfirmDialog';

interface KnowledgeTabProps {
  botId: string | undefined;
}

const KnowledgeTab: React.FC<KnowledgeTabProps> = ({ botId }) => {
  const theme = useTheme();
  const { 
    knowledgeItems, 
    isLoading, 
    error, 
    fetchKnowledgeItems, 
    addKnowledgeItem, 
    updateKnowledgeItem, 
    deleteKnowledgeItem 
  } = useKnowledgeStore();

  // Local state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formType, setFormType] = useState<string>('text');
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [previewContent, setPreviewContent] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch knowledge items on component mount
  useEffect(() => {
    if (botId) {
      fetchKnowledgeItems(botId).catch(console.error);
    }
  }, [botId, fetchKnowledgeItems]);

  // Reset form state when dialog is opened
  const handleAddKnowledgeClick = () => {
    setFormMode('add');
    setFormTitle('');
    setFormContent('');
    setFormType('text');
    setDialogOpen(true);
  };

  // Set form data for editing
  const handleEditKnowledge = (item: KnowledgeItemDto) => {
    setFormMode('edit');
    setSelectedItemId(String(item.id));
    setFormTitle(item.title);
    setFormContent(item.content);
    setFormType(item.type);
    setDialogOpen(true);
  };

  // Confirm deletion
  const handleDeleteKnowledge = (id: string | number) => {
    setSelectedItemId(String(id));
    setConfirmDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Early return if botId is undefined
    if (!botId) {
      console.error('Cannot save knowledge item: Bot ID is undefined');
      return;
    }
    
    try {
      if (formMode === 'add') {
        await addKnowledgeItem(botId, {
          title: formTitle,
          content: formContent,
          type: formType,
        });
      } else if (formMode === 'edit' && selectedItemId) {
        await updateKnowledgeItem(botId, selectedItemId, {
          title: formTitle,
          content: formContent,
          type: formType,
        });
      }
      setDialogOpen(false);
    } catch (error) {
      console.error('Failed to save knowledge item:', error);
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirmed = async () => {
    // Early return if botId is undefined or selectedItemId is null
    if (!botId || !selectedItemId) {
      console.error('Cannot delete knowledge item: Bot ID or Item ID is missing');
      return;
    }
    
    try {
      await deleteKnowledgeItem(botId, selectedItemId);
      setConfirmDialogOpen(false);
      setSelectedItemId(null);
    } catch (error) {
      console.error('Failed to delete knowledge item:', error);
    }
  };

  // Preview knowledge content
  const handlePreviewContent = (content: string) => {
    setPreviewContent(content);
    setPreviewOpen(true);
  };

  // Render item type icon with tooltip
  const renderItemTypeIcon = (type: string) => {
    return type === 'text' ? (
      <Tooltip title="Text Content">
        <QuoteIcon fontSize="small" />
      </Tooltip>
    ) : (
      <Tooltip title="File/URL Reference">
        <LinkIcon fontSize="small" />
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}
      >
        <Typography variant="h6" fontWeight={500}>
          Knowledge Base Items
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddKnowledgeClick}
          sx={{
            borderRadius: 1,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
        >
          Add Knowledge
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
          }}
        >
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : knowledgeItems.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.divider, 0.4)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            No knowledge items found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add knowledge to help your bot better understand specific topics
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddKnowledgeClick}
            sx={{ borderRadius: 1 }}
          >
            Add First Knowledge Item
          </Button>
        </Paper>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={0}
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Content Preview</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {knowledgeItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {renderItemTypeIcon(item.type)}
                    <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                      {item.type === 'text' ? 'Text' : 'File/URL'}
                    </Typography>
                  </TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>
                    <Tooltip title="Click to view full content">
                      <Button
                        variant="text"
                        onClick={() => handlePreviewContent(item.content)}
                        sx={{ textAlign: 'left', justifyContent: 'flex-start' }}
                      >
                        {item.content.length > 50
                          ? `${item.content.substring(0, 50)}...`
                          : item.content}
                      </Button>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleEditKnowledge(item)}
                      size="small"
                      sx={{ 
                        color: theme.palette.primary.main,
                        mr: 1,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteKnowledge(item.id)}
                      size="small"
                      sx={{ 
                        color: theme.palette.error.main,
                        '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>
          {formMode === 'add' ? 'Add Knowledge Item' : 'Edit Knowledge Item'}
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          <Box component="form" noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />

            <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={formType}
                label="Type"
                onChange={(e) => setFormType(e.target.value)}
                sx={{
                  borderRadius: 1.5,
                }}
              >
                <MenuItem value="text">Text</MenuItem>
                <MenuItem value="file">File/URL Reference</MenuItem>
              </Select>
            </FormControl>

            <TextField
              margin="normal"
              required
              fullWidth
              multiline
              rows={8}
              label={formType === 'text' ? "Content" : "File Path or URL"}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder={
                formType === 'text'
                  ? "Enter knowledge content here..."
                  : "Enter file path or URL..."
              }
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                },
              }}
            />

            {formType === 'text' && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
                Provide detailed information that will help your bot respond to related questions.
              </Alert>
            )}

            {formType === 'file' && (
              <Alert severity="info" sx={{ mb: 2, borderRadius: 1 }}>
                Enter a URL to a document or file that contains relevant information.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDialogOpen(false)}
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            disabled={!formTitle || !formContent}
            sx={{
              borderRadius: 1,
              px: 3,
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDialogOpen}
        title="Delete Knowledge Item"
        message="Are you sure you want to delete this knowledge item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmDialogOpen(false)}
      />

      {/* Content Preview Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle>Content Preview</DialogTitle>
        <DialogContent>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 1.5,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              whiteSpace: 'pre-wrap',
            }}
          >
            {previewContent}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default KnowledgeTab;