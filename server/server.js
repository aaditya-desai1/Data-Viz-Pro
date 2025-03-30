const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/dataviz-pro', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// File upload configuration
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage });

// Routes
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    // Send file to AI service for analysis
    const response = await fetch('http://ai-service:5001/analyze', {
      method: 'POST',
      body: JSON.stringify({ filePath: file.path }),
      headers: { 'Content-Type': 'application/json' }
    });
    const recommendations = await response.json();
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));