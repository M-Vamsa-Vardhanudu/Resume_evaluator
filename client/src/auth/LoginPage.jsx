import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (userType) => {
    if (userType === 'company') {
      navigate('/company/dashboard');
    } else {
      navigate('/employee');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-section">
          <div className="logo-icon">📄</div>
          <h1>Resume Evaluator</h1>
          <p>AI-Powered Recruitment Platform</p>
        </div>
        
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="button" 
            className="btn-login btn-company"
            onClick={() => handleLogin('company')}
          >
            <i className="fas fa-building"></i>
            Login as Company
          </button>
          
          <button 
            type="button" 
            className="btn-login btn-employee"
            onClick={() => handleLogin('employee')}
          >
            <i className="fas fa-user"></i>
            Login as Employee
          </button>
        </form>
        
        <div className="login-footer">
          <a href="#">Forgot Password?</a>
          <span>•</span>
          <a href="#">Sign Up</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

