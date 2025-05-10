import { Badge, SxProps, Theme } from '@mui/material';
import { BotStatus } from '../api';

interface BotStatusBadgeProps {
  status: BotStatus;
  sx?: SxProps<Theme>;
}

// Map BotStatus enum to badge color
const statusColorMap: Record<BotStatus, 'success' | 'warning' | 'error' | 'default'> = {
  [BotStatus.ONLINE]: 'success',
  [BotStatus.OFFLINE]: 'default',
  // [BotStatus.STARTING]: 'warning', // STARTING is not in the generated enum yet
  // [BotStatus.STOPPING]: 'warning', // STOPPING is not in the generated enum yet
  [BotStatus.ERROR]: 'error',
};

// Map BotStatus enum to display text
const statusTextMap: Record<BotStatus, string> = {
  [BotStatus.ONLINE]: 'Online',
  [BotStatus.OFFLINE]: 'Offline',
  // [BotStatus.STARTING]: 'Starting',
  // [BotStatus.STOPPING]: 'Stopping',
  [BotStatus.ERROR]: 'Error',
};

const BotStatusBadge = ({ status, sx }: BotStatusBadgeProps) => {
  const color = statusColorMap[status] || 'default';
  const text = statusTextMap[status] || 'Unknown';

  return (
    <Badge
      color={color}
      badgeContent={text}
      sx={{
        '& .MuiBadge-badge': {
          textTransform: 'capitalize',
          fontWeight: 'medium',
          padding: '0 8px',
          height: '20px',
          minWidth: '20px',
          borderRadius: '10px',
        },
        ...sx,
      }}
    />
  );
};

export default BotStatusBadge;
