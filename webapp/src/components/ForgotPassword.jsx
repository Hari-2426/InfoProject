import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";
import api from "../services/api";
import Loader from "./Loader";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [email_id, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOtp = async () => {
    setError("");
    setSuccess("");

    const cleanEmail = email_id.trim();

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Enter a valid email address");
      return;
    }

     if(loading) return;
    
    try {
      
      const res = await api.post("/auth/forgot-password", {
        email_id: cleanEmail,
      });

      setSuccess(res.data?.message || "If email exists, OTP has been sent.");

       setTimeout(() => {
  setLoading(true);   
}, 600);

      setTimeout(() => {
        navigate("/verify", {
          state: { email: cleanEmail, first_time: false },
        });
      }, 1200);

    } catch (err) {
      setSuccess("If email exists, OTP has been sent.");
     setLoading(false);
    } 
  };

  return (
    <>
    {loading && <Loader/>}
    <div className="auth-container">
      <div className="auth-card">
        <h2>Forgot Password</h2>
        <p>Enter your registered email to receive OTP</p>

        
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <label>
          Email Address <span className="required">*</span>
        </label>
        <input
          type="email"
          placeholder="Enter email"
          value={email_id}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button onClick={handleSendOtp} disabled={loading}>
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </div>
    </div>
    </>
  );
};

export default ForgotPassword;
