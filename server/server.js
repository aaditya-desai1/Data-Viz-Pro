const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const csv = require('csv-parser'); // Add CSV parser
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json()); // For JSON data
app.use(express.urlencoded({ extended: true })); // For form data

// CSV file upload handler
app.post('/api/upload/csv', (req, res) => {
  // Handle CSV file upload
  const results = [];
  
  if (!req.files || !req.files.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  const csvFile = req.files.file;
  
  fs.createReadStream(csvFile.tempFilePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Process the CSV data
      res.json({ success: true, data: results });
    });
});

// JSON data endpoint
app.post('/api/upload/json', (req, res) => {
  // JSON is already parsed by bodyParser.json()
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'No JSON data provided' });
  }
  
  // Process the JSON data
  res.json({ success: true, data: req.body });
});

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