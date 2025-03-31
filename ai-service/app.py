from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from typing import Dict, List
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configure upload settings
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')
ALLOWED_EXTENSIONS = {'csv', 'json'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_dataset(file_path: str) -> Dict:
    try:
        file_path = os.path.normpath(file_path)
        df = pd.read_csv(file_path, encoding='latin1') if file_path.endswith('.csv') else pd.read_json(file_path)
        
        recommendations = []
        columns = df.columns.tolist()
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        categorical_cols = df.select_dtypes(include=['object']).columns
        
        # Enhanced recommendation logic for larger datasets
        if len(numeric_cols) >= 2:
            # Correlation-based scatter plot recommendation
            corr_matrix = df[numeric_cols].corr()
            for i in range(len(numeric_cols)):
                for j in range(i+1, len(numeric_cols)):
                    corr = abs(corr_matrix.iloc[i, j])
                    if corr > 0.5:  # Strong correlation
                        recommendations.append({
                            'chartType': 'scatter',
                            'confidence': min(0.9, corr),
                            'suggestedColumns': [numeric_cols[i], numeric_cols[j]]
                        })

            # Time series or trend analysis
            recommendations.append({
                'chartType': 'line',
                'confidence': 0.75,
                'suggestedColumns': [numeric_cols[0], numeric_cols[1]]
            })
        
        if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
            # Group by analysis for categorical vs numeric
            for cat_col in categorical_cols[:2]:  # Limit to first 2 categorical columns
                for num_col in numeric_cols[:3]:  # Limit to first 3 numeric columns
                    group_counts = df.groupby(cat_col)[num_col].count()
                    if len(group_counts) <= 10:  # Reasonable number of categories
                        recommendations.append({
                            'chartType': 'bar',
                            'confidence': 0.85,
                            'suggestedColumns': [cat_col, num_col]
                        })
                        
                        if len(group_counts) <= 6:
                            recommendations.append({
                                'chartType': 'pie',
                                'confidence': 0.7,
                                'suggestedColumns': [cat_col, num_col]
                            })
        
        # Include the actual data for visualization
        data_dict = {}
        for col in columns:
            if col in numeric_cols:
                data_dict[col] = df[col].tolist()
            else:
                data_dict[col] = df[col].astype(str).tolist()
        
        return {
            'columns': columns,
            'rowCount': len(df),
            'dataTypes': df.dtypes.astype(str).to_dict(),
            'recommendations': recommendations[:6],  # Limit to top 6 recommendations
            'data': data_dict
        }
    except Exception as e:
        return {'error': str(e)}

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            
            result = analyze_dataset(filepath)
            if 'error' in result:
                return jsonify(result), 400
                
            return jsonify(result)
        else:
            return jsonify({'error': 'Invalid file type'}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add or update this function to ensure proper data type detection
def get_column_data_types(df):
    data_types = {}
    for column in df.columns:
        if pd.api.types.is_numeric_dtype(df[column]):
            if pd.api.types.is_integer_dtype(df[column]):
                data_types[column] = 'number'  # Use consistent type names
            else:
                data_types[column] = 'number'  # Use consistent type names
        elif pd.api.types.is_categorical_dtype(df[column]) or pd.api.types.is_object_dtype(df[column]):
            data_types[column] = 'string'  # Use consistent type names
        elif pd.api.types.is_datetime64_dtype(df[column]):
            data_types[column] = 'date'  # Use consistent type names
        else:
            data_types[column] = 'unknown'
    return data_types

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)