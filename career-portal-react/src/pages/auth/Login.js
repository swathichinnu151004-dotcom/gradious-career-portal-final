import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/authService";
import "../../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const data = await loginUser({ identifier, password });

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      setMessage("Login successful ✅");

      if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.role === "recruiter") {
        navigate("/recruiter/dashboard");
      } else if (data.role === "user") {
        navigate("/user/dashboard");
      } else {
        setMessage("Unknown role received");
      }
    } catch (error) {
      setMessage(error.message || "Login failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email or Phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div style={{ marginTop: "12px" }}>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <div style={{ marginTop: "8px" }}>
          New user? <Link to="/register">Create an account</Link>
        </div>

        {message && <p className="login-message">{message}</p>}
      </div>
    </div>
  );
}

export default Login;