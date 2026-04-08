import React, { useState, useEffect } from 'react';
import './index.css';
import LoginPage from './pages/LoginPage';
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import axios from 'axios';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [accuracies, setAccuracies] = useState(null);
  const [sampleCustomers, setSampleCustomers] = useState([]);
  const [datasetStats, setDatasetStats] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [applications, setApplications] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem('vaultpay-theme') || 'light');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('vaultpay-theme', theme);
  }, [theme]);

  useEffect(() => {
    const loadInitialData = async () => {
      const requests = await Promise.allSettled([
        axios.get('/api/models/accuracies'),
        axios.get('/api/sample-customers'),
        axios.get('/api/stats'),
        axios.get('/api/model-info'),
      ]);

      if (requests[0].status === 'fulfilled') {
        setAccuracies(requests[0].value.data);
      }
      if (requests[1].status === 'fulfilled') {
        setSampleCustomers(requests[1].value.data.customers || []);
      }
      if (requests[2].status === 'fulfilled') {
        setDatasetStats(requests[2].value.data);
      }
      if (requests[3].status === 'fulfilled') {
        setModelInfo(requests[3].value.data);
      }
    };

    loadInitialData();
  }, []);

  const handleLogin = (role, customer = null) => {
    setUserRole(role);
    if (role === 'customer') {
      setActiveCustomer(customer);
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setActiveCustomer(null);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const createApplication = (payload) => {
    const appId = `APP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const newRecord = {
      id: appId,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      loanAmount: Number(payload.loanAmount),
      purpose: payload.purpose,
      customerId: activeCustomer?.clientNum || 'guest',
      customerLabel: activeCustomer?.displayName || 'Guest Customer',
      features: payload.features,
      assessment: null,
      decisionNote: '',
      decidedAt: null,
    };

    setApplications(prev => [newRecord, ...prev]);
    return appId;
  };

  const updateApplication = (appId, patch) => {
    setApplications(prev => prev.map(app => (app.id === appId ? { ...app, ...patch } : app)));
  };

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950">
      {userRole === null ? (
        <LoginPage
          onLogin={handleLogin}
          sampleCustomers={sampleCustomers}
          stats={datasetStats}
          modelInfo={modelInfo}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : userRole === 'customer' ? (
        <CustomerDashboard
          onLogout={handleLogout}
          onToggleTheme={toggleTheme}
          theme={theme}
          accuracies={accuracies}
          stats={datasetStats}
          activeCustomer={activeCustomer}
          applications={applications}
          onSubmitApplication={createApplication}
        />
      ) : (
        <AdminDashboard
          onLogout={handleLogout}
          onToggleTheme={toggleTheme}
          theme={theme}
          accuracies={accuracies}
          stats={datasetStats}
          modelInfo={modelInfo}
          applications={applications}
          onUpdateApplication={updateApplication}
        />
      )}
    </div>
  );
}

export default App;
