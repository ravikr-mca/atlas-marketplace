import { useState } from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useDataRoomDocuments } from '../queries';
import type { DataRoomDocument } from '../../../types/entities';

function formatBytes(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export function DataRoomList({ fundVehicleId }: { fundVehicleId: string }) {
  const { data: documents } = useDataRoomDocuments(fundVehicleId);
  const [previewing, setPreviewing] = useState<DataRoomDocument | null>(null);

  if (!documents || documents.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Data room
      </Typography>
      <List disablePadding sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
        {documents.map((doc) => (
          <ListItemButton key={doc.id} onClick={() => setPreviewing(doc)} divider>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <DescriptionOutlinedIcon color="action" />
            </ListItemIcon>
            <ListItemText
              primary={doc.title}
              secondary={`${doc.kind.replace(/_/g, ' ')} · ${formatBytes(doc.sizeBytes)}`}
            />
          </ListItemButton>
        ))}
      </List>

      <Dialog open={!!previewing} onClose={() => setPreviewing(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {previewing?.title}
          </Box>
          <IconButton size="small" onClick={() => setPreviewing(null)} aria-label="Close preview">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {/* Documents are mock placeholders in this prototype (no real PDF binary
              behind fileUrl). In production this renders the signed, time-limited S3
              URL in an in-browser PDF viewer — the honest stand-in for that here. */}
          <Typography variant="body2" color="text.secondary">
            Preview not available in this demo — in production this opens{' '}
            <strong>{previewing?.title}</strong> from its signed S3 URL in an in-browser
            PDF viewer, scoped to accredited, verified LPs only.
          </Typography>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
