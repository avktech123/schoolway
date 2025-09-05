import React, { useState } from 'react';
import { Typography, TextField, Button, Box, Paper, Link } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Signup = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch({ type: 'SET_USER', payload: { name: formData.name } });
    navigate('/dashboard');
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          maxWidth: 450,
          width: '100%',
          mx: 2,
          borderRadius: 3,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)'
        }}
      >
        <Typography
          variant="h4"
          align="center"
          fontWeight="bold"
          mb={3}
          color="primary"
        >
          Create Account
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            name="name"
            label="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
            mb={1}
          />

          <TextField
            fullWidth
            margin="normal"
            name="email"
            label="Email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            mb={1}
          />

          <TextField
            fullWidth
            margin="normal"
            name="phone"
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            mb={1}
          />

          <TextField
            fullWidth
            margin="normal"
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            mb={1}
          />

          <TextField
            fullWidth
            margin="normal"
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            mb={3}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ py: 1.5, mb: 2 }}
          >
            Sign Up
          </Button>

          <Typography align="center" variant="body2">
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" color="primary">
              Login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Signup;