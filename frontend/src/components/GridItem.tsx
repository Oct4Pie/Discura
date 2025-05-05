/**
 * GridItem Component
 * 
 * This is a wrapper around Material UI's Grid component that adds the required
 * "component" prop automatically, making it compatible with Material UI's typing.
 */
import React from 'react';
import { Grid, GridProps } from '@mui/material';

// Define the props type with all necessary properties including Material UI Grid props
type GridItemProps = GridProps & {
  item?: boolean;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
};

// This component wraps the Grid component with proper typing
const GridItem: React.FC<GridItemProps> = (props) => {
  // We use component="div" and spread all other props including the item prop
  return <Grid component="div" {...props} />;
};

export default GridItem;