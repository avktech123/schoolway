const mongoose = require('mongoose');
const config = require('./config/config');
const app = require('./app');

const PORT = config.port;

// MongoDB connection
mongoose.connect(config.mongoUri)
  .then(() => {
    console.log('MongoDB connected successfully');
    console.log(`Database: ${config.mongoUri}`);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

async function shutdown(signal) {
  try {
    console.log(`${signal} received, shutting down gracefully`);
    await mongoose.connection.close();
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));