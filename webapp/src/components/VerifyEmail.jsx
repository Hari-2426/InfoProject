import React, { useState } from "react";
import "../styles/auth.css";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import Loader from "./Loader";

const VerifyEmail = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const first_time = location.state?.first_time;

  if (!email) {
    navigate("/signup");
  }

  const handleVerify = async () => {
    setError("");
    setSuccess("");

    const cleanOtp = otp.trim();

    if (!/^\d{4,6}$/.test(cleanOtp)) {
      setError("Enter a valid OTP");
      return;
    }

      if(loading) return;
  
    try {
    
      const res = await api.post("/auth/verify-otp", {
        email_id: email,
        otp: cleanOtp,
        first_time: first_time,
      });

      setSuccess(res.data?.message || "OTP verified");

       setTimeout(() => {
  setLoading(true);   
}, 600);

      setTimeout(() => {
        if (first_time) {
          navigate("/login");
        } else {
          navigate("/ResetPassword", { state: { email } });
        }
      }, 1200);

    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setSuccess("");

    try {
      setLoading(true);

      const res = await api.post("/auth/resend-otp", {
        email_id: email,
      });

      setSuccess(res.data?.message || "OTP resent");

    } catch (err) {
      const msg = err.response?.data?.message;

      if (msg?.toLowerCase().includes("already verified")) {
        setSuccess("Email already verified. Please login.");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setError(msg || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
  <>
  {loading && <Loader/>}
    <div className="auth-container">
      <div className="auth-card">
        <h2>Verify Your OTP</h2>
        <p>OTP sent to: {email}</p>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <label>
          Verification Code <span className="required">*</span>
        </label>
        <input
          placeholder="Enter OTP"
          value={otp}
          maxLength={6}
          inputMode="numeric"
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />

        <button className="primary-btn" onClick={handleVerify} disabled={loading}>
          {loading ? "Verifying..." : "Verify Code"}
        </button>

        <button className="secondary-btn" onClick={handleResend} disabled={loading}>
          Resend OTP
        </button>
      </div>
    </div>
    </>
  );
};

export default VerifyEmail;
