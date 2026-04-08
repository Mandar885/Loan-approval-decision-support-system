# Weighted Ensemble Confidence Score + Full Bug Analysis

## Goal

1. **Add a single composite confidence score** that aggregates the predictions of all 3 models (Random Forest, Decision Tree, Logistic Regression), weighted by their test accuracy, so the admin sees one clear number to help decide approve/reject.
2. **Fix all identified bugs** across the codebase.

---

## 1. Confidence Score Design

### How It Works

Each model already returns a `predict_proba` confidence (probability the customer is class 1 = "Approve"). The composite score uses **accuracy-weighted averaging**:

```
composite = (acc_RF × conf_RF  +  acc_DT × conf_DT  +  acc_LR × conf_LR)
            ÷ (acc_RF + acc_DT + acc_LR)
```

This gives more weight to the model that performs best on the test set. The result is a single **0–100%** score displayed on the admin panel with a risk tier:

| Range | Tier | Color |
|---|---|---|
| ≥ 75% | Low Risk — Strong Approve | Emerald |
| 50–74% | Medium Risk — Review Carefully | Amber |
| < 50% | High Risk — Lean Reject | Rose |

### Where It Changes

#### [MODIFY] [backend.py](file:///d:/Web%20development/ML_Project/backend.py)
- In `/api/predict`: compute the weighted confidence score using model accuracies from `metrics.pkl`.
- Return `compositeConfidence` (0-1 float) and `riskTier` (string) in the response.

#### [MODIFY] [AdminDashboard.jsx](file:///d:/Web%20development/ML_Project/frontend/src/pages/AdminDashboard.jsx)
- Show a prominent "Composite Confidence Score" card below the 3 model verdict cards.
- Include a color-coded risk tier badge and a visual progress bar.
- Display all error metrics (MAE, MSE, RMSE, R², RSE) that are already being served but **not yet shown** in the Analytics tab.

---

## 2. Bug Analysis

### Backend — `backend.py`

| # | Severity | Bug | Fix |
|---|---|---|---|
| B1 | ⚠️ Medium | **Unused import**: `sklearn.metrics` (MAE, MSE, R2) imported at module level but never used at runtime — the backend only serves pre-computed metrics from `metrics.pkl`. | Remove the import. |
| B2 | ⚠️ Medium | **Confidence bar direction is wrong**: the per-model confidence shows `predict_proba[0][1]` which is the probability of class 1 (approve). When the model predicts "Reject", the bar still shows the approve-probability — so a "Reject" with 15% confidence looks weak, but really the reject-confidence is 85%. | Return both `approveConfidence` and display `rejectConfidence` (1 − approveConf) when verdict is "Reject". |
| B3 | 🔴 High | **Silent default values mask bad input**: if a customer sends `Customer_Age: "abc"`, `safe_int` silently falls back to `30`. The admin never knows the data was invalid. | Add a `warnings` list to the prediction response when defaults are used. |
| B4 | 🟡 Low | **No input validation for numeric ranges**: Credit_Limit and Total_Revolving_Bal accept any integer including negatives. | Add min/max guards. |

### Training Script — `train.py`

| # | Severity | Bug | Fix |
|---|---|---|---|
| T1 | 🟡 Low | **SettingWithCopyWarning risk**: `X = df[selected_features]` creates a view, then `.loc` writes to it. Can be fragile. | Use `X = df[selected_features].copy()`. |
| T2 | 🟡 Low | **Blank lines (89-91) inside the loop** add dead whitespace — cosmetic but messy. | Clean up. |

### Frontend — React App

| # | Severity | Bug | Fix |
|---|---|---|---|
| F1 | 🔴 High | **Analytics tab doesn't show MAE, MSE, R² metrics** even though the backend now serves them. The API returns these fields but only Accuracy, F1, RMSE, RSE are rendered. | Add display rows for MAE, MSE, R². |
| F2 | ⚠️ Medium | **Model Training Info tab only shows Accuracy** — ignoring all the extra error metrics now served by `/api/model-info`. | Display the full metric set per algorithm card. |
| F3 | ⚠️ Medium | **No loading/error states** for the initial data fetch in `App.jsx`. If the backend is down, the user sees a blank login page with no feedback. | Add a simple connection-error banner. |
| F4 | ⚠️ Medium | **Application state is in-memory only** (React `useState`). Refreshing the page loses all applications. | Out of scope for now, but worth noting. Suggest `localStorage` persistence. |
| F5 | 🟡 Low | **Success message in CustomerDashboard never clears** — persists even after navigating tabs. | Clear it on tab switch. |
| F6 | 🟡 Low | **`decisionNote` state in AdminDashboard doesn't sync** when switching between pending apps. | Load `app.decisionNote` when selecting a different app. |

### Legacy Streamlit App — `app.py`

| # | Severity | Bug | Fix |
|---|---|---|---|
| S1 | ⚠️ Medium | **Loads `accuracies.pkl` (old format)** instead of `metrics.pkl` (new format with full metrics). Will show only scalar accuracy values or crash if the file format changed. | Out of scope — this file appears to be the old UI before the React migration. |

---

## Proposed Changes (Scope)

I will implement:
1. ✅ Weighted composite confidence score in the backend predict endpoint
2. ✅ Composite confidence panel in AdminDashboard
3. ✅ Display all error metrics (MAE, MSE, RMSE, R², RSE) in Analytics + Training tabs
4. ✅ Fix confidence bar direction (B2)
5. ✅ Fix bugs T1, T2, F1, F2, F5, F6
6. ✅ Remove unused import (B1)

> [!IMPORTANT]
> Bugs B3 (silent defaults), B4 (range validation), F3 (loading states), and F4 (persistence) are real issues but more extensive. Should I include them in this round?

## Verification Plan

### Manual Verification
- Re-train models with `python train.py`
- Start backend with `python backend.py`
- Start frontend with `npm run dev`
- Submit a loan application as customer → switch to admin → run model assistance → verify composite score appears with correct risk tier
- Check Analytics tab shows all 7 metrics per model
- Check Training Info tab shows full metrics per algorithm card
