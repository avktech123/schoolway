const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/schoolway')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Simple API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Hureyyy! Backend connected successfully!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});