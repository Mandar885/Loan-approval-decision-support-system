import React from 'react';

export default function LoginPage({ onLogin, sampleCustomers, stats, modelInfo, theme, onToggleTheme }) {
  const attritionRate = stats?.attritionRate ?? 0;

  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div>
            <p className="text-sm font-semibold tracking-wide text-slate-500 dark:text-slate-400">VaultPay Decision Studio</p>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white md:text-3xl">Immersive Loan Approval Simulator</h1>
          </div>
          <button
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Total Records</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">{stats?.totalRecords ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Existing Customers</p>
            <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{stats?.existingCustomers ?? 0}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Attrition Rate</p>
            <p className="mt-2 text-3xl font-extrabold text-rose-600 dark:text-rose-400">{attritionRate}%</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Avg Credit Limit</p>
            <p className="mt-2 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              ${Math.round(stats?.avgCreditLimit ?? 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white dark:border-slate-700 dark:from-slate-800 dark:to-indigo-900">
          <p className="text-sm uppercase tracking-widest text-blue-100">Welcome</p>
          <h2 className="mt-2 text-3xl font-black">Choose A Role And Start Decision Simulation</h2>
          <p className="mt-2 max-w-3xl text-blue-100">
            Quick-login with 2-3 customer profiles sourced from your CSV, submit loan applications, and let admins use three trained models before final approval.
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Customer Portal</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Manual Customer Login</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Enter as a generic customer profile and create a fresh application.</p>
            <button
              onClick={() => onLogin('customer', null)}
              className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Enter Customer Portal
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">Admin Portal</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Underwriting Dashboard</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Review queue, run model support, and make final approve/reject decisions.</p>
            <button
              onClick={() => onLogin('admin')}
              className="mt-4 w-full rounded-lg bg-violet-600 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              Enter Admin Portal
            </button>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">CSV Customer Quick Login</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">These 2-3 sample customers are loaded directly from BankChurners.csv.</p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(sampleCustomers || []).slice(0, 3).map((customer) => (
              <div key={customer.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{customer.segment} segment</p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{customer.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">ID: {customer.clientNum}</p>
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Age {customer.profile?.Customer_Age} | Income {customer.profile?.Income_Category}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Credit ${Number(customer.profile?.Credit_Limit || 0).toLocaleString()}
                </p>
                <button
                  onClick={() => onLogin('customer', customer)}
                  className="mt-4 w-full rounded-lg bg-slate-900 py-2 text-sm font-bold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
                >
                  Login As {customer.displayName}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Model Training Snapshot</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Training pipeline summary and algorithm configuration used in this project.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(modelInfo?.algorithms || []).map((algo) => (
              <div key={algo.name} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">{algo.type}</p>
                <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">{algo.name}</h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{algo.howTrained}</p>
                <p className="mt-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  Accuracy: {(Number(algo.accuracy || 0) * 100).toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
