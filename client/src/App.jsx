import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import LoginPage from './auth/LoginPage';
import CompanyPage from './company/pages/CompanyPage';
import EmployeePage from './employee/pages/EmployeePage';
import ClickSpark from './shared/components/ui/ClickSpark';
import './App.css';

function App() {
  return (
    <>
      <ClickSpark />
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/company/*" element={<CompanyPage />} />
        <Route path="/employee" element={<EmployeePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
