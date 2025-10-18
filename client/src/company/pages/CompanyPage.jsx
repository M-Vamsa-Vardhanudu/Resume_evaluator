import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CompanyDashboard from './CompanyDashboard';
import EmployeeDashboard from '../../employee/pages/EmployeeDashboard';
import EmailsSection from './EmailsSection';
import '../styles/Sidebar.css';

const CompanyPage = () => {
  return (
    <div className="company-container">
      <Sidebar />
      <main className="company-main">
        <Routes>
          <Route path="dashboard" element={<CompanyDashboard />} />
          <Route path="candidates" element={<EmployeeDashboard />} />
          <Route path="emails" element={<EmailsSection />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default CompanyPage;

