import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import "./ResetPassword.css";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    if (!confirmPassword.trim()) {
      setConfirmPasswordError("");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match. Re-enter to match your new password.");
    } else {
      setConfirmPasswordError("");
    }
  }, [newPassword, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid reset link");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (confirmPasswordError || newPassword !== confirmPassword) {
      setConfirmPasswordError(
        "Passwords do not match. Re-enter to match your new password."
      );
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          newPassword,
          confirmPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Failed to reset password");
        return;
      }

      toast.success(data.message || "Password reset successful");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <h1 className="reset-password-title">Reset Password</h1>
        <p className="reset-password-subtitle">
          Enter your new password below to continue.
        </p>

        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="reset-password-group">
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="reset-password-group">
            <label htmlFor="reset-confirm-password">Confirm Password</label>
            <input
              id="reset-confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              aria-invalid={confirmPasswordError ? "true" : "false"}
              aria-describedby={
                confirmPasswordError ? "reset-confirm-password-error" : undefined
              }
              className={confirmPasswordError ? "reset-input-error" : ""}
            />
            {confirmPasswordError ? (
              <p
                id="reset-confirm-password-error"
                className="reset-inline-error"
                role="alert"
              >
                {confirmPasswordError}
              </p>
            ) : null}
          </div>

          <button type="submit" className="reset-password-btn">
            Reset Password
          </button>
        </form>

        <p className="reset-password-back">
          Back to <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;