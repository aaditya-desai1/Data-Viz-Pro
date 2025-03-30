import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData);
      onAnalysisComplete(response.data);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setLoading(false);
  };

  return (
    <div className="upload-container">
      <input
        type="file"
        accept=".csv,.json"
        onChange={(e) => setFile(e.target.files[0])}
      />
      <button 
        onClick={handleUpload}
        disabled={!file || loading}
      >
        {loading ? 'Analyzing...' : 'Upload & Analyze'}
      </button>
    </div>
  );
};

export default FileUpload;