const mongoose = require('mongoose');

const DatasetSchema = new mongoose.Schema({
  filename: String,
  filepath: String,
  uploadDate: { type: Date, default: Date.now },
  metadata: {
    columns: [String],
    rowCount: Number,
    dataTypes: Map,
    recommendations: [{
      chartType: String,
      confidence: Number,
      suggestedColumns: [String]
    }]
  },
  userId: mongoose.Schema.Types.ObjectId
});

module.exports = mongoose.model('Dataset', DatasetSchema);