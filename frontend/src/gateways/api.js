import axios from './axiosInstance';

export const signIn = async (payload) => {
  try {
    const { data } = await axios.post('/auth/signin', payload);
    return data;
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Login failed. Please try again.',
    };
  }
};