import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <i className="fas fa-file-alt"></i>
        <h2>Resume Evaluator</h2>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/company/dashboard" className="nav-item">
          <i className="fas fa-th-large"></i>
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/company/candidates" className="nav-item">
          <i className="fas fa-users"></i>
          <span>Candidates</span>
        </NavLink>
        
        <NavLink to="/company/emails" className="nav-item">
          <i className="fas fa-envelope"></i>
          <span>Email Inbox</span>
        </NavLink>
        
        <div className="nav-item">
          <i className="fas fa-star"></i>
          <span>Shortlisted</span>
        </div>
        
        <div className="nav-item">
          <i className="fas fa-chart-bar"></i>
          <span>Analytics</span>
        </div>
        
        <div className="nav-item">
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </div>
      </nav>
      
      <button className="logout-btn" onClick={handleLogout}>
        <i className="fas fa-sign-out-alt"></i>
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;

