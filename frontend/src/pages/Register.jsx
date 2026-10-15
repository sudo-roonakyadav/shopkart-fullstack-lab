/**
 * ============================================================================
 * File: frontend/src/pages/Register.jsx
 * Purpose: Customer Registration Page Component (Lab 02)
 * ----------------------------------------------------------------------------
 * What this file does:
 * - Renders registration form for new customers (name, email, password, address).
 * - Validates input and calls AuthContext register() function.
 * - Automatically logs user in upon successful account creation.
 * ============================================================================
 */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password || !formData.phone.trim()) {
      setError('All fields are required.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register(formData);
      // On success, redirect to login page with a query or state
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (err.response?.status === 409
          ? 'Email already exists. Please log in.'
          : 'Registration failed. Please check your inputs.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create ShopKart Account</h2>
          <p className="auth-subtitle">Register to discover and purchase Linux distributions</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              className="form-control"
              placeholder="e.g. Linus Torvalds"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              placeholder="e.g. linus@kernel.org"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password (min. 6 characters)</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              placeholder="Create a secure password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary btn-block"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
