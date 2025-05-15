import { Chip, SxProps, Theme, alpha, useTheme } from "@mui/material";
import { BotStatus } from "@discura/common/types"; // Import from common package instead of API
import {
  CheckCircleOutline as OnlineIcon,
  ErrorOutline as ErrorIcon,
  CancelOutlined as OfflineIcon,
  SyncOutlined as SyncIcon,
} from "@mui/icons-material";
import { useState, useEffect, ReactElement } from "react";

interface BotStatusBadgeProps {
  status?: BotStatus | string; // Accept string as well for compatibility
  sx?: SxProps<Theme>;
}

// Define a consistent shape for the config object
interface StatusConfig {
  color: string;
  label: string;
  icon: ReactElement;
  pulseAnimation?: boolean;
}

// Map BotStatus enum to badge color and icon
const statusConfig: Record<string, StatusConfig> = {
  "ONLINE": {
    color: "success",
    label: "Online",
    icon: <OnlineIcon fontSize="small" />,
  },
  "OFFLINE": {
    color: "default",
    label: "Offline",
    icon: <OfflineIcon fontSize="small" />,
  },
  "STARTING": {
    color: "warning",
    label: "Starting",
    icon: <SyncIcon fontSize="small" />,
    pulseAnimation: true,
  },
  "STOPPING": {
    color: "warning",
    label: "Stopping",
    icon: <SyncIcon fontSize="small" />,
    pulseAnimation: true,
  },
  "ERROR": {
    color: "error",
    label: "Error",
    icon: <ErrorIcon fontSize="small" />,
  },
};

const BotStatusBadge = ({ status, sx }: BotStatusBadgeProps) => {
  const theme = useTheme();
  const [animate, setAnimate] = useState(false);
  
  // Convert status to string for reliable comparison
  const statusString = String(status || "").toUpperCase();
  
  // Check if the status string is in our config
  const validStatus = Object.keys(statusConfig).includes(statusString);

  // Create a config object with either the matched status or default values
  // Using type assertion for the entire expression to ensure TypeScript knows it's always StatusConfig
  const config = (validStatus
    ? statusConfig[statusString]
    : {
        color: "default",
        label: "Unknown",
        icon: <OfflineIcon fontSize="small" />,
      }) as StatusConfig;

  // Set up animation for statuses that need it
  useEffect(() => {
    if (config.pulseAnimation) {
      const interval = setInterval(() => {
        setAnimate((prev) => !prev);
      }, 800);

      return () => clearInterval(interval);
    }
  }, [status, config.pulseAnimation]);

  // Map color string to theme color
  const getColorFromStatus = (colorName: string): string => {
    switch (colorName) {
      case "success":
        return theme.palette.success.main;
      case "error":
        return theme.palette.error.main;
      case "warning":
        return theme.palette.warning.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const color = getColorFromStatus(config.color);

  return (
    <Chip
      size="small"
      label={config.label}
      icon={config.icon}
      sx={{
        backgroundColor: alpha(color, 0.1),
        color: color,
        fontWeight: 500,
        borderRadius: 1,
        height: 24,
        "& .MuiChip-icon": {
          color: "inherit",
          marginLeft: 1,
          marginRight: -0.5,
          fontSize: "1rem",
          animation: config.pulseAnimation
            ? `${animate ? "pulse 1.5s infinite" : ""}`
            : "none",
        },
        "& .MuiChip-label": {
          paddingLeft: 0.5,
          paddingRight: 1,
        },
        "& .MuiSvgIcon-root": {
          fontSize: "0.9rem",
        },
        "@keyframes pulse": {
          "0%": {
            opacity: 1,
          },
          "50%": {
            opacity: 0.6,
          },
          "100%": {
            opacity: 1,
          },
        },
        ...sx,
      }}
    />
  );
};

export default BotStatusBadge;
