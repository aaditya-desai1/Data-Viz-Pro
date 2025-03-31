import React, { useState } from 'react';
import Papa from 'papaparse';
import './DataUpload.css';

function DataUpload({ onDataLoaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const convertJsonToCsv = (jsonData) => {
    try {
      // Extract records from the data
      const records = jsonData.records || jsonData;
      
      if (!Array.isArray(records) || records.length === 0) {
        throw new Error('No valid data records found');
      }
      
      // Convert JSON to CSV string
      const csv = Papa.unparse(records);
      
      // Parse CSV back to structured data
      const parsedData = Papa.parse(csv, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true
      });
      
      if (parsedData.errors && parsedData.errors.length > 0) {
        console.warn("CSV parsing warnings:", parsedData.errors);
      }
      
      return {
        csvString: csv,
        parsedData: parsedData.data,
        originalJson: jsonData
      };
    } catch (err) {
      console.error("Error converting data:", err);
      throw err;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // Parse the JSON file
          const jsonData = JSON.parse(e.target.result);
          console.log("Parsed JSON:", jsonData);
          
          // Convert JSON to CSV
          const convertedData = convertJsonToCsv(jsonData);
          console.log("Converted to CSV format");
          
          // Pass the converted data to parent component
          onDataLoaded(convertedData);
          
          setLoading(false);
        } catch (error) {
          console.error('Processing failed:', error);
          setError(error.message || 'Failed to process file');
          setLoading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Error reading file');
        setLoading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message || 'Failed to upload file');
      setLoading(false);
    }
  };
  
  return (
    <div className="upload-container">
      <h2>Upload Your Data</h2>
      <p>Select a CSV or JSON file to analyze</p>
      
      <div className="file-input-container">
        <input 
          type="file" 
          accept=".json,.csv" 
          onChange={handleFileChange} 
          className="file-input"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="file-label">
          {file ? file.name : 'Choose File'}
        </label>
        
        <button 
          onClick={handleUpload} 
          disabled={!file || loading}
          className="upload-button"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      {file && (
        <div className="file-info">
          <p>Selected file: {file.name}</p>
          <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
        </div>
      )}
    </div>
  );
}

export default DataUpload;