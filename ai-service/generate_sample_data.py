import pandas as pd
import numpy as np
import random

# Generate sample data with 15-20 records
n_samples = random.randint(15, 20)
names = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Alex', 'Lisa', 'Tom', 'Anna']
departments = ['Sales', 'IT', 'HR', 'Marketing', 'Finance']
locations = ['New York', 'London', 'Tokyo', 'Paris', 'Singapore']

# Set a random seed for reproducibility
np.random.seed(42)
random.seed(42)

data = {
    'name': [random.choice(names) for _ in range(n_samples)],
    'age': sorted(np.random.randint(25, 65, n_samples)),  # Sort ages in ascending order
    'salary': np.random.normal(60000, 15000, n_samples).astype(int),
    'experience': sorted(np.random.randint(1, 30, n_samples)),  # Sort experience in ascending order
    'department': [random.choice(departments) for _ in range(n_samples)],
    'location': [random.choice(locations) for _ in range(n_samples)],
    'performance_score': np.random.uniform(3.0, 5.0, n_samples).round(2),
    'projects_completed': np.random.randint(5, 50, n_samples),
    'training_hours': np.random.randint(20, 200, n_samples),
    'satisfaction_score': np.random.uniform(3.0, 5.0, n_samples).round(2)
}

# Create DataFrame and save to CSV
df = pd.DataFrame(data)
df.to_csv('sample_employee_data.csv', index=False)

print(f"Generated sample data with {n_samples} records")