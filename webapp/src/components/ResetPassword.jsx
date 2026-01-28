import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/auth.css";
import api from "../services/api";
import Loader from "./Loader";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!email) {
      setError("Session expired. Please try again.");
      setTimeout(() => navigate("/forgot"), 1200);
    }
  }, [email, navigate]);

  const isStrongPassword = (pwd) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(pwd);

  const handleReset = async () => {
    setError("");
    setSuccess("");

    const cleanPassword = password.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPassword || !cleanConfirm) {
      setError("All fields are required");
      return;
    }

    if (cleanPassword !== cleanConfirm) {
      setError("Passwords do not match");
      return;
    }

    if (!isStrongPassword(cleanPassword)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

     if(loading) return;
  
    try {
      
      const res = await api.post("/auth/reset-password", {
        email_id: email,
        password: cleanPassword,
      });

      setSuccess(res.data?.message || "Password reset successful.");

       setTimeout(() => {
  setLoading(true);   
}, 600);

      setTimeout(() => navigate("/login"), 1200);

    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
      setLoading(false);
    } 
  };

  return (
    <>
    {loading && <Loader/>}
    <div className="auth-container">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p>Create a new password</p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <label>
          New Password <span className="required">*</span>
        </label>
        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>
          Confirm Password <span className="required">*</span>
        </label>
        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <button onClick={handleReset} disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>
    </div>
    </>
  );
};

export default ResetPassword;
