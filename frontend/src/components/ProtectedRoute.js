import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children }) => {
  const { state } = useAppContext();
  console.log('ProtectedRoute state:', state);
  
  if (state.loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return state.user ? children : <Navigate to="/login" />;
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