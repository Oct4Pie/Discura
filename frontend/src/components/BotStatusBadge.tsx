import {
    Error as ErrorIcon,
    Cancel as OfflineIcon,
    CheckCircle as OnlineIcon
} from '@mui/icons-material';
import { Chip, ChipProps } from '@mui/material';
import { BotStatus } from '../types';
import { BOT_STATUS } from 'common';

interface BotStatusBadgeProps {
  status: BotStatus;
}

// Define typed color values for MUI Chip component
type ChipColor = ChipProps['color'];

const BotStatusBadge = ({ status }: BotStatusBadgeProps) => {
  // Get color and icon based on status
  const getStatusConfig = () => {
    switch (status) {
      case BotStatus.ONLINE:
        return { 
          color: BOT_STATUS.COLORS.online as ChipColor, 
          label: BOT_STATUS.LABELS.online,
          icon: <OnlineIcon fontSize="small" />
        };
      case BotStatus.OFFLINE:
        return { 
          color: BOT_STATUS.COLORS.offline as ChipColor, 
          label: BOT_STATUS.LABELS.offline,
          icon: <OfflineIcon fontSize="small" />
        };
      case BotStatus.ERROR:
        return { 
          color: BOT_STATUS.COLORS.error as ChipColor, 
          label: BOT_STATUS.LABELS.error,
          icon: <ErrorIcon fontSize="small" />
        };
      default:
        return { 
          color: BOT_STATUS.COLORS.offline as ChipColor, 
          label: 'Unknown',
          icon: <OfflineIcon fontSize="small" />
        };
    }
  };

  const { color, label, icon } = getStatusConfig();

  return (
    <Chip
      size="small"
      icon={icon}
      label={label}
      color={color}
    />
  );
};

export default BotStatusBadge;
