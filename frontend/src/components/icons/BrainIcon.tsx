// Create a new file at: src/components/icons/BrainIcon.tsx

import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

const BrainIcon: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props}>
      <path d="M13,3C9.23,3 6.19,5.95 6,9.66L4.08,12.19C3.84,12.5 4.08,13 4.5,13H6V16A2,2 0 0,0 8,18H9V21H16V16.31C18.37,15.19 20,12.8 20,10C20,6.14 16.88,3 13,3M14,14H11A1,1 0 0,1 10,13A1,1 0 0,1 11,12H14A1,1 0 0,1 15,13A1,1 0 0,1 14,14Z" />
    </SvgIcon>
  );
};

export default BrainIcon;