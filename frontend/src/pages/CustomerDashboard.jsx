import React, { useEffect, useMemo, useState } from 'react';

function buildInitialForm(activeCustomer) {
  const profile = activeCustomer?.profile || {};
  return {
    age: Number(profile.Customer_Age ?? 30),
    gender: profile.Gender ?? 'M',
    dependents: Number(profile.Dependent_count ?? 0),
    education: profile.Education_Level ?? 'Graduate',
    marital: profile.Marital_Status ?? 'Single',
    income: profile.Income_Category ?? '$60K - $80K',
    creditLimit: Number(profile.Credit_Limit ?? 5000),
    revolvingBal: Number(profile.Total_Revolving_Bal ?? 500),
    totalTransAmt: Number(profile.Total_Trans_Amt ?? 4000),
    totalTransCt: Number(profile.Total_Trans_Ct ?? 60),
    totalCtChng: Number(profile.Total_Ct_Chng_Q4_Q1 ?? 0.7),
    totalAmtChng: Number(profile.Total_Amt_Chng_Q4_Q1 ?? 0.7),
    avgUtilization: Number(profile.Avg_Utilization_Ratio ?? 0.3),
    monthsOnBook: Number(profile.Months_on_book ?? 36),
    loanAmount: 20000,
    loanPurpose: 'Vehicle',
  };
}

export default function CustomerDashboard({
  onLogout,
  onToggleTheme,
  theme,
  accuracies,
  stats,
  activeCustomer,
  applications,
  onSubmitApplication,
}) {
  const [tab, setTab] = useState('apply');
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState(buildInitialForm(activeCustomer));

  useEffect(() => {
    setFormData(buildInitialForm(activeCustomer));
  }, [activeCustomer]);

  const myApplications = useMemo(() => {
    if (!activeCustomer) {
      return applications;
    }
    return applications.filter(app => app.customerId === activeCustomer.clientNum);
  }, [applications, activeCustomer]);

  const statsView = useMemo(() => {
    const total = myApplications.length;
    const pending = myApplications.filter(a => a.status === 'Pending').length;
    const approved = myApplications.filter(a => a.status === 'Approved').length;
    const rejected = myApplications.filter(a => a.status === 'Rejected').length;
    const totalRequested = myApplications.reduce((sum, app) => sum + Number(app.loanAmount || 0), 0);
    const approvalRate = total ? ((approved / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      pending,
      approved,
      rejected,
      totalRequested,
      approvalRate,
    };
  }, [myApplications]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const appId = onSubmitApplication({
      loanAmount: Number(formData.loanAmount),
      purpose: formData.loanPurpose,
      features: {
        Customer_Age: Number(formData.age),
        Gender: formData.gender,
        Dependent_count: Number(formData.dependents),
        Education_Level: formData.education,
        Marital_Status: formData.marital,
        Income_Category: formData.income,
        Credit_Limit: Number(formData.creditLimit),
        Total_Revolving_Bal: Number(formData.revolvingBal),
        Total_Trans_Amt: Number(formData.totalTransAmt),
        Total_Trans_Ct: Number(formData.totalTransCt),
        Total_Ct_Chng_Q4_Q1: Number(formData.totalCtChng),
        Total_Amt_Chng_Q4_Q1: Number(formData.totalAmtChng),
        Avg_Utilization_Ratio: Number(formData.avgUtilization),
        Months_on_book: Number(formData.monthsOnBook),
      },
    });

    setSuccessMessage(`Application ${appId} submitted to underwriting.`);
    setTab('tracker');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="border-b border-slate-200 bg-white/85 backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Customer Workspace</p>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">Loan Experience Studio</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {activeCustomer ? `Logged in as ${activeCustomer.displayName} (${activeCustomer.clientNum})` : 'Logged in as Guest Customer'}
            </p>
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
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Submitted</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{statsView.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Pending</p>
            <p className="mt-2 text-3xl font-black text-amber-600 dark:text-amber-400">{statsView.pending}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Approved</p>
            <p className="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{statsView.approved}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Approval Rate</p>
            <p className="mt-2 text-3xl font-black text-indigo-600 dark:text-indigo-400">{statsView.approvalRate}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Requested</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">
              ${Math.round(statsView.totalRequested).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => { setTab('apply'); setSuccessMessage(''); }}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              tab === 'apply'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            New Loan Application
          </button>
          <button
            onClick={() => { setTab('tracker'); setSuccessMessage(''); }}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
              tab === 'tracker'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100'
            }`}
          >
            My Tracker
          </button>
        </div>

        {successMessage ? (
          <div className="mb-6 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {successMessage}
          </div>
        ) : null}

        {tab === 'apply' ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Application Form</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Complete the profile and submit to the admin underwriting queue.</p>

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Age
                    <input
                      type="number"
                      min="18"
                      max="100"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Gender
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Dependents
                    <input
                      type="number"
                      min="0"
                      max="10"
                      name="dependents"
                      value={formData.dependents}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Education
                    <select
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option>Uneducated</option>
                      <option>High School</option>
                      <option>College</option>
                      <option>Graduate</option>
                      <option>Post-Graduate</option>
                      <option>Doctorate</option>
                      <option>Unknown</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Marital Status
                    <select
                      name="marital"
                      value={formData.marital}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option>Single</option>
                      <option>Married</option>
                      <option>Divorced</option>
                      <option>Unknown</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Income Band
                    <select
                      name="income"
                      value={formData.income}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option>Less than $40K</option>
                      <option>$40K - $60K</option>
                      <option>$60K - $80K</option>
                      <option>$80K - $120K</option>
                      <option>$120K +</option>
                      <option>Unknown</option>
                    </select>
                  </label>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Credit Limit
                    <input
                      type="number"
                      name="creditLimit"
                      value={formData.creditLimit}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Revolving Balance
                    <input
                      type="number"
                      name="revolvingBal"
                      value={formData.revolvingBal}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </label>
                </div>

                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Banking History (from bank records)</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Total Transaction Amount
                    <input type="number" name="totalTransAmt" value={formData.totalTransAmt} onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Total Transaction Count
                    <input type="number" name="totalTransCt" value={formData.totalTransCt} onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Months on Book
                    <input type="number" name="monthsOnBook" value={formData.monthsOnBook} onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Avg Utilization Ratio
                    <input type="number" step="0.01" min="0" max="1" name="avgUtilization" value={formData.avgUtilization} onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Txn Count Change Q4/Q1
                    <input type="number" step="0.01" name="totalCtChng" value={formData.totalCtChng} onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                  </label>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Txn Amount Change Q4/Q1
                    <input type="number" step="0.01" name="totalAmtChng" value={formData.totalAmtChng} onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
                  </label>
                </div>

                <div className="grid gap-4 border-t border-slate-200 pt-4 dark:border-slate-700 md:grid-cols-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Loan Amount
                    <input
                      type="number"
                      name="loanAmount"
                      value={formData.loanAmount}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </label>

                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Loan Purpose
                    <select
                      name="loanPurpose"
                      value={formData.loanPurpose}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option>Vehicle</option>
                      <option>Education</option>
                      <option>Business</option>
                      <option>Personal</option>
                      <option>Home Improvement</option>
                    </select>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  Submit To Underwriting
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Model Accuracy Live</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <div className="mb-1 flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Random Forest</span>
                      <span className="font-bold">{((accuracies?.randomForest?.accuracy || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-2 rounded-full bg-blue-600" style={{ width: `${(accuracies?.randomForest?.accuracy || 0) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Decision Tree</span>
                      <span className="font-bold">{((accuracies?.decisionTree?.accuracy || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-2 rounded-full bg-violet-600" style={{ width: `${(accuracies?.decisionTree?.accuracy || 0) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Logistic Regression</span>
                      <span className="font-bold">{((accuracies?.logisticRegression?.accuracy || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${(accuracies?.logisticRegression?.accuracy || 0) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Dataset Context</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Top income segment: {stats?.topIncomeBand || 'Unknown'}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Average age: {stats?.avgAge || 0}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Avg revolving balance: ${Math.round(stats?.avgRevolvingBalance || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Application Tracker</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Track status updates from admin decisions and model panel recommendations.</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold">App ID</th>
                    <th className="px-3 py-2 text-left font-bold">Date</th>
                    <th className="px-3 py-2 text-left font-bold">Purpose</th>
                    <th className="px-3 py-2 text-left font-bold">Amount</th>
                    <th className="px-3 py-2 text-left font-bold">Status</th>
                    <th className="px-3 py-2 text-left font-bold">Model Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {myApplications.map((app) => (
                    <tr key={app.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-100">{app.id}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{app.date}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{app.purpose}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">${Number(app.loanAmount || 0).toLocaleString()}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            app.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : app.status === 'Rejected'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {app.assessment?.finalRecommendation || '-'}
                      </td>
                    </tr>
                  ))}
                  {!myApplications.length ? (
                    <tr>
                      <td colSpan="6" className="px-3 py-6 text-center text-slate-500 dark:text-slate-400">
                        No applications yet. Submit one from the New Loan Application tab.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
