/**
 * Data Transformer Utility
 * Transforms various data formats into a standardized structure for visualization
 */

// Process raw data into a format suitable for visualization
export const processData = (data) => {
  // Handle the specific structure with records and aggregated_data
  if (data && data.records && Array.isArray(data.records)) {
    return {
      rawData: data.records,
      aggregatedData: data.aggregated_data || generateAggregatedData(data.records)
    };
  }

  // Handle direct array data
  if (Array.isArray(data)) {
    return {
      rawData: data,
      aggregatedData: generateAggregatedData(data)
    };
  }

  // Handle object data
  if (data && typeof data === 'object') {
    // Find the first array property
    const arrayProp = Object.entries(data).find(([_, value]) => Array.isArray(value));
    if (arrayProp) {
      return {
        rawData: arrayProp[1],
        aggregatedData: generateAggregatedData(arrayProp[1])
      };
    }
  }

  return { rawData: [], aggregatedData: {} };
};

// Add this helper function to format dates consistently
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (e) {
    return dateString;
  }
};

// Update the generateChartData function in DataVisualization.js
const generateChartData = () => {
  if (!processedData?.rawData?.length) return;

  const data = processedData.rawData;
  
  // Format dates if dealing with date field
  const xValues = data.map(item => 
    columns.find(col => col.name === xAxis)?.type === 'date' 
      ? formatDate(item[xAxis]) 
      : item[xAxis]
  );

  const uniqueXValues = [...new Set(xValues)];
  
  // Sort dates if x-axis is a date
  if (columns.find(col => col.name === xAxis)?.type === 'date') {
    uniqueXValues.sort();
  }

  // Rest of your generateChartData function...
};

// Generate aggregated data from raw records
const generateAggregatedData = (records) => {
  if (!records || records.length === 0) return {};
  
  const result = {
    by_category: {},
    by_region: {},
    by_date: {}
  };
  
  // Get all possible keys from the data
  const sampleKeys = Object.keys(records[0]);
  
  // Dynamically determine categorical fields
  const categoricalFields = sampleKeys.filter(key => 
    typeof records[0][key] === 'string' && 
    !key.includes('date') && 
    !key.includes('time')
  );
  
  // Dynamically determine numerical fields
  const numericalFields = sampleKeys.filter(key => 
    typeof records[0][key] === 'number'
  );
  
  // Dynamically determine date fields
  const dateFields = sampleKeys.filter(key => 
    key.includes('date') || 
    (typeof records[0][key] === 'string' && 
     !isNaN(Date.parse(records[0][key])))
  );
  
  // Create aggregations for each categorical field
  categoricalFields.forEach(field => {
    const aggregation = {};
    
    records.forEach(record => {
      const category = record[field];
      if (!category) return;
      
      if (!aggregation[category]) {
        aggregation[category] = { 
          count: 0,
          total: 0
        };
        
        // Add totals for each numerical field
        numericalFields.forEach(numField => {
          aggregation[category][`total_${numField}`] = 0;
          aggregation[category][`avg_${numField}`] = 0;
        });
      }
      
      aggregation[category].count++;
      
      // Sum numerical values
      numericalFields.forEach(numField => {
        if (record[numField] !== undefined) {
          aggregation[category][`total_${numField}`] += record[numField];
          aggregation[category][`avg_${numField}`] = 
            aggregation[category][`total_${numField}`] / aggregation[category].count;
        }
      });
    });
    
    // Convert to array format
    result[`by_${field}`] = Object.entries(aggregation).map(([key, value]) => ({
      [field]: key,
      ...value
    }));
  });
  
  return result;
};

// Extract column information from data
export const extractColumns = (data) => {
  if (!data || !data.rawData || data.rawData.length === 0) {
    return [];
  }
  
  const sample = data.rawData[0];
  return Object.keys(sample).map(key => ({
    name: key,
    type: getColumnType(sample[key]),
    isNumeric: typeof sample[key] === 'number'
  }));
};

// Determine column data type
const getColumnType = (value) => {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'string') {
    // Check if it's a date
    if (!isNaN(Date.parse(value))) return 'date';
    return 'string';
  }
  return 'unknown';
};