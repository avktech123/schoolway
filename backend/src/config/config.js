require('dotenv').config();

module.exports = {
  // Server Configuration
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // MongoDB Configuration
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolway',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET || 'schoolway-default-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS Configuration
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  
  // Validation
  validateConfig: () => {
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    
    if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI is required in production');
    }
  }
}; 