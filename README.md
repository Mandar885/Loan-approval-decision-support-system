# 🏦 VaultPay: AI-Driven Loan Approval System

**VaultPay** is a professional full-stack decision support system designed to bridge the gap between machine learning and financial underwriting. By leveraging a multi-model ensemble approach, it provides administrators with AI-backed confidence scores to make informed, data-driven lending decisions.

---

## 🚀 Key Features

### 👤 Customer Portal
* **Seamless Application:** Streamlined form for submitting personal and financial data.
* **Real-time Tracking:** Live status updates on pending applications.
* **Transparency:** View global model accuracy metrics to understand the "AI behind the curtain."

### 🛡️ Admin Underwriting Dashboard
* **Ensemble Predictions:** Compare outputs from three distinct ML models (**Random Forest**, **Decision Tree**, and **Logistic Regression**) simultaneously.
* **Confidence Scoring:** View probability percentages to gauge the reliability of an AI verdict.
* **Human-in-the-Loop:** Admins maintain final authority, with the ability to add decision notes to override or confirm AI suggestions.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| **Frontend** | React 18, Tailwind CSS, Shadcn/ui, Axios |
| **Backend** | Flask (Python), Flask-CORS |
| **Machine Learning** | Scikit-learn, Pandas, Joblib |
| **Models** | Random Forest, Decision Tree, Logistic Regression |

---

## 📐 Project Structure

```
.
├── models/                # Trained model files & encoders (.pkl)
├── backend.py             # Flask REST API serving ML models
├── train.py               # Model training & preprocessing script
├── BankChurners.csv       # Training dataset
└── frontend/              # React + Shadcn/ui application
    ├── src/
    │   ├── pages/         # Admin & Customer Dashboards
    │   └── components/    # Shadcn/ui components
    └── tailwind.config.js # Styling configuration
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
