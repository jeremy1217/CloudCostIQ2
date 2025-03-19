import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const Resources: React.FC = () => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Cloud Resources
      </Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Coming Soon
        </Typography>
        <Typography variant="body1">
          The Cloud Resources page will allow you to view and manage all your cloud resources across providers.
          Features will include inventory management, utilization metrics, and resource optimization.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Resources; 