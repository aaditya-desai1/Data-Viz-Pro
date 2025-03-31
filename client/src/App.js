import React, { useState } from 'react';
import './App.css';
import DataUpload from './components/DataUpload';
import DataVisualization from './components/DataVisualization';

function App() {
  const [data, setData] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const handleDataLoaded = (convertedData) => {
    console.log("Data loaded in App:", convertedData);
    setData(convertedData);
    setDataLoaded(true);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>DataViz Pro</h1>
        <p>AI-Powered Data Visualization Tool</p>
      </header>

      <main className="app-main">
        <DataUpload onDataLoaded={handleDataLoaded} />
        
        {dataLoaded && (
          <div className="analysis-section">
            <h2>Analysis Results</h2>
            
            // Update the dataset overview section
            <div className="dataset-overview">
              <h3>Dataset Overview</h3>
              <div className="stats">
                <div className="stat-item">
                  <span className="stat-value">{data?.parsedData?.length || 0}</span>
                  <span className="stat-label">Rows</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {data?.parsedData?.[0] ? Object.keys(data.parsedData[0]).length : 0}
                  </span>
                  <span className="stat-label">Columns</span>
                </div>
              </div>
              
              <div className="columns-list">
                <h4>Columns:</h4>
                <div className="columns-container">
                  {data?.parsedData?.[0] && 
                    Object.keys(data.parsedData[0]).map(col => (
                      <span key={col} className="column-tag">{col}</span>
                    ))
                  }
                </div>
              </div>
            </div>
            
            <div className="visualization-section">
              <h3>Create Custom Visualization</h3>
              <DataVisualization data={data} />
            </div>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>© 2023 DataViz Pro | AI-Powered Data Analysis</p>
      </footer>
    </div>
  );
}

export default App;