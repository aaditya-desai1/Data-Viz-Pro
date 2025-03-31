import React, { useState } from 'react';
import './App.css';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Scatter, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState({ x: '', y: '' });
  const [customChart, setCustomChart] = useState(null);
  const [chartType, setChartType] = useState('bar');

  // Add this function to handle custom chart creation
  const createCustomChart = () => {
    if (!selectedColumns.x || !selectedColumns.y || !analysisData) return;
    
    // Calculate confidence score for custom chart
    let confidence = 0.75; // Default medium confidence
    
    // Check data types to determine confidence
    const xType = analysisData.dataTypes[selectedColumns.x] || 'unknown';
    const yType = analysisData.dataTypes[selectedColumns.y] || 'unknown';
    
    console.log("Data types for confidence calculation:", xType, yType); // Better debug log
    
    // Adjust confidence based on chart type and data types
    if (chartType === 'scatter' && 
        (xType === 'number' || xType === 'float' || xType === 'int') && 
        (yType === 'number' || yType === 'float' || yType === 'int')) {
      confidence = 0.95; // High confidence for numeric scatter plots
    } else if (chartType === 'bar' && 
              (xType === 'string' || xType === 'category' || xType === 'object') && 
              (yType === 'number' || yType === 'float' || yType === 'int')) {
      confidence = 0.92; // High confidence for categorical bar charts
    } else if (chartType === 'line' && 
              (yType === 'number' || yType === 'float' || yType === 'int')) {
      confidence = 0.88; // Good confidence for line charts with numeric y-axis
    } else if (chartType === 'pie' && 
              (xType === 'string' || xType === 'category' || xType === 'object') && 
              (yType === 'number' || yType === 'float' || yType === 'int')) {
      confidence = 0.85; // Good confidence for categorical pie charts
    }
    
    setCustomChart({
      chartType: chartType,
      suggestedColumns: [selectedColumns.x, selectedColumns.y],
      confidence: confidence
    });
  };

  // Update the renderChart function to make charts larger and sort data
  const renderChart = (chartType, columns, data) => {
    if (!data) {
      console.log("No data available for chart");
      return <div>No data available</div>;
    }
    
    // Clean column names to remove any non-ASCII characters
    const cleanColumns = columns.map(col => col.replace(/[^\x00-\x7F]/g, ""));
    
    // Update options to make charts larger
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: { size: 14 }
          }
        },
        title: {
          display: true,
          text: `${chartType.toUpperCase()} Chart: ${cleanColumns.join(' vs ')}`,
          font: { size: 16, weight: 'bold' }
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: cleanColumns[0],
            font: { size: 14, weight: 'bold' }
          },
          ticks: { font: { size: 12 } }
        },
        y: {
          title: {
            display: true,
            text: cleanColumns[1],
            font: { size: 14, weight: 'bold' }
          },
          ticks: { font: { size: 12 } }
        }
      }
    };

    // Sort data by x-axis values for all chart types
    const sortedIndices = [...Array(data[cleanColumns[0]].length).keys()]
      .sort((a, b) => {
        const valA = typeof data[cleanColumns[0]][a] === 'string' ? 
          data[cleanColumns[0]][a] : 
          parseFloat(data[cleanColumns[0]][a]);
        const valB = typeof data[cleanColumns[0]][b] === 'string' ? 
          data[cleanColumns[0]][b] : 
          parseFloat(data[cleanColumns[0]][b]);
        return valA < valB ? -1 : valA > valB ? 1 : 0;
      });

    const sortedXValues = sortedIndices.map(i => data[cleanColumns[0]][i]);
    const sortedYValues = sortedIndices.map(i => data[cleanColumns[1]][i]);

    if (chartType === 'bar') {
      const chartData = {
        labels: sortedXValues,
        datasets: [
          {
            label: cleanColumns[1],
            data: sortedYValues,
            backgroundColor: 'rgba(53, 162, 235, 0.7)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      };
      return <Bar options={options} data={chartData} />;
    }

    if (chartType === 'scatter') {
      const chartData = {
        datasets: [
          {
            label: `${cleanColumns[0]} vs ${cleanColumns[1]}`,
            data: sortedIndices.map(i => ({
              x: parseFloat(data[cleanColumns[0]][i]),
              y: parseFloat(data[cleanColumns[1]][i])
            })),
            backgroundColor: 'rgba(255, 99, 132, 0.7)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            pointRadius: 8,
            pointHoverRadius: 10
          }
        ]
      };
      return <Scatter options={options} data={chartData} />;
    }

    if (chartType === 'line') {
      const chartData = {
        labels: sortedXValues,
        datasets: [
          {
            label: cleanColumns[1],
            data: sortedYValues,
            fill: false,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1
          }
        ]
      };
      return <Line options={options} data={chartData} />;
    }

    if (chartType === 'pie') {
      // For pie charts, we need to aggregate data by categories
      const categories = {};
      sortedXValues.forEach((value, index) => {
        if (!categories[value]) {
          categories[value] = 0;
        }
        categories[value] += parseFloat(sortedYValues[index]) || 0;
      });
      
      const chartData = {
        labels: Object.keys(categories),
        datasets: [
          {
            label: cleanColumns[1],
            data: Object.values(categories),
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(201, 203, 207, 0.7)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(201, 203, 207, 1)',
            ],
            borderWidth: 1
          }
        ]
      };
      return <div className="pie-chart-container">
        <Pie options={{
          ...options, 
          aspectRatio: 1.5,
          plugins: {
            ...options.plugins,
            legend: {
              position: 'right',
              labels: { font: { size: 14 } }
            }
          }
        }} data={chartData} />
      </div>;
    }

    return null;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5001/analyze', {
        method: 'POST',
        body: formData,
        // Don't set any headers for FormData
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze file');
      }
      
      const data = await response.json();
      console.log("Received data:", data);
      setAnalysisData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add this JSX after the data summary section
  return (
    <div className="App">
      <header className="App-header">
        <h1>DataViz Pro</h1>
        <p>AI-Powered Data Visualization Tool</p>
      </header>

      <div className="upload-section">
        <h2>Upload Your Data</h2>
        <p>Select a CSV or JSON file to analyze</p>
        <input
          type="file"
          accept=".csv,.json"
          onChange={handleFileUpload}
          className="file-input"
        />
      </div>

      {loading && <div className="loading">
        <div className="loading-spinner"></div>
        <p>Analyzing your data...</p>
      </div>}
      
      {error && <div className="error">{error}</div>}

      {analysisData && (
        <div className="results">
          <h2>Analysis Results</h2>
          
          <div className="data-summary">
            <div className="summary-card">
              <h3>Dataset Overview</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-value">{analysisData.rowCount}</span>
                  <span className="stat-label">Rows</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{analysisData.columns.length}</span>
                  <span className="stat-label">Columns</span>
                </div>
              </div>
              <div className="columns-list">
                <h4>Columns:</h4>
                <ul>
                  {analysisData.columns.map((col, idx) => (
                    <li key={idx}>
                      <strong>{col.replace(/[^\x00-\x7F]/g, "")}</strong>: {analysisData.dataTypes[col]}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Add custom visualization section */}
          <div className="custom-viz-section">
            <h3>Create Custom Visualization</h3>
            <div className="custom-controls">
              <div className="select-group">
                <label htmlFor="x-column">X-Axis Column:</label>
                <select 
                  id="x-column" 
                  value={selectedColumns.x} 
                  onChange={(e) => setSelectedColumns({...selectedColumns, x: e.target.value})}
                >
                  <option value="">Select column</option>
                  {analysisData.columns.map((col, idx) => (
                    <option key={`x-${idx}`} value={col}>{col.replace(/[^\x00-\x7F]/g, "")}</option>
                  ))}
                </select>
              </div>
              
              <div className="select-group">
                <label htmlFor="y-column">Y-Axis Column:</label>
                <select 
                  id="y-column" 
                  value={selectedColumns.y} 
                  onChange={(e) => setSelectedColumns({...selectedColumns, y: e.target.value})}
                >
                  <option value="">Select column</option>
                  {analysisData.columns.map((col, idx) => (
                    <option key={`y-${idx}`} value={col}>{col.replace(/[^\x00-\x7F]/g, "")}</option>
                  ))}
                </select>
              </div>
              
              <div className="select-group">
                <label htmlFor="chart-type">Chart Type:</label>
                <select 
                  id="chart-type" 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>
              
              <button 
                className="create-chart-btn" 
                onClick={createCustomChart}
                disabled={!selectedColumns.x || !selectedColumns.y}
              >
                Create Visualization
              </button>
            </div>
            
            {customChart && (
              <div className="chart-card custom-chart-card">
                <div className="chart-header">
                  <h4>{customChart.chartType.toUpperCase()} Chart</h4>
                  <div className="confidence-badge" style={{
                    backgroundColor: customChart.confidence >= 0.9 ? '#4caf50' : '#ff9800'
                  }}>
                    {(customChart.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
                <p className="chart-description">
                  Custom visualization comparing {customChart.suggestedColumns[0].replace(/[^\x00-\x7F]/g, "")} and {customChart.suggestedColumns[1].replace(/[^\x00-\x7F]/g, "")}
                </p>
                <div className="chart-container custom-chart-container">
                  {renderChart(customChart.chartType, customChart.suggestedColumns, analysisData.data)}
                </div>
              </div>
            )}
          </div>
          
          <h3>Recommended Visualizations</h3>
          <div className="charts-container">
            {analysisData.recommendations.map((rec, index) => (
              <div key={index} className="chart-card">
                <div className="chart-header">
                  <h4>{rec.chartType.toUpperCase()} Chart</h4>
                  <div className="confidence-badge" style={{
                    backgroundColor: rec.confidence >= 0.9 ? '#4caf50' : '#ff9800'
                  }}>
                    {(rec.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
                {/* Chart description with clean column names */}
                <p className="chart-description">
                  {rec.chartType === 'scatter' ? 
                    `This scatter plot shows the relationship between ${rec.suggestedColumns[0].replace(/[^\x00-\x7F]/g, "")} and ${rec.suggestedColumns[1].replace(/[^\x00-\x7F]/g, "")}` : 
                    rec.chartType === 'bar' ?
                    `This bar chart compares ${rec.suggestedColumns[1].replace(/[^\x00-\x7F]/g, "")} values across different ${rec.suggestedColumns[0].replace(/[^\x00-\x7F]/g, "")} categories` :
                    rec.chartType === 'line' ?
                    `This line chart shows the trend of ${rec.suggestedColumns[1].replace(/[^\x00-\x7F]/g, "")} over ${rec.suggestedColumns[0].replace(/[^\x00-\x7F]/g, "")}` :
                    `This pie chart shows the distribution of ${rec.suggestedColumns[1].replace(/[^\x00-\x7F]/g, "")} across ${rec.suggestedColumns[0].replace(/[^\x00-\x7F]/g, "")} categories`
                  }
                </p>
                <div className="chart-container">
                  {analysisData.data && renderChart(rec.chartType, rec.suggestedColumns, analysisData.data)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <footer className="app-footer">
        <p>© 2023 DataViz Pro | AI-Powered Data Analysis</p>
      </footer>
    </div>
  );
}

export default App;
