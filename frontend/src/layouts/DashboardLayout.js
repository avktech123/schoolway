import React from 'react';
import { Box } from '@mui/material';
import Navbar from '../components/Navbar';

const DashboardLayout = ({ children }) => {
  return (
    <Box>
      <Navbar />
      <Box p={3}>
        {children}
      </Box>
    </Box>
  );
};

export default DashboardLayout;