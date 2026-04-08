"""Flask backend for loan approval predictions and dashboard metadata."""

from datetime import datetime
import os

from flask import Flask, jsonify, request

from flask_cors import CORS
import joblib
import pandas as pd

app = Flask(__name__)
CORS(app)

DATASET_PATH = "BankChurners.csv"
FEATURE_ORDER = [
    "Customer_Age",
    "Gender",
    "Dependent_count",
    "Education_Level",
    "Marital_Status",
    "Income_Category",
    "Credit_Limit",
    "Total_Revolving_Bal",
    "Total_Trans_Amt",
    "Total_Trans_Ct",
    "Total_Ct_Chng_Q4_Q1",
    "Total_Amt_Chng_Q4_Q1",
    "Avg_Utilization_Ratio",
    "Months_on_book",
]


def safe_int(value, default):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def safe_float(value, default):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def load_models():
    try:
        loaded_models = {
            "Random Forest": joblib.load("models/RandomForest_model.pkl"),
            "Decision Tree": joblib.load("models/DecisionTree_model.pkl"),
            "Logistic Regression": joblib.load("models/LogisticRegression_model.pkl"),
        }
        loaded_scaler = joblib.load("models/scaler.pkl")
        loaded_encoders = joblib.load("models/label_encoders.pkl")
        try:
            loaded_metrics = joblib.load("models/metrics.pkl")
        except FileNotFoundError:
            loaded_metrics = None
        print("All model artifacts loaded.")
        return loaded_models, loaded_scaler, loaded_encoders, loaded_metrics
    except Exception as exc:
        print(f"Error loading model artifacts: {exc}")
        return None, None, None, None


def load_dataset():
    if not os.path.exists(DATASET_PATH):
        return None
    try:
        return pd.read_csv(DATASET_PATH)
    except Exception as exc:
        print(f"Error loading dataset: {exc}")
        return None


def build_sample_customers(df, limit=3):
    if df is None:
        return []

    pool = df.copy()
    if "Attrition_Flag" in pool.columns:
        existing = pool[pool["Attrition_Flag"] == "Existing Customer"]
        if not existing.empty:
            pool = existing

    pool = pool.head(limit)
    customers = []

    for idx, row in pool.iterrows():
        client_num = str(row.get("CLIENTNUM", f"CUST-{idx + 1}"))
        profile = {
            "Customer_Age": safe_int(row.get("Customer_Age"), 35),
            "Gender": str(row.get("Gender", "M")),
            "Dependent_count": safe_int(row.get("Dependent_count"), 0),
            "Education_Level": str(row.get("Education_Level", "Graduate")),
            "Marital_Status": str(row.get("Marital_Status", "Single")),
            "Income_Category": str(row.get("Income_Category", "$60K - $80K")),
            "Credit_Limit": safe_int(row.get("Credit_Limit"), 5000),
            "Total_Revolving_Bal": safe_int(row.get("Total_Revolving_Bal"), 500),
            "Total_Trans_Amt": safe_int(row.get("Total_Trans_Amt"), 4000),
            "Total_Trans_Ct": safe_int(row.get("Total_Trans_Ct"), 60),
            "Total_Ct_Chng_Q4_Q1": safe_float(row.get("Total_Ct_Chng_Q4_Q1"), 0.7),
            "Total_Amt_Chng_Q4_Q1": safe_float(row.get("Total_Amt_Chng_Q4_Q1"), 0.7),
            "Avg_Utilization_Ratio": safe_float(row.get("Avg_Utilization_Ratio"), 0.3),
            "Months_on_book": safe_int(row.get("Months_on_book"), 36),
        }
        customers.append(
            {
                "id": f"cust-{idx + 1}",
                "clientNum": client_num,
                "displayName": f"Customer {idx + 1}",
                "segment": str(row.get("Card_Category", "Blue")),
                "profile": profile,
            }
        )
    return customers


def get_dataset_stats(df):
    if df is None or df.empty:
        return {
            "totalRecords": 0,
            "existingCustomers": 0,
            "attritedCustomers": 0,
            "attritionRate": 0,
            "avgAge": 0,
            "avgCreditLimit": 0,
            "avgRevolvingBalance": 0,
            "topIncomeBand": "Unknown",
        }

    total_records = int(len(df))
    existing_customers = int((df.get("Attrition_Flag") == "Existing Customer").sum())
    attrited_customers = int((df.get("Attrition_Flag") == "Attrited Customer").sum())
    attrition_rate = round((attrited_customers / total_records) * 100, 2) if total_records else 0

    avg_age = round(safe_float(df.get("Customer_Age", pd.Series([0])).mean(), 0), 2)
    avg_credit_limit = round(safe_float(df.get("Credit_Limit", pd.Series([0])).mean(), 0), 2)
    avg_revolving = round(safe_float(df.get("Total_Revolving_Bal", pd.Series([0])).mean(), 0), 2)

    if "Income_Category" in df.columns and not df["Income_Category"].dropna().empty:
        top_income_band = str(df["Income_Category"].mode().iloc[0])
    else:
        top_income_band = "Unknown"

    return {
        "totalRecords": total_records,
        "existingCustomers": existing_customers,
        "attritedCustomers": attrited_customers,
        "attritionRate": attrition_rate,
        "avgAge": avg_age,
        "avgCreditLimit": avg_credit_limit,
        "avgRevolvingBalance": avg_revolving,
        "topIncomeBand": top_income_band,
    }


models, scaler, encoders, metrics = load_models()
dataset_df = load_dataset()


@app.route("/", methods=["GET"])
def root():
    return jsonify({"service": "VaultPay API", "status": "running"})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


@app.route("/api/stats", methods=["GET"])
def stats():
    return jsonify(get_dataset_stats(dataset_df))


@app.route("/api/sample-customers", methods=["GET"])
def sample_customers():
    customers = build_sample_customers(dataset_df, limit=3)
    return jsonify({"customers": customers})


@app.route("/api/model-info", methods=["GET"])
def model_info():
    metric_map = {
        "Random Forest": metrics.get("RandomForest", {}) if metrics else {},
        "Decision Tree": metrics.get("DecisionTree", {}) if metrics else {},
        "Logistic Regression": metrics.get("LogisticRegression", {}) if metrics else {},
    }

    details = {
        "dataset": "BankChurners.csv",
        "target": "Attrition_Flag mapped to loan stability proxy (Existing=1, Attrited=0)",
        "trainTestSplit": "80/20 with random_state=42",
        "preprocessing": [
            "Selected 8 business-friendly profile features",
            "Label encoding for categorical fields",
            "StandardScaler normalization before model fit",
        ],
        "algorithms": [
            {
                "name": "Random Forest",
                "type": "Ensemble",
                "howTrained": "RandomForestClassifier(n_estimators=100, random_state=42)",
                "accuracy": metric_map["Random Forest"].get("accuracy", 0),
                "mae": metric_map["Random Forest"].get("mae", 0),
                "mse": metric_map["Random Forest"].get("mse", 0),
                "rmse": metric_map["Random Forest"].get("rmse", 0),
                "r2": metric_map["Random Forest"].get("r2", 0),
                "rse": metric_map["Random Forest"].get("rse", 0),
            },
            {
                "name": "Decision Tree",
                "type": "Tree-based",
                "howTrained": "DecisionTreeClassifier(random_state=42)",
                "accuracy": metric_map["Decision Tree"].get("accuracy", 0),
                "mae": metric_map["Decision Tree"].get("mae", 0),
                "mse": metric_map["Decision Tree"].get("mse", 0),
                "rmse": metric_map["Decision Tree"].get("rmse", 0),
                "r2": metric_map["Decision Tree"].get("r2", 0),
                "rse": metric_map["Decision Tree"].get("rse", 0),
            },
            {
                "name": "Logistic Regression",
                "type": "Linear classifier",
                "howTrained": "LogisticRegression(max_iter=1000, random_state=42)",
                "accuracy": metric_map["Logistic Regression"].get("accuracy", 0),
                "mae": metric_map["Logistic Regression"].get("mae", 0),
                "mse": metric_map["Logistic Regression"].get("mse", 0),
                "rmse": metric_map["Logistic Regression"].get("rmse", 0),
                "r2": metric_map["Logistic Regression"].get("r2", 0),
                "rse": metric_map["Logistic Regression"].get("rse", 0),
            },
        ],
        "featureOrder": FEATURE_ORDER,
    }
    return jsonify(details)


@app.route("/api/models/accuracies", methods=["GET"])
def get_accuracies():
    if not metrics:
        return jsonify({"error": "Models not loaded"}), 500

    return jsonify(
        {
            "randomForest": metrics.get("RandomForest", {}),
            "decisionTree": metrics.get("DecisionTree", {}),
            "logisticRegression": metrics.get("LogisticRegression", {}),
        }
    )


@app.route("/api/predict", methods=["POST"])
def predict():
    if not models or not scaler or not encoders:
        return jsonify({"error": "Models not loaded"}), 500

    try:
        data = request.json or {}

        features_dict = {
            "Customer_Age": safe_int(data.get("Customer_Age"), 30),
            "Gender": str(data.get("Gender", "M")),
            "Dependent_count": safe_int(data.get("Dependent_count"), 0),
            "Education_Level": str(data.get("Education_Level", "Graduate")),
            "Marital_Status": str(data.get("Marital_Status", "Single")),
            "Income_Category": str(data.get("Income_Category", "$60K - $80K")),
            "Credit_Limit": safe_int(data.get("Credit_Limit"), 5000),
            "Total_Revolving_Bal": safe_int(data.get("Total_Revolving_Bal"), 500),
            "Total_Trans_Amt": safe_int(data.get("Total_Trans_Amt"), 4000),
            "Total_Trans_Ct": safe_int(data.get("Total_Trans_Ct"), 60),
            "Total_Ct_Chng_Q4_Q1": safe_float(data.get("Total_Ct_Chng_Q4_Q1"), 0.7),
            "Total_Amt_Chng_Q4_Q1": safe_float(data.get("Total_Amt_Chng_Q4_Q1"), 0.7),
            "Avg_Utilization_Ratio": safe_float(data.get("Avg_Utilization_Ratio"), 0.3),
            "Months_on_book": safe_int(data.get("Months_on_book"), 36),
        }

        input_df = pd.DataFrame([features_dict], columns=FEATURE_ORDER)

        for col, encoder in encoders.items():
            if col in input_df.columns:
                safe_values = []
                known_values = set(encoder.classes_)
                for value in input_df[col].astype(str).tolist():
                    safe_values.append(value if value in known_values else encoder.classes_[0])
                input_df[col] = encoder.transform(safe_values)

        scaled = scaler.transform(input_df)

        predictions = {}
        approve_votes = 0
        weighted_sum = 0.0
        weight_total = 0.0

        # Map display names to metrics keys
        metrics_key_map = {
            "Random Forest": "RandomForest",
            "Decision Tree": "DecisionTree",
            "Logistic Regression": "LogisticRegression",
        }

        for model_name, model in models.items():
            pred_class = int(model.predict(scaled)[0])
            approve_prob = float(model.predict_proba(scaled)[0][1])
            verdict = "Approve" if pred_class == 1 else "Reject"
            if pred_class == 1:
                approve_votes += 1

            # Display confidence should reflect the predicted class
            display_confidence = approve_prob if pred_class == 1 else (1.0 - approve_prob)

            # Accumulate accuracy-weighted approve probability
            mk = metrics_key_map.get(model_name, "")
            model_accuracy = metrics.get(mk, {}).get("accuracy", 1.0) if metrics else 1.0
            weighted_sum += model_accuracy * approve_prob
            weight_total += model_accuracy

            predictions[model_name] = {
                "verdict": verdict,
                "confidence": round(display_confidence, 4),
                "approveProb": round(approve_prob, 4),
            }

        # Weighted ensemble confidence score
        composite_confidence = round(weighted_sum / weight_total, 4) if weight_total > 0 else 0.0

        if composite_confidence >= 0.75:
            risk_tier = "Low Risk"
        elif composite_confidence >= 0.50:
            risk_tier = "Medium Risk"
        else:
            risk_tier = "High Risk"

        final_recommendation = "Approve" if approve_votes >= 2 else "Reject"

        return jsonify(
            {
                "success": True,
                "predictions": predictions,
                "finalRecommendation": final_recommendation,
                "approveVotes": approve_votes,
                "compositeConfidence": composite_confidence,
                "riskTier": risk_tier,
                "timestamp": datetime.now().isoformat(),
            }
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5001, host="0.0.0.0")
