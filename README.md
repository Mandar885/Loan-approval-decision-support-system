# VaultPay - Loan Approval Simulator with Shadcn/ui

A professional full-stack application demonstrating ML-assisted loan approval decisions using React + Shadcn/ui on the frontend and Flask + scikit-learn on the backend.

## Features

✨ **Customer Portal**
- Submit loan applications with personal & financial details
- Track application status in real-time
- View model accuracy metrics

⚙️ **Admin Portal**
- Review pending applications in a queue
- Run AI-assisted predictions using 3 ML models:
  - Random Forest
  - Decision Tree
  - Logistic Regression
- View per-model predictions and confidence scores
- Make informed approve/reject decisions
- Add decision notes

🎨 **Modern UI**
- Shadcn/ui inspired design with Tailwind CSS
- Responsive grid layout
- Clean data visualization
- Professional card-based components

## Project Structure

```
.
├── models/                    # Trained model files
│   ├── RandomForest_model.pkl
│   ├── DecisionTree_model.pkl
│   ├── LogisticRegression_model.pkl
│   ├── scaler.pkl
│   ├── label_encoders.pkl
│   └── accuracies.pkl
├── backend.py                 # Flask app serving ML models
├── train.py                   # Model training script
├── BankChurners.csv          # Training dataset
└── frontend/                  # React + Shadcn/ui app
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx
    │   ├── index.js
    │   ├── index.css
    │   └── pages/
    │       ├── LoginPage.jsx
    │       ├── CustomerDashboard.jsx
    │       └── AdminDashboard.jsx
    ├── package.json
    ├── tailwind.config.js
    └── postcss.config.js
```

## Quick Setup

### 1. Train ML Models (if not already done)

```bash
python train.py
```

This will:
- Load BankChurners.csv
- Train Random Forest, Decision Tree, and Logistic Regression
- Save models to `models/` directory

### 2. Install Backend Dependencies

```bash
pip install flask flask-cors pandas joblib scikit-learn
```

### 3. Start Flask Backend

```bash
python backend.py
```

Backend runs on `http://localhost:5000`

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Start React Frontend

```bash
npm start
```

Frontend runs on `http://localhost:3000`

## Usage

1. **Login**: Choose "Customer" or "Admin" role
2. **Customer Flow**:
   - Fill out loan application form
   - Submit for underwriting
   - Track application status
3. **Admin Flow**:
   - Select pending application from queue
   - Click "Run Assessment" to invoke models
   - Review predictions from all 3 models
   - Make approval/rejection decision

## Model Details

### Training Data
- **Dataset**: BankChurners.csv
- **Target**: Customer attrition (1 = Stable customer eligible for loan, 0 = High risk)
- **Features**: Age, Gender, Dependents, Education, Marital Status, Income, Credit Limit, Revolving Balance

### Model Accuracies (test set)
- Random Forest: ~95.71%
- Decision Tree: ~93.29%
- Logistic Regression: ~90.08%

## API Endpoints

### `GET /api/health`
Health check

### `GET /api/models/accuracies`
Returns accuracy scores for all three models

### `POST /api/predict`
Predict loan approval using all three models

**Request body:**
```json
{
  "Customer_Age": 45,
  "Gender": "M",
  "Dependent_count": 2,
  "Education_Level": "Graduate",
  "Marital_Status": "Married",
  "Income_Category": "$60K - $80K",
  "Credit_Limit": 15000,
  "Total_Revolving_Bal": 500
}
```

**Response:**
```json
{
  "success": true,
  "predictions": {
    "Random Forest": {
      "verdict": "Approve",
      "confidence": 0.95
    },
    "Decision Tree": {
      "verdict": "Approve",
      "confidence": 0.92
    },
    "Logistic Regression": {
      "verdict": "Reject",
      "confidence": 0.62
    }
  },
  "finalRecommendation": "Approve",
  "approveVotes": 2
}
```

## Technologies Used

**Frontend:**
- React 18
- Tailwind CSS
- Axios
- Shadcn/ui design patterns

**Backend:**
- Flask
- scikit-learn (Random Forest, Decision Tree, Logistic Regression)
- joblib
- pandas
- Flask-CORS

## Notes

- This is a course project demonstrating ML model usage in a web application
- Models make predictions based on the BankChurners dataset; not for real loan decisions
- The admin interface shows how AI can assist human decision-making (not replace it)
