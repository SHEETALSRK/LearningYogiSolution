const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const uploadRoutes = require('./routes/upload');
const timetablesRoutes = require('./routes/timetables');
app.use('/api', uploadRoutes);
app.use('/api/timetables', timetablesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload error' });
  }
  res.status(500).json({ error: 'Something went wrong!' });
});

// Set port and start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});