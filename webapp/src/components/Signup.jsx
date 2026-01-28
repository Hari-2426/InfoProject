import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/auth.css";
import Loader from "./Loader";

const Signup = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email_id: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPhone = (phone) =>
    /^[6-9]\d{9}$/.test(phone);

  const handleSignup = async () => {
    setError("");
    setSuccess("");

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone_number: form.phone_number.trim(),
      email_id: form.email_id.trim().toLowerCase(),
      password: form.password.trim(),
    };

    if (Object.values(payload).some((v) => !v)) {
      setError("All fields are required");
      return;
    }

    if (!isValidEmail(payload.email_id)) {
      setError("Enter a valid email address");
      return;
    }

    if (!isValidPhone(payload.phone_number)) {
      setError("Enter a valid 10-digit phone number");
      return;
    }

    if (payload.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (loading) return;

    try {

      const res = await api.post("/auth/register", payload);

      setSuccess(res.data?.message || "Registration successful");

      setTimeout(() => {
        setLoading(true);
      }, 600);

      setTimeout(() => {
        navigate("/verify", {
          state: { email: payload.email_id, first_time: true },
        });
      }, 800);

    } catch (err) {
      console.error("DEBUG: Signup Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Registration failed";
      setError(errorMessage + (err.response ? "" : " (Network Error - Check Console)"));
      setLoading(false);
    }
  };

  return (
    <>
      {loading && <Loader />}
      <div className="auth-container">
        <div className="auth-card">
          <h2>Create Account</h2>
          <p>Join the Hire-a-Helper community</p>

          {error && <span className="error">{error}</span>}
          {success && <div className="success">{success}</div>}
          <div className="two-col">
            <div className="input-group">
              <label>First Name <span className="required">*</span></label>
              <input
                name="first_name"
                type="text"
                maxLength={50}
                autoComplete="given-name"
                placeholder="First Name"
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label>Last Name <span className="required">*</span></label>
              <input
                name="last_name"
                type="text"
                maxLength={50}
                autoComplete="family-name"
                placeholder="Last Name"
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Phone Number <span className="required">*</span></label>
            <input
              name="phone_number"
              maxLength={10}
              autoComplete="tel"
              placeholder="Phone Number"
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Email Address <span className="required">*</span></label>
            <input
              name="email_id"
              type="email"
              maxLength={100}
              autoComplete="email"
              placeholder="Enter your email"
              onChange={handleChange}
            />
          </div>

          <div className="input-group">
            <label>Password <span className="required">*</span></label>
            <input
              name="password"
              type="password"
              maxLength={100}
              autoComplete="new-password"
              placeholder="Create your password"
              onChange={handleChange}
            />
          </div>

          <button className="primary-btn" onClick={handleSignup} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
