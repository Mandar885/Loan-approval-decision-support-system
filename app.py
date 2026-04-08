import streamlit as st
import pandas as pd
import joblib
import uuid
from datetime import datetime
import os

st.set_page_config(
    page_title="VaultPay | Loan Studio",
    layout="wide",
    initial_sidebar_state="collapsed",
)

st.markdown(
    """
<style>
:root {
    --bg: #f3f5f9;
    --panel: #ffffff;
    --text: #0f172a;
    --muted: #64748b;
    --border: #e2e8f0;
    --ring: #cbd5e1;
}

.stApp {
    background:
        radial-gradient(1200px 600px at -10% -20%, #dbeafe 0%, transparent 45%),
        radial-gradient(900px 500px at 110% 0%, #e0e7ff 0%, transparent 45%),
        var(--bg);
}

.block-container {
    max-width: 1180px;
    padding-top: 1.1rem;
    padding-bottom: 2rem;
}

.top-shell {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 16px;
    border: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.72);
    backdrop-filter: blur(6px);
}

.brand-title {
    margin: 0;
    color: var(--text);
    font-size: 1.04rem;
    font-weight: 800;
    letter-spacing: -0.01em;
}

.brand-subtitle {
    margin: 0.1rem 0 0 0;
    color: var(--muted);
    font-size: 0.82rem;
}

.hero {
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.2rem;
    margin-bottom: 1rem;
    background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.hero-title {
    margin: 0;
    color: var(--text);
    font-size: 2rem;
    font-weight: 850;
    letter-spacing: -0.03em;
}

.hero-copy {
    margin-top: 0.45rem;
    color: var(--muted);
    max-width: 780px;
}

.role-card {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    min-height: 176px;
    padding: 1rem;
}

.role-title {
    margin: 0;
    color: var(--text);
    font-size: 1.06rem;
    font-weight: 750;
}

.role-copy {
    margin-top: 0.45rem;
    color: var(--muted);
    font-size: 0.92rem;
}

.page-title {
    margin: 0.2rem 0 0 0;
    color: var(--text);
    font-size: 1.58rem;
    font-weight: 850;
    letter-spacing: -0.02em;
}

.page-subtitle {
    margin-top: 0.3rem;
    color: var(--muted);
}

.metric-card {
    border: 1px solid var(--border);
    border-radius: 14px;
    background: var(--panel);
    padding: 0.9rem 1rem;
}

.metric-title {
    color: var(--muted);
    font-size: 0.76rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.metric-value {
    margin-top: 0.2rem;
    color: var(--text);
    font-size: 1.46rem;
    font-weight: 800;
}

.metric-sub {
    margin-top: 0.2rem;
    color: var(--muted);
    font-size: 0.86rem;
}

.section-head {
    margin: 0.2rem 0 0.7rem 0;
    color: var(--text);
    font-size: 1.03rem;
    font-weight: 700;
}

.pill {
    display: inline-block;
    padding: 0.2rem 0.72rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 650;
    border: 1px solid transparent;
}

.pill.Pending {
    color: #92400e;
    background: #fef3c7;
    border-color: #fcd34d;
}

.pill.Approved {
    color: #166534;
    background: #dcfce7;
    border-color: #86efac;
}

.pill.Rejected {
    color: #991b1b;
    background: #fee2e2;
    border-color: #fca5a5;
}

.session-pill {
    display: inline-block;
    padding: 0.36rem 0.72rem;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: #ffffff;
    color: var(--muted);
    font-size: 0.85rem;
}

.notice-panel {
    border-radius: 12px;
    border: 1px dashed var(--ring);
    background: #ffffff;
    color: var(--muted);
    padding: 0.82rem 0.95rem;
}

.result-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    background: #ffffff;
    padding: 0.82rem;
}

.result-title {
    color: var(--muted);
    font-size: 0.86rem;
}

.result-verdict {
    margin-top: 0.2rem;
    font-size: 1.05rem;
    font-weight: 780;
}

.result-good .result-verdict {
    color: #166534;
}

.result-risk .result-verdict {
    color: #991b1b;
}

.decision-banner {
    margin-top: 0.85rem;
    border-radius: 12px;
    padding: 0.75rem 0.9rem;
    font-weight: 700;
}

.decision-approve {
    color: #166534;
    background: #dcfce7;
    border: 1px solid #86efac;
}

.decision-reject {
    color: #991b1b;
    background: #fee2e2;
    border: 1px solid #fca5a5;
}

.mini-accuracy {
    margin-top: 0.35rem;
    color: var(--muted);
    font-size: 0.82rem;
}
</style>
""",
    unsafe_allow_html=True,
)

APP_FEATURE_ORDER = [
    "Customer_Age",
    "Gender",
    "Dependent_count",
    "Education_Level",
    "Marital_Status",
    "Income_Category",
    "Credit_Limit",
    "Total_Revolving_Bal",
]


def init_state():
    if "user_role" not in st.session_state:
        st.session_state.user_role = None
    if "selected_app_id" not in st.session_state:
        st.session_state.selected_app_id = None
    if "applications" not in st.session_state:
        st.session_state.applications = [
            {
                "id": "APP-10293",
                "date": "2026-03-27",
                "status": "Pending",
                "loan_amount": 12000,
                "loan_purpose": "Vehicle",
                "review_note": "",
                "reviewed_at": None,
                "assessment": None,
                "features": {
                    "Customer_Age": 45,
                    "Gender": "M",
                    "Dependent_count": 2,
                    "Education_Level": "Graduate",
                    "Marital_Status": "Married",
                    "Income_Category": "$60K - $80K",
                    "Credit_Limit": 15000,
                    "Total_Revolving_Bal": 500,
                },
            }
        ]


@st.cache_resource
def load_models_and_artifacts():
    required_paths = [
        "models/RandomForest_model.pkl",
        "models/DecisionTree_model.pkl",
        "models/LogisticRegression_model.pkl",
        "models/scaler.pkl",
        "models/label_encoders.pkl",
        "models/accuracies.pkl",
    ]
    if not all(os.path.exists(path) for path in required_paths):
        return None, None, None, None
    try:
        models = {
            "Random Forest": joblib.load("models/RandomForest_model.pkl"),
            "Decision Tree": joblib.load("models/DecisionTree_model.pkl"),
            "Logistic Regression": joblib.load("models/LogisticRegression_model.pkl"),
        }
        scaler = joblib.load("models/scaler.pkl")
        encoders = joblib.load("models/label_encoders.pkl")
        accuracies = joblib.load("models/accuracies.pkl")
        return models, scaler, encoders, accuracies
    except Exception:
        return None, None, None, None


def login(role):
    st.session_state.user_role = role


def logout():
    st.session_state.user_role = None


def find_application(app_id):
    for item in st.session_state.applications:
        if item["id"] == app_id:
            return item
    return None


def get_badge_html(status):
    return f'<span class="pill {status}">{status}</span>'


def render_metric_card(title, value, subtitle):
    st.markdown(
        f"""
<div class="metric-card">
    <div class="metric-title">{title}</div>
    <div class="metric-value">{value}</div>
    <div class="metric-sub">{subtitle}</div>
</div>
""",
        unsafe_allow_html=True,
    )


def make_prediction(features_dict, models, scaler, encoders):
    payload = {key: features_dict.get(key) for key in APP_FEATURE_ORDER}
    df_raw = pd.DataFrame([payload], columns=APP_FEATURE_ORDER)

    for column_name, encoder in encoders.items():
        if column_name in df_raw.columns:
            safe_values = []
            known_values = set(encoder.classes_)
            for value in df_raw[column_name].astype(str).tolist():
                safe_values.append(value if value in known_values else encoder.classes_[0])
            df_raw[column_name] = encoder.transform(safe_values)

    scaled_features = scaler.transform(df_raw)

    results = {}
    approve_votes = 0
    for model_name, model in models.items():
        prediction = int(model.predict(scaled_features)[0])
        confidence = float(model.predict_proba(scaled_features)[0][1])
        verdict = "Approve" if prediction == 1 else "Reject"
        if prediction == 1:
            approve_votes += 1
        results[model_name] = {
            "verdict": verdict,
            "confidence": confidence,
        }

    recommendation = "Approve" if approve_votes >= 2 else "Reject"
    return results, recommendation, approve_votes


def render_top_shell():
    st.markdown(
        """
<div class="top-shell">
    <div>
        <p class="brand-title">VaultPay Decision Studio</p>
        <p class="brand-subtitle">Shadcn-inspired banking interface for loan underwriting simulation</p>
    </div>
</div>
""",
        unsafe_allow_html=True,
    )


def render_login_screen():
    st.markdown(
        """
<div class="hero">
    <p class="hero-title">Loan Approval Simulator</p>
    <p class="hero-copy">Choose a quick login path. Customers submit applications, and admins use model assistance before approving or rejecting.</p>
</div>
""",
        unsafe_allow_html=True,
    )

    left, right = st.columns(2)
    with left:
        st.markdown(
            """
<div class="role-card">
    <p class="role-title">Customer Workspace</p>
    <p class="role-copy">Create a loan request, track status, and review bank decisions in one place.</p>
</div>
""",
            unsafe_allow_html=True,
        )
        if st.button("Quick Login as Customer", use_container_width=True, type="primary"):
            login("customer")
            st.rerun()

    with right:
        st.markdown(
            """
<div class="role-card">
    <p class="role-title">Admin Workspace</p>
    <p class="role-copy">Assess applications with Random Forest, Decision Tree, and Logistic Regression support.</p>
</div>
""",
            unsafe_allow_html=True,
        )
        if st.button("Quick Login as Admin", use_container_width=True):
            login("admin")
            st.rerun()


def render_customer_dashboard(accuracies):
    st.markdown('<p class="page-title">Customer Loan Workspace</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="page-subtitle">Submit your profile for underwriting and monitor decision updates in real time.</p>',
        unsafe_allow_html=True,
    )

    total_apps = len(st.session_state.applications)
    pending = len([a for a in st.session_state.applications if a["status"] == "Pending"])
    approved = len([a for a in st.session_state.applications if a["status"] == "Approved"])

    m1, m2, m3 = st.columns(3)
    with m1:
        render_metric_card("Total Applications", str(total_apps), "All submitted records")
    with m2:
        render_metric_card("Pending", str(pending), "Awaiting admin review")
    with m3:
        render_metric_card("Approved", str(approved), "Approved by underwriting")

    form_col, helper_col = st.columns([1.45, 1])

    with form_col:
        st.markdown('<p class="section-head">New Loan Application</p>', unsafe_allow_html=True)
        with st.form("loan_form", border=True):
            c1, c2 = st.columns(2)
            with c1:
                age = st.number_input("Age", min_value=18, max_value=100, value=30)
                gender = st.selectbox("Gender", ["M", "F"])
                dependents = st.number_input("Dependents", min_value=0, max_value=10, value=0)
                education = st.selectbox(
                    "Education Level",
                    [
                        "Uneducated",
                        "High School",
                        "College",
                        "Graduate",
                        "Post-Graduate",
                        "Doctorate",
                        "Unknown",
                    ],
                )
            with c2:
                marital = st.selectbox("Marital Status", ["Single", "Married", "Divorced", "Unknown"])
                income = st.selectbox(
                    "Income Category",
                    [
                        "Less than $40K",
                        "$40K - $60K",
                        "$60K - $80K",
                        "$80K - $120K",
                        "$120K +",
                        "Unknown",
                    ],
                )
                credit_limit = st.number_input("Credit Limit", min_value=1000, max_value=100000, value=5000)
                revolving_bal = st.number_input("Total Revolving Balance", min_value=0, max_value=50000, value=500)

            d1, d2 = st.columns(2)
            with d1:
                loan_amount = st.number_input("Requested Loan Amount", min_value=1000, max_value=250000, value=20000)
            with d2:
                loan_purpose = st.selectbox("Loan Purpose", ["Vehicle", "Education", "Business", "Personal", "Home Improvement"])

            submitted = st.form_submit_button("Submit for Underwriting", type="primary")

            if submitted:
                app_id = f"APP-{str(uuid.uuid4())[:6].upper()}"
                st.session_state.applications.append(
                    {
                        "id": app_id,
                        "date": datetime.now().strftime("%Y-%m-%d"),
                        "status": "Pending",
                        "loan_amount": int(loan_amount),
                        "loan_purpose": loan_purpose,
                        "review_note": "",
                        "reviewed_at": None,
                        "assessment": None,
                        "features": {
                            "Customer_Age": age,
                            "Gender": gender,
                            "Dependent_count": dependents,
                            "Education_Level": education,
                            "Marital_Status": marital,
                            "Income_Category": income,
                            "Credit_Limit": credit_limit,
                            "Total_Revolving_Bal": revolving_bal,
                        },
                    }
                )
                st.success(f"Application {app_id} submitted successfully.")

    with helper_col:
        st.markdown('<p class="section-head">How Decisions Are Assisted</p>', unsafe_allow_html=True)
        st.markdown(
            """
<div class="notice-panel">
The admin compares recommendations from three models and then makes a final human decision.
</div>
""",
            unsafe_allow_html=True,
        )
        st.markdown('<div class="mini-accuracy">Random Forest accuracy</div>', unsafe_allow_html=True)
        st.progress(float(accuracies.get("RandomForest", 0)))
        st.markdown('<div class="mini-accuracy">Decision Tree accuracy</div>', unsafe_allow_html=True)
        st.progress(float(accuracies.get("DecisionTree", 0)))
        st.markdown('<div class="mini-accuracy">Logistic Regression accuracy</div>', unsafe_allow_html=True)
        st.progress(float(accuracies.get("LogisticRegression", 0)))

    st.markdown('<p class="section-head">My Application Tracker</p>', unsafe_allow_html=True)

    records = []
    for app in reversed(st.session_state.applications):
        model_recommendation = "-"
        if app.get("assessment"):
            model_recommendation = app["assessment"].get("recommendation", "-")
        records.append(
            {
                "Application ID": app["id"],
                "Date": app["date"],
                "Purpose": app.get("loan_purpose", "-"),
                "Loan Amount": app.get("loan_amount", 0),
                "Status": app["status"],
                "Model Recommendation": model_recommendation,
            }
        )

    tracker_df = pd.DataFrame(records)
    if not tracker_df.empty:
        tracker_df["Loan Amount"] = tracker_df["Loan Amount"].map(lambda x: f"${int(x):,}")
        st.dataframe(tracker_df, use_container_width=True, hide_index=True)

    for app in reversed(st.session_state.applications):
        with st.expander(f"{app['id']} | {app['status']} | Submitted {app['date']}", expanded=False):
            st.markdown(f"Status: {get_badge_html(app['status'])}", unsafe_allow_html=True)
            st.write(f"Loan amount: ${int(app.get('loan_amount', 0)):,}")
            st.write(f"Purpose: {app.get('loan_purpose', '-')}")
            if app.get("reviewed_at"):
                st.write(f"Reviewed at: {app['reviewed_at']}")
            if app.get("review_note"):
                st.write(f"Admin note: {app['review_note']}")


def render_admin_dashboard(models, scaler, encoders, accuracies):
    st.markdown('<p class="page-title">Admin Underwriting Console</p>', unsafe_allow_html=True)
    st.markdown(
        '<p class="page-subtitle">Run model assistance, review confidence, and make the final approval decision.</p>',
        unsafe_allow_html=True,
    )

    tab_queue, tab_metrics = st.tabs(["Underwriting Queue", "Model Performance"])

    with tab_queue:
        pending_apps = [item for item in st.session_state.applications if item["status"] == "Pending"]
        if not pending_apps:
            st.info("No pending applications right now.")
        else:
            pending_ids = [item["id"] for item in pending_apps]
            selected_default = 0
            if st.session_state.selected_app_id in pending_ids:
                selected_default = pending_ids.index(st.session_state.selected_app_id)

            selected_app_id = st.selectbox(
                "Select pending application",
                options=pending_ids,
                index=selected_default,
            )
            st.session_state.selected_app_id = selected_app_id

            app = find_application(selected_app_id)
            features = app["features"]

            p1, p2 = st.columns(2)
            with p1:
                st.markdown('<p class="section-head">Applicant Profile</p>', unsafe_allow_html=True)
                st.write(
                    f"Age: {features['Customer_Age']} | Gender: {features['Gender']} | Dependents: {features['Dependent_count']}"
                )
                st.write(
                    f"Education: {features['Education_Level']} | Marital: {features['Marital_Status']}"
                )
                st.write(
                    f"Income: {features['Income_Category']} | Credit limit: ${int(features['Credit_Limit']):,}"
                )

            with p2:
                st.markdown('<p class="section-head">Loan Request</p>', unsafe_allow_html=True)
                st.write(f"Application ID: {app['id']}")
                st.write(f"Requested amount: ${int(app.get('loan_amount', 0)):,}")
                st.write(f"Purpose: {app.get('loan_purpose', '-')}")
                st.write(f"Submitted on: {app['date']}")

            run_col, _ = st.columns([1, 4])
            with run_col:
                if st.button("Run Model Assistance", type="primary", use_container_width=True):
                    with st.spinner("Evaluating with all three models..."):
                        model_results, recommendation, approve_votes = make_prediction(
                            features,
                            models,
                            scaler,
                            encoders,
                        )
                    app["assessment"] = {
                        "model_results": model_results,
                        "recommendation": recommendation,
                        "approve_votes": approve_votes,
                        "ran_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
                    }

            assessment = app.get("assessment")
            if assessment:
                st.markdown('<p class="section-head">Model Assessment Results</p>', unsafe_allow_html=True)
                c1, c2, c3 = st.columns(3)
                for idx, (model_name, result) in enumerate(assessment["model_results"].items()):
                    target_col = [c1, c2, c3][idx]
                    tone_class = "result-good" if result["verdict"] == "Approve" else "result-risk"
                    with target_col:
                        st.markdown(
                            f"""
<div class="result-card {tone_class}">
    <div class="result-title">{model_name}</div>
    <div class="result-verdict">{result['verdict']}</div>
    <div class="result-title">Confidence: {result['confidence'] * 100:.1f}%</div>
</div>
""",
                            unsafe_allow_html=True,
                        )
                        st.progress(min(max(result["confidence"], 0.0), 1.0))

                decision_class = "decision-approve" if assessment["recommendation"] == "Approve" else "decision-reject"
                st.markdown(
                    f"""
<div class="decision-banner {decision_class}">
Model Panel Recommendation: {assessment['recommendation']} ({assessment['approve_votes']}/3 approve votes)
</div>
""",
                    unsafe_allow_html=True,
                )

            note_key = f"decision_note_{selected_app_id}"
            decision_note = st.text_input("Decision note (optional)", key=note_key)

            a1, a2, _ = st.columns([1, 1, 3])
            with a1:
                if st.button("Approve Application", type="primary", use_container_width=True):
                    app["status"] = "Approved"
                    app["review_note"] = decision_note.strip()
                    app["reviewed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                    st.success(f"{selected_app_id} approved.")
                    st.rerun()
            with a2:
                if st.button("Reject Application", use_container_width=True):
                    app["status"] = "Rejected"
                    app["review_note"] = decision_note.strip()
                    app["reviewed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")
                    st.warning(f"{selected_app_id} rejected.")
                    st.rerun()

    with tab_metrics:
        st.markdown('<p class="section-head">Current Model Accuracy Snapshot</p>', unsafe_allow_html=True)
        metric_map = {
            "Random Forest": float(accuracies.get("RandomForest", 0)),
            "Decision Tree": float(accuracies.get("DecisionTree", 0)),
            "Logistic Regression": float(accuracies.get("LogisticRegression", 0)),
        }

        k1, k2, k3 = st.columns(3)
        with k1:
            st.metric("Random Forest", f"{metric_map['Random Forest'] * 100:.2f}%")
            st.progress(metric_map["Random Forest"])
        with k2:
            st.metric("Decision Tree", f"{metric_map['Decision Tree'] * 100:.2f}%")
            st.progress(metric_map["Decision Tree"])
        with k3:
            st.metric("Logistic Regression", f"{metric_map['Logistic Regression'] * 100:.2f}%")
            st.progress(metric_map["Logistic Regression"])

        ranking_df = pd.DataFrame(
            [
                {"Model": model_name, "Accuracy": f"{score * 100:.2f}%"}
                for model_name, score in sorted(metric_map.items(), key=lambda x: x[1], reverse=True)
            ]
        )
        st.dataframe(ranking_df, use_container_width=True, hide_index=True)


init_state()
models, scaler, encoders, accuracies = load_models_and_artifacts()

if not models:
    st.error("Models not found. Run python train.py first to generate model files.")
    st.stop()

render_top_shell()

if st.session_state.user_role is None:
    render_login_screen()
else:
    top_left, top_right = st.columns([6, 1])
    with top_left:
        active_role = st.session_state.user_role.title()
        st.markdown(f'<span class="session-pill">Active role: {active_role}</span>', unsafe_allow_html=True)
    with top_right:
        if st.button("Sign Out", use_container_width=True):
            logout()
            st.rerun()

    if st.session_state.user_role == "customer":
        render_customer_dashboard(accuracies)
    else:
        render_admin_dashboard(models, scaler, encoders, accuracies)
