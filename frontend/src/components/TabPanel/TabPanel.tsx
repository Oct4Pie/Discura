import { Box } from "@mui/material";
import { TabPanelProps } from "../../types";

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`bot-tabpanel-${index}`}
      aria-labelledby={`bot-tab-${index}`}
      sx={{ py: 3 }}
      {...other}
    >
      {value === index && children}
    </Box>
  );
};

export default TabPanel;
