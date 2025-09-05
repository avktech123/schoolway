import React from 'react';
import { Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  return (
    <>
      <Typography variant="h3" gutterBottom>
        Dashboard
      </Typography>
      <Button component={Link} to="/profile" variant="outlined">
        Go to Profile
      </Button>
    </>
  );
};

export default Dashboard;