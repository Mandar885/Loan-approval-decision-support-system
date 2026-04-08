import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, mean_absolute_error, r2_score

print("Loading dataset...")
df = pd.read_csv('BankChurners.csv')

# Drop unnecessary columns
drop_cols = ['CLIENTNUM', 
             'Naive_Bayes_Classifier_Attrition_Flag_Card_Category_Contacts_Count_12_mon_Dependent_count_Education_Level_Months_Inactive_12_mon_1', 
             'Naive_Bayes_Classifier_Attrition_Flag_Card_Category_Contacts_Count_12_mon_Dependent_count_Education_Level_Months_Inactive_12_mon_2']
df = df.drop(columns=[col for col in drop_cols if col in df.columns], errors='ignore')

# Target variable - 1 for Existing (Eligible for Loan), 0 for Attrited (Not Eligible)
df['Target'] = df['Attrition_Flag'].apply(lambda x: 1 if x == 'Existing Customer' else 0)
df = df.drop('Attrition_Flag', axis=1)

# Select features - expanded set for better accuracy
# Original 8 profile features  +  6 behavioral features from the dataset
selected_features = [
    # Profile features (used in loan application form)
    'Customer_Age', 'Gender', 'Dependent_count',
    'Education_Level', 'Marital_Status', 'Income_Category',
    'Credit_Limit', 'Total_Revolving_Bal',
    # Behavioral features (from bank records - highly predictive)
    'Total_Trans_Amt', 'Total_Trans_Ct',
    'Total_Ct_Chng_Q4_Q1', 'Total_Amt_Chng_Q4_Q1',
    'Avg_Utilization_Ratio', 'Months_on_book',
]

X = df[selected_features].copy()
y = df['Target']

# Encode categorical features
cat_cols = X.select_dtypes(include=['object']).columns

label_encoders = {}
for col in cat_cols:
    le = LabelEncoder()
    # Need to use .loc to avoid SettingWithCopyWarning
    X.loc[:, col] = le.fit_transform(X[col])
    label_encoders[col] = le


# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Standardize numerical features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

print("Training models...")
# Train models with tuned hyperparameters
models = {
    'RandomForest': RandomForestClassifier(
        n_estimators=200, max_depth=15, min_samples_split=5,
        min_samples_leaf=2, random_state=42
    ),
    'DecisionTree': DecisionTreeClassifier(
        max_depth=10, min_samples_split=10,
        min_samples_leaf=5, random_state=42
    ),
    'LogisticRegression': LogisticRegression(max_iter=1000, random_state=42)
}

metrics = {}

os.makedirs('models', exist_ok=True)

# Train, evaluate, and save models
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    mean_y = np.mean(y_test)
    rse = np.sum((y_test - y_pred)**2) / np.sum((y_test - mean_y)**2)

    metrics[name] = {
        'accuracy': float(acc),
        'f1_score': float(f1),
        'mae': float(mae),
        'mse': float(mse),
        'rmse': float(rmse),
        'r2': float(r2),
        'rse': float(rse)
    }
    print(f"{name} metrics - Acc: {acc:.4f}, F1: {f1:.4f}, RMSE: {rmse:.4f}, RSE: {rse:.4f}")

    # Save the model
    joblib.dump(model, f'models/{name}_model.pkl')

# Save preprocessing objects
joblib.dump(scaler, 'models/scaler.pkl')
joblib.dump(label_encoders, 'models/label_encoders.pkl')
joblib.dump(metrics, 'models/metrics.pkl')

print("Models and preprocessing artifacts saved successfully.")
