import React, { useCallback } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import logo from '../assets/logo.svg';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useAppContext();

  const navigateToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const handleTabChange = (event, newValue) => {
    navigate(newValue);
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        borderRadius: 0
      }}
    >
      <Toolbar sx={{ minHeight: 70 }}>
        <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} mr={4} onClick={navigateToDashboard}>
          <Box
            component="img"
            src={logo}
            alt="Schoolway Logo"
            sx={{ width: 40, height: 40, mr: 2 }}
          />
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{
              background: 'linear-gradient(45deg, #FFF 30%, #F0F0F0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Schoolway
          </Typography>
        </Box>

        <Tabs
          value={location.pathname}
          onChange={handleTabChange}
          sx={{
            flexGrow: 1,
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.8)',
              fontWeight: 500,
              minHeight: 70,
              '&.Mui-selected': {
                color: 'white',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'white',
              height: 3
            }
          }}
        >
          <Tab label="Dashboard" value="/dashboard" />
          <Tab label="Profile" value="/profile" />
        </Tabs>

        <Button
          color="inherit"
          onClick={handleLogout}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 255, 255, 0.5)',
            color: 'white',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;