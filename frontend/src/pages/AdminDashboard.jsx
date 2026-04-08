import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

export default function AdminDashboard({
  onLogout,
  onToggleTheme,
  theme,
  accuracies,
  stats,
  modelInfo,
  applications,
  onUpdateApplication,
}) {
  const [tab, setTab] = useState('queue');
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');

  const pendingApps = useMemo(() => applications.filter(app => app.status === 'Pending'), [applications]);

  useEffect(() => {
    if (!pendingApps.length) {
      setSelectedAppId(null);
      return;
    }
    const exists = pendingApps.some(app => app.id === selectedAppId);
    if (!exists) {
      setSelectedAppId(pendingApps[0].id);
    }
  }, [pendingApps, selectedAppId]);

  const selectedApp = useMemo(
    () => applications.find(app => app.id === selectedAppId),
    [applications, selectedAppId],
  );

  useEffect(() => {
    setDecisionNote(selectedApp?.decisionNote || '');
  }, [selectedAppId]);

  const overview = useMemo(() => {
    const total = applications.length;
    const approved = applications.filter(app => app.status === 'Approved').length;
    const rejected = applications.filter(app => app.status === 'Rejected').length;
    const pending = applications.filter(app => app.status === 'Pending').length;
    const pendingValue = applications
      .filter(app => app.status === 'Pending')
      .reduce((sum, app) => sum + Number(app.loanAmount || 0), 0);
    return { total, approved, rejected, pending, pendingValue };
  }, [applications]);

  const runAssessment = async () => {
    if (!selectedApp) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/predict', selectedApp.features);
      onUpdateApplication(selectedApp.id, {
        assessment: response.data,
        assessedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error running assessment:', error);
      alert('Could not run model assessment.');
    }
    setLoading(false);
  };

  const submitDecision = (status) => {
    if (!selectedApp) return;
    onUpdateApplication(selectedApp.id, {
      status,
      decisionNote: decisionNote.trim(),
      decidedAt: new Date().toISOString(),
    });
    setDecisionNote('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-sky-50 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Admin Underwriting Console</p>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Decision Control Room</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Human-in-the-loop decisions supported by three trained models.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>
            <button
              onClick={onLogout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-4 md:grid-cols-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Total Apps</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{overview.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Pending</p>
            <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{overview.pending}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Approved</p>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{overview.approved}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Rejected</p>
            <p className="mt-2 text-3xl font-black text-rose-600 dark:text-rose-400">{overview.rejected}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Pending Value</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">${Math.round(overview.pendingValue).toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setTab('queue')}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              tab === 'queue'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            Underwriting Queue
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              tab === 'analytics'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setTab('training')}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              tab === 'training'
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            Model Training Info
          </button>
        </div>

        {tab === 'queue' ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Pending Applications</h2>
              <div className="mt-4 space-y-2">
                {pendingApps.map((app) => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setSelectedAppId(app.id);
                      setDecisionNote(app.decisionNote || '');
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selectedAppId === app.id
                        ? 'border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{app.id}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{app.customerLabel}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">${Number(app.loanAmount || 0).toLocaleString()} | {app.purpose}</p>
                  </button>
                ))}

                {!pendingApps.length ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No applications waiting in queue.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {selectedApp ? (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">Application Detail</h3>
                      <button
                        onClick={runAssessment}
                        disabled={loading}
                        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                      >
                        {loading ? 'Running Models...' : 'Run Model Assistance'}
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                        <p className="font-bold text-slate-900 dark:text-white">{selectedApp.customerLabel}</p>
                        <p className="text-slate-600 dark:text-slate-300">Customer ID: {selectedApp.customerId}</p>
                        <p className="mt-1 text-slate-600 dark:text-slate-300">Submitted: {selectedApp.date}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700">
                        <p className="font-bold text-slate-900 dark:text-white">Loan Request</p>
                        <p className="text-slate-600 dark:text-slate-300">Amount: ${Number(selectedApp.loanAmount || 0).toLocaleString()}</p>
                        <p className="text-slate-600 dark:text-slate-300">Purpose: {selectedApp.purpose}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-2">
                      <p>Age: {selectedApp.features?.Customer_Age}</p>
                      <p>Gender: {selectedApp.features?.Gender}</p>
                      <p>Dependents: {selectedApp.features?.Dependent_count}</p>
                      <p>Education: {selectedApp.features?.Education_Level}</p>
                      <p>Marital: {selectedApp.features?.Marital_Status}</p>
                      <p>Income: {selectedApp.features?.Income_Category}</p>
                      <p>Credit Limit: ${Number(selectedApp.features?.Credit_Limit || 0).toLocaleString()}</p>
                      <p>Revolving Balance: ${Number(selectedApp.features?.Total_Revolving_Bal || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Model Verdict Panel</h3>

                    {selectedApp.assessment ? (() => {
                      const assess = selectedApp.assessment;
                      const composite = Number(assess.compositeConfidence || 0);
                      const compositePercent = (composite * 100).toFixed(1);
                      const riskTier = assess.riskTier || 'Unknown';
                      const tierColor = riskTier === 'Low Risk'
                        ? { border: 'border-emerald-400 dark:border-emerald-700', bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' }
                        : riskTier === 'Medium Risk'
                          ? { border: 'border-amber-400 dark:border-amber-700', bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' }
                          : { border: 'border-rose-400 dark:border-rose-700', bg: 'bg-rose-50 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-300', bar: 'bg-rose-500' };

                      return (
                        <>
                          {/* Composite Confidence Score - Hero Card */}
                          <div className={`mt-4 rounded-xl border-2 ${tierColor.border} ${tierColor.bg} p-5`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Weighted Ensemble Confidence
                                </p>
                                <p className={`mt-1 text-4xl font-black ${tierColor.text}`}>
                                  {compositePercent}%
                                </p>
                              </div>
                              <div className="text-right">
                                <span className={`inline-block rounded-full border ${tierColor.border} ${tierColor.bg} px-4 py-1.5 text-sm font-bold ${tierColor.text}`}>
                                  {riskTier}
                                </span>
                                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                  {assess.approveVotes}/3 models approve
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 h-3 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className={`h-3 rounded-full transition-all duration-500 ${tierColor.bar}`}
                                style={{ width: `${compositePercent}%` }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              Score is accuracy-weighted across all 3 models. ≥75% = Low Risk, 50–74% = Medium Risk, &lt;50% = High Risk.
                            </p>
                          </div>

                          {/* Individual Model Verdicts */}
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {Object.entries(assess.predictions || {}).map(([name, result]) => (
                              <div key={name} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{name}</p>
                                <p
                                  className={`mt-1 text-lg font-black ${
                                    result.verdict === 'Approve'
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}
                                >
                                  {result.verdict}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  Confidence {(Number(result.confidence || 0) * 100).toFixed(1)}%
                                </p>
                                <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                                  <div
                                    className={`h-2 rounded-full ${
                                      result.verdict === 'Approve' ? 'bg-emerald-600' : 'bg-rose-600'
                                    }`}
                                    style={{ width: `${(Number(result.confidence || 0) * 100).toFixed(1)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Final Recommendation Banner */}
                          <div
                            className={`mt-4 rounded-lg border p-3 text-sm font-bold ${
                              assess.finalRecommendation === 'Approve'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            Final model recommendation: {assess.finalRecommendation} ({assess.approveVotes}/3 positive votes) — Ensemble Score: {compositePercent}%
                          </div>
                        </>
                      );
                    })() : (
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Run model assistance to populate prediction verdicts.</p>
                    )}

                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                        Decision Note
                        <textarea
                          value={decisionNote}
                          onChange={(event) => setDecisionNote(event.target.value)}
                          placeholder="Write approval/rejection rationale"
                          rows="3"
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                        />
                      </label>

                      <div className="grid gap-3 md:grid-cols-2">
                        <button
                          onClick={() => submitDecision('Approved')}
                          className="rounded-lg bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                        >
                          Approve Application
                        </button>
                        <button
                          onClick={() => submitDecision('Rejected')}
                          className="rounded-lg bg-rose-600 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700"
                        >
                          Reject Application
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  Select a pending application to start review.
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === 'analytics' ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Random Forest', key: 'randomForest' },
                { label: 'Decision Tree', key: 'decisionTree' },
                { label: 'Logistic Regression', key: 'logisticRegression' },
              ].map(({ label, key }) => {
                const m = accuracies?.[key] || {};
                return (
                  <div key={key} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{label} Performance</p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm dark:text-slate-200"><span className="font-bold">Accuracy:</span> {((m.accuracy || 0) * 100).toFixed(2)}%</p>
                      <p className="text-sm dark:text-slate-200"><span className="font-bold">F1 Score:</span> {(m.f1_score || 0).toFixed(4)}</p>
                      <p className="text-sm dark:text-slate-200"><span className="font-bold">MAE:</span> {(m.mae || 0).toFixed(4)}</p>
                      <p className="text-sm dark:text-slate-200"><span className="font-bold">MSE:</span> {(m.mse || 0).toFixed(4)}</p>
                      <p className="text-sm dark:text-slate-200"><span className="font-bold">RMSE:</span> {(m.rmse || 0).toFixed(4)}</p>
                      <p className="text-sm dark:text-slate-200"><span className="font-bold">R² Score:</span> {(m.r2 || 0).toFixed(4)}</p>
                      <p className="text-sm dark:text-slate-200"><span className="font-bold">RSE:</span> {(m.rse || 0).toFixed(4)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Dataset Stats</h3>
              <div className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-300 md:grid-cols-2">
                <p>Total records: {stats?.totalRecords ?? 0}</p>
                <p>Existing customers: {stats?.existingCustomers ?? 0}</p>
                <p>Attrited customers: {stats?.attritedCustomers ?? 0}</p>
                <p>Attrition rate: {stats?.attritionRate ?? 0}%</p>
                <p>Average age: {stats?.avgAge ?? 0}</p>
                <p>Top income band: {stats?.topIncomeBand ?? 'Unknown'}</p>
                <p>Avg credit limit: ${Math.round(stats?.avgCreditLimit ?? 0).toLocaleString()}</p>
                <p>Avg revolving balance: ${Math.round(stats?.avgRevolvingBalance ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ) : null}

        {tab === 'training' ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">How The Models Were Trained</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Dataset: {modelInfo?.dataset || 'BankChurners.csv'} | Split: {modelInfo?.trainTestSplit || '80/20'}
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Target Mapping: {modelInfo?.target || 'Existing=1, Attrited=0'}</p>

              <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Preprocessing Steps</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                  {(modelInfo?.preprocessing || []).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {(modelInfo?.algorithms || []).map((algo) => (
                <div key={algo.name} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{algo.type}</p>
                  <h4 className="mt-1 text-lg font-black text-slate-900 dark:text-white">{algo.name}</h4>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{algo.howTrained}</p>
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">Accuracy: {(Number(algo.accuracy || 0) * 100).toFixed(2)}%</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">MAE: {(Number(algo.mae || 0)).toFixed(4)}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">MSE: {(Number(algo.mse || 0)).toFixed(4)}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">RMSE: {(Number(algo.rmse || 0)).toFixed(4)}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">R²: {(Number(algo.r2 || 0)).toFixed(4)}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">RSE: {(Number(algo.rse || 0)).toFixed(4)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-base font-black text-slate-900 dark:text-white">Feature Set Used For Training</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {(modelInfo?.featureOrder || []).map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
