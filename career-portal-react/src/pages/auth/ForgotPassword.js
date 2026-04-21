import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Request failed");
      }

      setMessage(data.message);
      setMessageType("success");
      toast.success(data.message || "Check your email for reset instructions.");
    } catch (err) {
      const msg = err.message || "Something went wrong";
      setMessage(msg);
      setMessageType("error");
      toast.error(msg);
    }
  };

  return (
        <div className="forgot-page">
        <div className="forgot-overlay">
            <div className="forgot-card">
            <h2>Forgot Password</h2>
            <p className="forgot-subtitle">
                Enter your registered email address to receive a password reset link.
            </p>

            <form onSubmit={handleSubmit}>
                <div className="forgot-form-group">
                <label>Email Address</label>
                <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>

                {message && (
                <div className={`forgot-message ${messageType}`}>
                    {message}
                </div>
                )}

                <button type="submit" className="forgot-btn">
                Send Reset Link
                </button>

                <p className="forgot-footer">
                Back to <Link to="/login">Login</Link>
                </p>
            </form>
            </div>
      </div>
    </div>
  );
}

export default ForgotPassword;