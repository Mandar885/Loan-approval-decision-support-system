# VaultPay — ML-Based Loan Approval System
## Complete Project Documentation & Viva Preparation Guide

---

## 1. Project Overview

### 1.1 What is this project?
This is a **Machine Learning-based Loan Approval Decision Support System** for banks. It uses three classification algorithms to predict whether a customer's loan application should be approved or rejected, based on their banking profile and transaction history.

### 1.2 Problem Statement
Banks need to assess the creditworthiness of customers before approving loans. Manual evaluation is slow, inconsistent, and subjective. This project automates the initial screening using ML models trained on historical customer data, while keeping the final decision with a human admin (human-in-the-loop approach).

### 1.3 Tech Stack
| Layer | Technology |
|---|---|
| ML Training | Python, scikit-learn, pandas, numpy |
| Backend API | Flask (Python REST API) |
| Frontend | React.js with Tailwind CSS |
| Model Storage | joblib (.pkl serialization) |
| Dataset | BankChurners.csv (Kaggle) |

### 1.4 System Architecture
```
┌─────────────────┐     HTTP/REST      ┌──────────────────┐
│   React.js      │ ◄──────────────► │   Flask API       │
│   Frontend      │   JSON payloads    │   (backend.py)    │
│                 │                    │                    │
│ - Login Page    │                    │ /api/predict       │
│ - Customer Form │                    │ /api/stats         │
│ - Admin Panel   │                    │ /api/model-info    │
│ - Analytics     │                    │ /api/accuracies    │
└─────────────────┘                    └────────┬───────────┘
                                                │
                                       ┌────────▼───────────┐
                                       │   Model Artifacts   │
                                       │   (models/ folder)  │
                                       │                     │
                                       │ - RandomForest.pkl  │
                                       │ - DecisionTree.pkl  │
                                       │ - LogisticReg.pkl   │
                                       │ - scaler.pkl        │
                                       │ - label_encoders.pkl│
                                       │ - metrics.pkl       │
                                       └─────────────────────┘
```

---

## 2. Dataset

### 2.1 Source
**BankChurners.csv** from Kaggle — originally a credit card customer attrition prediction dataset.

### 2.2 Dataset Statistics
- **Total records**: 10,121
- **Existing Customers**: 8,494 (83.9%)
- **Attrited Customers**: 1,627 (16.1%)
- **Total columns**: 23

### 2.3 Target Variable
We map `Attrition_Flag` to a binary target:
- `Existing Customer` → **1** (Eligible for loan / Approve)
- `Attrited Customer` → **0** (Not eligible / Reject)

**Why this mapping?** Existing customers have stable banking relationships, making them lower-risk borrowers. Attrited (churned) customers indicate instability — a red flag for loan approval.

### 2.4 Features Used (14 out of 23)

#### Profile Features (8) — from the application form
| Feature | Type | Description |
|---|---|---|
| Customer_Age | Numeric | Age of the customer |
| Gender | Categorical | M or F |
| Dependent_count | Numeric | Number of dependents (0–5) |
| Education_Level | Categorical | Uneducated, High School, College, Graduate, Post-Graduate, Doctorate, Unknown |
| Marital_Status | Categorical | Single, Married, Divorced, Unknown |
| Income_Category | Categorical | Less than $40K, $40K–$60K, $60K–$80K, $80K–$120K, $120K+, Unknown |
| Credit_Limit | Numeric | Credit card limit |
| Total_Revolving_Bal | Numeric | Outstanding balance on credit card |

#### Behavioral Features (6) — from bank records (these boosted accuracy from ~83% to ~95%)
| Feature | Type | Description |
|---|---|---|
| Total_Trans_Amt | Numeric | Total transaction amount in last 12 months |
| Total_Trans_Ct | Numeric | Total transaction count in last 12 months |
| Total_Ct_Chng_Q4_Q1 | Numeric | Change in transaction count (Q4 vs Q1) |
| Total_Amt_Chng_Q4_Q1 | Numeric | Change in transaction amount (Q4 vs Q1) |
| Avg_Utilization_Ratio | Numeric | Average credit utilization (0 to 1) |
| Months_on_book | Numeric | How long the customer has been with the bank |

### 2.5 Dropped Columns
- `CLIENTNUM` — unique identifier, no predictive value
- Two `Naive_Bayes_Classifier_*` columns — pre-computed by Kaggle, not actual features

---

## 3. Data Preprocessing

### 3.1 Label Encoding
Categorical features (Gender, Education_Level, Marital_Status, Income_Category) are converted to numbers using **LabelEncoder** from scikit-learn.

Example: `Gender: M → 1, F → 0`

**Why Label Encoding and not One-Hot?**
- Label encoding works well with tree-based models (Random Forest, Decision Tree) which can handle ordinal numbers
- One-hot encoding would increase dimensionality significantly (e.g., Income_Category alone has 6 values → 6 new columns)

### 3.2 Feature Scaling (StandardScaler)
All features are normalized using **StandardScaler**:
```
z = (x - μ) / σ
```
Where μ = mean, σ = standard deviation. This transforms features to have mean=0 and std=1.

**Why scaling?**
- Logistic Regression uses gradient descent — features on different scales (Age: 18–70, Credit_Limit: 1000–40000) would cause the optimizer to converge slowly
- Random Forest and Decision Tree don't technically need scaling, but applying it uniformly ensures consistency

### 3.3 Train-Test Split
- **80% training** (8,096 records)
- **20% testing** (2,025 records)
- `random_state=42` for reproducibility

---

## 4. Machine Learning Models

### 4.1 Random Forest Classifier
**Type**: Ensemble (Bagging)

**How it works**:
1. Creates 200 independent decision trees (n_estimators=200)
2. Each tree is trained on a random subset of data (bootstrap sampling)
3. Each tree also considers a random subset of features at each split
4. Final prediction = majority vote across all 200 trees

**Hyperparameters used**:
- `n_estimators=200` — 200 trees in the forest
- `max_depth=15` — each tree can go 15 levels deep max
- `min_samples_split=5` — need at least 5 samples to split a node
- `min_samples_leaf=2` — each leaf must have at least 2 samples

**Why these hyperparameters?**
- `max_depth=15` prevents overfitting (unlimited depth memorizes noise)
- `min_samples_leaf=2` ensures no leaf is based on a single outlier

**Performance**: **95.21% accuracy**, F1: 0.972

### 4.2 Decision Tree Classifier
**Type**: Tree-based (single tree)

**How it works**:
1. Starts at the root with all data
2. Selects the best feature and threshold to split (using Gini impurity by default)
3. Recursively splits until stopping criteria are met
4. Each leaf node holds a class prediction

**Gini Impurity formula**:
```
Gini(S) = 1 - Σ(pᵢ²)
```
Where pᵢ is the proportion of class i in the set. Lower Gini = purer node.

**Hyperparameters used**:
- `max_depth=10` — shallower than Random Forest (single tree overfits more easily)
- `min_samples_split=10` — more conservative splitting
- `min_samples_leaf=5` — larger minimum leaf size

**Performance**: **94.07% accuracy**, F1: 0.965

### 4.3 Logistic Regression
**Type**: Linear classifier (NOT a regression model despite the name!)

**How it works**:
1. Computes a weighted sum: z = w₁x₁ + w₂x₂ + ... + wₙxₙ + b
2. Passes through the **sigmoid function**: σ(z) = 1 / (1 + e⁻ᶻ)
3. Output is a probability between 0 and 1
4. If probability ≥ 0.5 → class 1 (Approve), else class 0 (Reject)

**Why it's called "Regression"**:
It regresses to find the probability, but the final output is a classification. The "regression" refers to the underlying technique of fitting a logistic curve, not to predicting continuous values.

**Hyperparameters used**:
- `max_iter=1000` — maximum iterations for the optimizer to converge

**Performance**: **88.44% accuracy**, F1: 0.933

**Why lower than tree-based models?**
Logistic Regression is a **linear classifier** — it draws a straight line (hyperplane) to separate classes. If the relationship between features and the target is non-linear (which it is here), tree-based models capture it better.

---

## 5. Evaluation Metrics

### 5.1 Current Results

| Metric | Random Forest | Decision Tree | Logistic Regression |
|---|---|---|---|
| **Accuracy** | 95.21% | 94.07% | 88.44% |
| **F1 Score** | 0.9720 | 0.9650 | 0.9334 |
| **MAE** | 0.0479 | 0.0593 | 0.1156 |
| **MSE** | 0.0479 | 0.0593 | 0.1156 |
| **RMSE** | 0.2189 | 0.2434 | 0.3399 |
| **R² Score** | 0.6325 | 0.5453 | 0.1134 |
| **RSE** | 0.3675 | 0.4547 | 0.8866 |

### 5.2 Metric Definitions

#### Classification Metrics (Primary — since this is classification)

**Accuracy** = (TP + TN) / (TP + TN + FP + FN)
- Percentage of correct predictions out of all predictions
- Simple but can be misleading with imbalanced datasets

**Precision** = TP / (TP + FP)
- Of everyone the model said "Approve", how many were actually correct?
- High precision = fewer false approvals

**Recall (Sensitivity)** = TP / (TP + FN)
- Of all truly eligible customers, how many did the model correctly identify?
- High recall = fewer missed eligible customers

**F1 Score** = 2 × (Precision × Recall) / (Precision + Recall)
- Harmonic mean of precision and recall
- Better than accuracy when classes are imbalanced
- Range: 0 to 1 (1 is perfect)

Where:
- **TP** (True Positive) = Model said Approve, actually Approve
- **TN** (True Negative) = Model said Reject, actually Reject
- **FP** (False Positive) = Model said Approve, actually Reject (BAD for banks — risky loans approved)
- **FN** (False Negative) = Model said Reject, actually Approve (missed business opportunity)

#### Error/Regression Metrics (Applied to binary 0/1 outputs for demonstration)

**MAE (Mean Absolute Error)** = (1/n) × Σ|yᵢ - ŷᵢ|
- Average absolute difference between predicted and actual values
- For binary classification: MAE = 1 - Accuracy
- Our MAE of 0.0479 (RF) means on average we're off by 0.0479

**MSE (Mean Squared Error)** = (1/n) × Σ(yᵢ - ŷᵢ)²
- Average squared difference. Penalizes larger errors more heavily
- For binary (0/1) outputs: MSE = MAE (since 0² = 0 and 1² = 1)

**RMSE (Root Mean Squared Error)** = √MSE
- Square root of MSE, brings it back to the original scale
- More interpretable than MSE
- Lower is better

**R² Score (Coefficient of Determination)** = 1 - (SS_res / SS_tot)
- Where SS_res = Σ(yᵢ - ŷᵢ)² and SS_tot = Σ(yᵢ - ȳ)²
- Measures how much better the model is than always predicting the mean
- Range: -∞ to 1 (1 is perfect, 0 = same as predicting mean)
- Our R² of 0.6325 (RF) means the model explains 63.25% of the variance

**RSE (Relative Squared Error)** = SS_res / SS_tot = 1 - R²
- The complement of R²
- Lower is better (0 = perfect)

> **Important note**: MAE, MSE, RMSE, R², RSE are **regression metrics** applied here to binary classification outputs. In a pure classification project, F1, Precision, Recall, and AUC-ROC would be more conventional. We include regression metrics for academic completeness.

---

## 6. Weighted Ensemble Confidence Score

### 6.1 What is it?
Instead of showing 3 separate model verdicts to the admin, we compute a **single composite confidence score** that aggregates all 3 models, weighted by their test accuracy.

### 6.2 Formula
```
Composite Score = (Acc_RF × Prob_RF + Acc_DT × Prob_DT + Acc_LR × Prob_LR) / (Acc_RF + Acc_DT + Acc_LR)
```

Where:
- `Acc_RF` = Random Forest accuracy (0.9521)
- `Prob_RF` = Random Forest's probability of approval for this specific customer
- Same for DT and LR

### 6.3 Why accuracy-weighted?
A model with higher accuracy should have more influence on the final score. Random Forest (95.21%) contributes more than Logistic Regression (88.44%) to the final decision.

### 6.4 Risk Tiers
| Composite Score | Risk Tier | Suggested Action |
|---|---|---|
| ≥ 75% | **Low Risk** (Green) | Strong candidate — likely approve |
| 50% – 74% | **Medium Risk** (Amber) | Needs careful human review |
| < 50% | **High Risk** (Red) | Lean toward rejection |

### 6.5 Majority Voting
Additionally, the system uses **majority voting** — if 2 out of 3 models say "Approve", the recommendation is "Approve". This provides a second layer of consensus.

---

## 7. Code Walkthrough

### 7.1 train.py — Model Training Pipeline
```
Load CSV → Drop irrelevant columns → Create target variable → Select 14 features
→ Label encode categoricals → Train/Test split (80/20) → StandardScaler
→ Train 3 models → Compute 7 metrics each → Save everything to .pkl files
```

### 7.2 backend.py — Flask REST API
- **`/api/predict` (POST)** — accepts customer features, runs all 3 models, returns verdicts + composite confidence score
- **`/api/stats` (GET)** — dataset statistics (total records, attrition rate, etc.)
- **`/api/model-info` (GET)** — training configuration and per-model metrics
- **`/api/models/accuracies` (GET)** — all error metrics for each model
- **`/api/sample-customers` (GET)** — sample profiles from the CSV for quick testing

### 7.3 Frontend — React SPA
- **LoginPage** — role selection (Customer or Admin) with sample customer quick login
- **CustomerDashboard** — loan application form with all 14 features, application tracker
- **AdminDashboard** — underwriting queue, model verdict panel with composite confidence score, analytics tab with all metrics, training info tab

---

## 8. How a Prediction Works (End-to-End Flow)

```
1. Customer fills the form (14 fields) → clicks "Submit to Underwriting"
2. Application stored in React state with status "Pending"
3. Admin sees it in the underwriting queue
4. Admin clicks "Run Model Assistance"
5. Frontend sends POST /api/predict with the 14 features
6. Backend:
   a. Builds a DataFrame with the features
   b. Label-encodes categorical values using saved encoders
   c. Scales values using saved StandardScaler
   d. Runs scaled input through all 3 models
   e. Each model returns: prediction (0/1) + probability
   f. Computes weighted ensemble confidence score
   g. Determines risk tier and majority vote
7. Response sent back with all verdicts + composite score
8. Admin sees the composite score hero card + individual model cards
9. Admin makes final human decision (Approve/Reject) with a note
```

---

## 9. Key Design Decisions

| Decision | Reason |
|---|---|
| **3 models instead of 1** | Provides consensus; no single model can fool the admin |
| **Human-in-the-loop** | ML assists but doesn't auto-decide — regulatory requirement in banking |
| **Weighted ensemble** | More accurate models get more voting power |
| **14 features** (not all 23) | Dropped irrelevant columns (CLIENTNUM, Naive Bayes pre-computed columns) |
| **Label Encoding** (not One-Hot) | Works well with tree-based models, keeps dimensionality low |
| **StandardScaler** (not MinMaxScaler) | Better for Logistic Regression which assumes normally distributed features |
| **80/20 split** | Standard practice; enough test data (2,025 records) for reliable evaluation |
| **random_state=42** | Ensures reproducibility — same split every time |

---

## 10. Viva Questions & Answers

### Category A: Project Understanding

**Q1: What is the objective of this project?**
A: To build an ML-based Decision Support System that helps bank admins approve or reject loan applications. Three classification models analyze customer profiles and provide confidence scores, but the final decision remains with the human admin.

**Q2: Why did you use the BankChurners dataset for a loan approval system?**
A: The BankChurners dataset contains rich customer banking profiles (age, income, credit limit, transaction history, utilization ratios) which directly correlate with creditworthiness. Existing customers (stable relationships) are mapped to "loan-eligible", while attrited customers (unstable) are mapped to "not eligible". The features used are the same ones banks evaluate for real loan decisions.

**Q3: What is the real-world application of this project?**
A: Banks can use this system for initial loan screening. The model filters applicants into risk categories, allowing human underwriters to focus on borderline cases instead of reviewing every application manually. This reduces processing time and brings consistency to decisions.

**Q4: Why three models instead of just one?**
A: Using multiple models provides **ensemble consensus**. If all 3 agree, the admin can be more confident. If they disagree, it flags the application for careful human review. No single model is 100% reliable — combining them reduces individual model weaknesses.

**Q5: What is human-in-the-loop and why is it important here?**
A: Human-in-the-loop means the ML model **assists** but does not **make** the final decision. In banking, this is critical because:
- Regulatory compliance requires human accountability for lending decisions
- ML models can have biases the admin should override
- Edge cases (unusual customer profiles) may need human judgment

---

### Category B: Dataset & Preprocessing

**Q6: How many records are in your dataset and what is the class distribution?**
A: 10,121 records. Existing Customers: 8,494 (83.9%), Attrited Customers: 1,627 (16.1%). The dataset is **imbalanced** — there are 5× more existing than attrited customers.

**Q7: Is your dataset imbalanced? How does it affect the model?**
A: Yes, it's imbalanced (84% vs 16%). This means:
- A model that always predicts "Existing" would get 84% accuracy without learning anything
- That's why F1 Score is more important than accuracy — it accounts for both precision and recall
- Our F1 of 0.972 (RF) confirms the model genuinely learned the patterns, not just the majority class

**Q8: What is Label Encoding? Why not One-Hot Encoding?**
A: **Label Encoding** assigns each category a unique integer (e.g., M=1, F=0). **One-Hot Encoding** creates a separate binary column for each category.
We used Label Encoding because:
- Tree-based models (RF, DT) handle ordinal numbers fine
- One-Hot would increase dimensionality (e.g., Education has 7 values → 7 columns)
- With 14 features, we want to keep the model simple

**Q9: What is StandardScaler and why is it needed?**
A: StandardScaler transforms features to have mean=0 and standard deviation=1 using the formula: z = (x - μ) / σ. It's needed because:
- Features are on vastly different scales (Age: 18–70 vs Credit_Limit: 1,000–40,000)
- Logistic Regression uses gradient descent — unscaled features cause slow convergence
- It ensures no feature dominates simply because of larger numeric range

**Q10: Why did you drop the CLIENTNUM column?**
A: CLIENTNUM is a unique customer identifier (like a bank account number). It has no predictive power — it's just an ID. Including it would cause the model to memorize specific customers rather than learning general patterns.

**Q11: What is train-test split and why 80/20?**
A: We divide data into training (80%) and testing (20%) sets. The model learns from training data and is evaluated on unseen test data to check if it generalizes well. 80/20 is a standard split that provides enough data for both learning (8,096 records) and reliable evaluation (2,025 records).

**Q12: What is random_state=42 and why is it used?**
A: `random_state` is a seed for the random number generator. Setting it to 42 (or any fixed number) ensures the train-test split is identical every time we run the code. This makes results **reproducible** — essential for debugging and comparing experiments.

---

### Category C: Machine Learning Algorithms

**Q13: Explain how Random Forest works.**
A: Random Forest is a **bagging ensemble** method:
1. It creates N decision trees (we use 200)
2. Each tree is trained on a **bootstrap sample** (random subset with replacement) of the data
3. At each split, only a random subset of features is considered
4. For prediction, all 200 trees vote — the majority class wins
5. This **randomness** reduces overfitting and improves generalization

**Q14: What is bagging? How is it different from boosting?**
A: **Bagging** (Bootstrap Aggregating) trains multiple models independently on different data samples and averages/votes. Random Forest uses bagging.
**Boosting** trains models sequentially — each new model focuses on correcting the errors of previous models. XGBoost uses boosting.
Key difference: Bagging reduces **variance** (overfitting), Boosting reduces **bias** (underfitting).

**Q15: What is Gini Impurity in Decision Tree?**
A: Gini Impurity measures how "mixed" a node is. Formula: Gini = 1 - Σ(pᵢ²)
- Pure node (all same class): Gini = 0
- Maximally mixed (50/50): Gini = 0.5
The tree picks the feature and threshold that gives the **biggest reduction** in Gini at each split.

**Q16: What is the difference between Gini Impurity and Entropy?**
A: Both measure node purity.
- **Gini** = 1 - Σ(pᵢ²) — computationally simpler
- **Entropy** = -Σ(pᵢ × log₂(pᵢ)) — from information theory
Gini tends to isolate the most frequent class in its own branch. Entropy tends to produce more balanced trees. In practice, they produce very similar results.

**Q17: Is Logistic Regression actually a regression algorithm?**
A: **No!** Despite the name, Logistic Regression is a **classification** algorithm. The "regression" refers to the underlying technique — it fits a logistic (sigmoid) curve. The output of the sigmoid function is a probability (0 to 1), which is then thresholded at 0.5 to classify.

**Q18: What is the sigmoid function? Write its formula.**
A: σ(z) = 1 / (1 + e⁻ᶻ)
- Takes any real number z and maps it to (0, 1)
- At z=0, σ = 0.5 (decision boundary)
- As z → +∞, σ → 1
- As z → -∞, σ → 0
It's the core of Logistic Regression — converts the linear combination of features into a probability.

**Q19: Why is Logistic Regression less accurate than Random Forest here?**
A: Logistic Regression is a **linear classifier** — it draws a straight hyperplane to separate classes. The relationship between features and loan eligibility is **non-linear** (e.g., income alone doesn't decide eligibility — it interacts with age, credit limit, utilization ratio in complex ways). Tree-based models capture these non-linear interactions naturally through their branching structure.

**Q20: What is overfitting? How did you prevent it?**
A: Overfitting = model memorizes training data (including noise) and performs poorly on new data.
We prevented it by:
- **max_depth=15 (RF), 10 (DT)** — limits tree complexity
- **min_samples_split=5/10** — requires minimum samples to split
- **min_samples_leaf=2/5** — minimum samples in each leaf
- **Random Forest itself** — averaging 200 trees reduces variance
- **Train-test split** — evaluating on unseen data catches overfitting

**Q21: What is underfitting?**
A: Underfitting = model is too simple to capture patterns in the data, performs poorly on BOTH training and test data. Example: using a single feature when 14 are needed. Our Logistic Regression (88.4%) slightly underfits compared to tree models because it can't capture non-linear relationships.

---

### Category D: Evaluation Metrics

**Q22: What is the difference between Accuracy and F1 Score? When to use which?**
A: **Accuracy** = total correct / total predictions. Good for balanced datasets.
**F1 Score** = harmonic mean of Precision and Recall. Better for imbalanced datasets.
Example: With 84% existing customers, a model that always predicts "Existing" gets 84% accuracy but 0% recall for attrited customers. F1 would be low, exposing this flaw.

**Q23: Explain Precision vs Recall in the context of loan approval.**
A:
- **Precision**: "Of all customers we approved, how many were actually creditworthy?" High precision = fewer bad loans approved (bank's perspective — financial safety).
- **Recall**: "Of all creditworthy customers, how many did we correctly approve?" High recall = fewer good customers wrongly rejected (customer satisfaction).
- Banks usually prioritize **precision** (don't approve bad loans) over recall.

**Q24: Why is MAE equal to MSE in your results?**
A: Because our target is binary (0 or 1). The error for each prediction is either 0 (correct) or 1 (wrong). Since 1² = 1 and 0² = 0, squaring doesn't change anything. Hence MAE = MSE for binary classification.

**Q25: What does R² Score mean in your project?**
A: R² = 0.6325 (RF) means the model explains 63.25% of the variance in the data compared to simply predicting the mean. While R² is traditionally for regression, applying it here tells us how much better the model is than a "dumb" baseline that always predicts the majority class probability.

**Q26: What does RMSE represent?**
A: RMSE = √MSE. For our RF model, RMSE = 0.2189. This means the average prediction error is about 0.22 in magnitude. Since predictions are 0 or 1, a lower RMSE indicates fewer misclassifications.

**Q27: What is RSE and how is it related to R²?**
A: RSE (Relative Squared Error) = 1 - R². If R² = 0.6325, then RSE = 0.3675. RSE measures the proportion of error the model still makes relative to the baseline. Lower RSE = better model.

---

### Category E: Feature Engineering & Selection

**Q28: Which features are most important for the prediction?**
A: Based on tree importance:
1. **Total_Trans_Ct** (transaction count) — most important by far
2. **Total_Trans_Amt** (transaction amount)
3. **Total_Ct_Chng_Q4_Q1** (change in transactions over time)
4. **Avg_Utilization_Ratio**
5. **Credit_Limit**

Transaction behavior predicts churn/loyalty much better than demographics like age or gender.

**Q29: How did adding behavioral features improve accuracy?**
A: We went from 8 profile features (83.5% accuracy) to 14 features including behavioral data (95.2% accuracy) — a **12% improvement**. This is because demographic features (age, gender, education) have weak correlation with loan eligibility, while **banking behavior** (how often you transact, how much you use credit) is a direct indicator of financial health.

**Q30: Should you include CIBIL Score?**
A: Yes, in a real-world system, CIBIL/credit score is the **most important** predictor for loan approval. This dataset doesn't include it. However, `Avg_Utilization_Ratio` and `Credit_Limit` serve as rough proxies for creditworthiness.

---

### Category F: System Design & Architecture

**Q31: Why Flask and not Django?**
A: Flask is **lightweight** — we only need a REST API, not a full web framework with ORM, admin panel, template engine (which Django provides). Flask gives us just enough to create endpoints and serve predictions.

**Q32: What is a REST API?**
A: REST (Representational State Transfer) API uses HTTP methods to communicate:
- **GET** — retrieve data (e.g., /api/stats)
- **POST** — send data for processing (e.g., /api/predict)
The frontend and backend are decoupled — they communicate via JSON payloads.

**Q33: What is CORS and why do you need it?**
A: CORS (Cross-Origin Resource Sharing) — browsers block requests from one origin (localhost:3000 - React) to another (localhost:5001 - Flask) by default for security. `flask-cors` allows our frontend to communicate with the backend.

**Q34: Why did you save models as .pkl files?**
A: `.pkl` (pickle) files serialize Python objects to disk using `joblib`. This means:
- We train once and save the model
- The backend loads the pre-trained model at startup
- Predictions are instant (no retraining needed)
- `joblib` is more efficient than `pickle` for large numpy arrays (model weights)

**Q35: What is the Weighted Ensemble Confidence Score?**
A: A single composite score aggregating all 3 models:
```
Score = (AccRF × ProbRF + AccDT × ProbDT + AccLR × ProbLR) / (AccRF + AccDT + AccLR)
```
Models with higher accuracy contribute more. This gives the admin one clear number instead of juggling 3 separate verdicts.

**Q36: What is the difference between predict() and predict_proba()?**
A:
- `predict()` returns the class label (0 or 1)
- `predict_proba()` returns the probability for each class [P(class 0), P(class 1)]
We use `predict_proba` to get **confidence scores** — "I'm 92% confident this is an approval" is more useful than just "Approve".

---

### Category G: Advanced/Challenging Questions

**Q37: What is the bias-variance tradeoff?**
A:
- **Bias** = error from oversimplifying (underfitting). High bias → model misses patterns.
- **Variance** = error from being overly complex (overfitting). High variance → model is too sensitive to training data.
- **Tradeoff**: Reducing one often increases the other. Random Forest has low bias AND low variance (sweet spot). Decision Tree has low bias but high variance. Logistic Regression has high bias but low variance.

**Q38: How would you handle if the dataset was heavily imbalanced (99% vs 1%)?**
A: Several techniques:
- **SMOTE** (Synthetic Minority Over-sampling) — generate synthetic samples of the minority class
- **Class weights** — tell the model to penalize minority-class errors more (`class_weight='balanced'`)
- **Undersampling** — reduce majority class samples
- **Evaluation metric** — use F1/AUC-ROC instead of accuracy

**Q39: What is cross-validation? Why didn't you use it?**
A: Cross-validation (e.g., 5-fold) splits data into 5 parts, trains on 4 and tests on 1, rotating 5 times. Gives a more robust accuracy estimate.
We used a simple train-test split for simplicity, but cross-validation would be better for a production system. Example: `cross_val_score(model, X, y, cv=5)`.

**Q40: What is AUC-ROC? Why is it useful?**
A: AUC = Area Under the ROC Curve. ROC plots True Positive Rate vs False Positive Rate at various thresholds.
- AUC = 1.0 → perfect model
- AUC = 0.5 → random guessing
- It's threshold-independent (unlike accuracy which uses 0.5)
- Especially useful for imbalanced datasets

**Q41: Could you improve the model further?**
A: Yes:
1. **XGBoost/Gradient Boosting** — often beats Random Forest
2. **Hyperparameter tuning with GridSearchCV** — systematically test all parameter combinations
3. **Feature engineering** — create new features like debt-to-income ratio
4. **Cross-validation** — more robust evaluation
5. **Include more features** — Total_Relationship_Count, Months_Inactive_12_mon
6. **SMOTE** — address class imbalance

**Q42: Why didn't you use a Neural Network / Deep Learning?**
A: For tabular data with 10K records:
- Tree-based models (RF, XGBoost) consistently **outperform** neural networks on structured/tabular data
- Neural networks need much more data (100K+) to shine
- Neural networks are "black boxes" — for banking we need **interpretability** (why did the model reject this customer?)
- Training and deployment is much simpler with scikit-learn

**Q43: What is the curse of dimensionality?**
A: As the number of features increases, the data becomes sparse in high-dimensional space. Models need exponentially more data to learn patterns. This is why we selected 14 features instead of using all 23 — dropping irrelevant columns improves performance.

**Q44: Explain the difference between supervised and unsupervised learning. Which does your project use?**
A: **Supervised learning** = we have labeled data (input-output pairs). The model learns to map inputs to known outputs. Our project uses supervised learning — we know the target (Existing/Attrited).
**Unsupervised learning** = no labels. The model finds hidden patterns/groups. Example: clustering customers into segments.

**Q45: What happens if a new customer has a feature value the model hasn't seen?**
A: Our code handles this in the encoding step:
```python
safe_values.append(value if value in known_values else encoder.classes_[0])
```
If an unseen category value is encountered (e.g., a new Education_Level), it falls back to the first known category. This prevents crashes but may affect prediction quality.

---

### Category H: Practical & Deployment Questions

**Q46: How would you deploy this to production?**
A: 
1. **Backend**: Deploy Flask API on AWS EC2 / Google Cloud Run / Heroku
2. **Frontend**: Build React app (`npm run build`) and host on Netlify/Vercel
3. **Models**: Store .pkl files in cloud storage (S3) or bundle with the API
4. **Database**: Replace in-memory application state with PostgreSQL/MongoDB
5. **Security**: Add authentication (JWT tokens), input validation, rate limiting

**Q47: What are the limitations of your project?**
A:
1. Applications are stored in memory — lost on page refresh
2. No real authentication system (just role selection)
3. Dataset is from credit card attrition, not actual loan applications
4. No CIBIL/credit score feature
5. No model retraining pipeline — models are trained once
6. No explainability (e.g., SHAP values to explain WHY a model rejected someone)

**Q48: What is model explainability and why is it important in banking?**
A: Explainability means being able to tell the customer **why** their loan was rejected. Regulations (like GDPR's "right to explanation") may require this. Tools like **SHAP** (Shapley Additive Explanations) can show which features contributed most to each individual prediction. For example: "Your loan was rejected primarily because your transaction count dropped 40% in Q4."

**Q49: How would you retrain the model with new data?**
A: 
1. Append new customer records to BankChurners.csv
2. Run `python train.py` — it retrains all 3 models and saves new .pkl files
3. Restart the Flask backend to load updated models
In production, this would be automated with a CI/CD pipeline or scheduled job.

**Q50: What ethical considerations exist for this system?**
A:
- **Bias**: If historical data has racial/gender bias, the model will learn it. We should audit for disparate impact.
- **Transparency**: Customers deserve to know they're being evaluated by AI.
- **Fairness**: The model should not use protected attributes (race, religion) — our features are financial/behavioral which is appropriate.
- **Accountability**: A human makes the final decision, not the AI — this is the correct approach for high-stakes financial decisions.

---

## 11. Libraries Used

| Library | Version | Purpose |
|---|---|---|
| pandas | Latest | Data manipulation and CSV reading |
| numpy | Latest | Numerical computations |
| scikit-learn | Latest | ML models, preprocessing, metrics |
| joblib | Latest | Model serialization (save/load .pkl) |
| Flask | Latest | REST API backend |
| flask-cors | Latest | Cross-origin request handling |
| React | 18+ | Frontend UI framework |
| axios | Latest | HTTP client for API calls |
| Tailwind CSS | 3+ | Utility-first CSS framework |

---

## 12. How to Run the Project

```bash
# 1. Train the models
python train.py

# 2. Start the backend
python backend.py
# Backend runs on http://localhost:5001

# 3. Start the frontend (in a separate terminal)
cd frontend
npm install
npm start
# Frontend runs on http://localhost:3000
```

---

*Document prepared for VaultPay ML Loan Approval System — April 2026*
