import './DataVisualization.css';
import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import Papa from 'papaparse'; // We'll need to install this package

// Register ChartJS components
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

const DataVisualization = ({ data }) => {
  const [columns, setColumns] = useState([]);
  const [selectedChart, setSelectedChart] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [chartData, setChartData] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [error, setError] = useState(null);
  const [chartVisible, setChartVisible] = useState(false);

  // Process data when it changes
  useEffect(() => {
    if (!data) return;
    
    try {
      console.log("Processing data in visualization component");
      
      // Use the parsed data from the CSV conversion
      const processedRecords = data.parsedData || [];
      
      if (processedRecords.length === 0) {
        throw new Error('No valid data records found');
      }
      
      setRawData(processedRecords);
      
      // Extract column information with proper type detection
      const sampleRecord = processedRecords[0];
      const extractedColumns = Object.entries(sampleRecord).map(([key, value]) => ({
        name: key,
        type: typeof value,
        isNumeric: typeof value === 'number'
      }));
      
      setColumns(extractedColumns);
      
      // Set default axes
      const defaultXAxis = extractedColumns.find(col => !col.isNumeric && col.name !== 'id')?.name || 'id';
      const defaultYAxis = extractedColumns.find(col => col.isNumeric && col.name !== 'id')?.name;
      
      setXAxis(defaultXAxis);
      setYAxis(defaultYAxis);
      
      // Auto-show chart
      setChartVisible(true);
      setError(null);
    } catch (err) {
      console.error('Error processing data:', err);
      setError('Failed to process data: ' + err.message);
    }
  }, [data]);

  // Generate chart when axes or chart type changes
  useEffect(() => {
    if (!rawData.length || !xAxis || !yAxis) return;
    
    try {
      // Group data by X-axis for aggregation
      const groupedData = {};
      
      rawData.forEach(item => {
        const xValue = String(item[xAxis] || 'Unknown');
        if (!groupedData[xValue]) {
          groupedData[xValue] = [];
        }
        
        const yValue = Number(item[yAxis] || 0);
        groupedData[xValue].push(yValue);
      });
      
      // Calculate aggregated values (average)
      const labels = Object.keys(groupedData);
      const values = labels.map(label => {
        const numbers = groupedData[label];
        const sum = numbers.reduce((acc, val) => acc + val, 0);
        return sum / numbers.length;
      });
      
      // Generate colors
      const backgroundColors = labels.map((_, i) => 
        `hsla(${(i * 360 / labels.length) % 360}, 70%, 60%, 0.6)`
      );
      
      const borderColors = labels.map((_, i) => 
        `hsla(${(i * 360 / labels.length) % 360}, 70%, 50%, 1)`
      );
      
      // Create chart data
      setChartData({
        labels,
        datasets: [{
          label: `${yAxis} by ${xAxis}`,
          data: values,
          backgroundColor: selectedChart === 'line' ? borderColors[0] : backgroundColors,
          borderColor: selectedChart === 'line' ? borderColors[0] : borderColors,
          borderWidth: 1
        }]
      });
      
      setError(null);
    } catch (err) {
      console.error('Error generating chart:', err);
      setError('Failed to generate chart: ' + err.message);
    }
  }, [rawData, xAxis, yAxis, selectedChart]);

  // Handle visualization creation
  const handleCreateVisualization = () => {
    setChartVisible(true);
    console.log('Creating visualization with:', { xAxis, yAxis, chartType: selectedChart });
  };

  // Render the chart
  const renderChart = () => {
    if (!chartData || !chartVisible) {
      return <div className="no-chart-message">Select axes and click Create Visualization</div>;
    }

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `${yAxis} by ${xAxis}`,
        },
      },
    };

    switch (selectedChart) {
      case 'bar':
        return <Bar data={chartData} options={options} />;
      case 'line':
        return <Line data={chartData} options={options} />;
      case 'pie':
        return <Pie data={chartData} options={options} />;
      default:
        return <Bar data={chartData} options={options} />;
    }
  };

  return (
    <div className="visualization-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="controls">
        <div className="control-group">
          <label>X Axis Column:</label>
          <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
            <option value="">Select column</option>
            {columns.map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Y Axis Column:</label>
          <select value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
            <option value="">Select column</option>
            {columns.filter(col => col.isNumeric).map(col => (
              <option key={col.name} value={col.name}>{col.name}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Chart Type:</label>
          <select value={selectedChart} onChange={(e) => setSelectedChart(e.target.value)}>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>
        
        <button 
          className="create-visualization-btn" 
          onClick={handleCreateVisualization}
          disabled={!xAxis || !yAxis}
        >
          Create Visualization
        </button>
      </div>

      <div className="chart-container">
        {renderChart()}
      </div>
    </div>
  );
};

export default DataVisualization;