from flask import Flask, request, jsonify
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from typing import Dict, List

app = Flask(__name__)

def analyze_dataset(file_path: str) -> Dict:
    df = pd.read_csv(file_path) if file_path.endswith('.csv') else pd.read_json(file_path)
    
    recommendations = []
    columns = df.columns.tolist()
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object']).columns
    
    # Simple recommendation logic
    if len(numeric_cols) >= 2:
        recommendations.append({
            'chartType': 'scatter',
            'confidence': 0.8,
            'suggestedColumns': numeric_cols[:2].tolist()
        })
    
    if len(categorical_cols) >= 1 and len(numeric_cols) >= 1:
        recommendations.append({
            'chartType': 'bar',
            'confidence': 0.9,
            'suggestedColumns': [categorical_cols[0], numeric_cols[0]]
        })
    
    return {
        'columns': columns,
        'rowCount': len(df),
        'dataTypes': df.dtypes.astype(str).to_dict(),
        'recommendations': recommendations
    }

@app.route('/analyze', methods=['POST'])
def analyze():
    file_path = request.json['filePath']
    return jsonify(analyze_dataset(file_path))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)