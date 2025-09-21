import React, { useState } from 'react';
import { Typography, TextField, Button, Box, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { signIn } from '../gateways/api';

const Login = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data } = await signIn(formData);
    if (data.token) {
      dispatch({
        type: 'SET_USER',
        payload: {
          user: data.user,
          token: data.token
        }
      });
      navigate('/dashboard');
    } else {
      setError(data.error);
    }
    setLoading(false);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          maxWidth: 400,
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
          Welcome Back
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            margin="normal"
            name="username"
            label="User Name"
            type="text"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            mb={2}
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
            disabled={loading}
            mb={3}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ py: 1.5, mb: 2 }}
          >
            {loading ? 'Signing In...' : 'Login'}
          </Button>
          {/* <Typography align="center" variant="body2">
            Don't have an account?{' '}
            <Link component={RouterLink} to="/signup" color="primary">
              Sign up
            </Link>
          </Typography> */}
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;