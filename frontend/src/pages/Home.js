import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.svg';

const Home = () => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      textAlign="center"
      p={3}
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Box
        component="img"
        src={logo}
        alt="Schoolway Logo"
        mb={3}
        sx={{
          width: { xs: 80, md: 120 },
          height: { xs: 80, md: 120 }
        }}
      />

      <Typography
        variant="h1"
        color="white"
        fontWeight="bold"
        mb={6}
        sx={{
          fontSize: { xs: '3rem', md: '5rem' }
        }}
      >
        Schoolway
      </Typography>

      <Box display="flex" gap={3} sx={{ flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button
          component={Link}
          to="/login"
          variant="contained"
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            borderRadius: 3,
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
            '&:hover': {
              background: 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Login
        </Button>

        {/* <Button
          component={Link}
          to="/signup"
          variant="outlined"
          size="large"
          color="inherit"
          sx={{
            px: 4,
            py: 1.5,
            fontSize: '1.1rem',
            borderRadius: 3,
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          Sign Up
        </Button> */}
      </Box>
    </Box>
  );
};

export default Home;