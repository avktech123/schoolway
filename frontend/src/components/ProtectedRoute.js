import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CircularProgress, Box } from '@mui/material';
import DashboardLayout from '../layouts/DashboardLayout';

const ProtectedRoute = ({ children }) => {
  const { state } = useAppContext();

  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return state.user ? (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  ) : (
    <Navigate to="/login" />
  );
};

export const PublicRoute = ({ children }) => {
  const { state } = useAppContext();

  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return state.user ? <Navigate to="/dashboard" /> : children;
};

export default ProtectedRoute;