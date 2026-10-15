/**
 * ============================================================================
 * File: frontend/src/pages/Login.jsx
 * Purpose: User Login Page Component (Lab 02)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Renders login form with email and password fields.
 * - Validates input and submits credentials to AuthContext login().
 * - Receives HttpOnly JWT cookie from backend upon success.
 * - Redirects user to previous target page or /products catalog.
 * ============================================================================
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If redirected from successful registration
  const registeredSuccess = location.state?.registered;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      // On success, redirect to protected /home page
      navigate('/home');
    } catch (err) {
      // Show "Invalid credentials" on failure without leaking details
      if (err.response?.status === 401) {
        setError('Invalid credentials');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Customer Login</h2>
          <p className="auth-subtitle">Sign in to your ShopKart account</p>
        </div>

        {registeredSuccess && (
          <div className="alert alert-success">
            Registration successful! Please log in with your credentials.
          </div>
        )}

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account yet? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
