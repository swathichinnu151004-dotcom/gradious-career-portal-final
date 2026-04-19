import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { GoogleLogin } from "@react-oauth/google";
import { getSafeUserPostLoginPath } from "../../utils/postLoginRedirect";
import { GoogleMarkIcon } from "./GoogleMarkIcon";
import { AUTH_API_BASE } from "./useGoogleAuthClientId";
import "./Login.css";

const slides = [
  "/images/image1.jpg",
  "/images/image2.png",
  "/images/image3.jpg",
];

function Login({ googleClientId = "", googleConfigLoading = false }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const googleEnabled = Boolean(googleClientId) && !googleConfigLoading;

  const persistSession = useCallback((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role);
    if (data.user?.name) {
      localStorage.setItem("name", data.user.name);
    } else {
      localStorage.removeItem("name");
    }
  }, []);

  const redirectAfterAuth = useCallback(
    (role) => {
      setTimeout(() => {
        if (role === "admin") {
          localStorage.removeItem("redirectAfterLogin");
          navigate("/admin/dashboard");
        } else if (role === "recruiter") {
          localStorage.removeItem("redirectAfterLogin");
          navigate("/recruiter/dashboard");
        } else {
          const params = new URLSearchParams(location.search);
          const rawReturnTo = params.get("returnTo");
          let fromQuery = null;
          if (rawReturnTo) {
            try {
              fromQuery = decodeURIComponent(rawReturnTo);
            } catch {
              fromQuery = null;
            }
          }
          const fromStorage = localStorage.getItem("redirectAfterLogin");
          localStorage.removeItem("redirectAfterLogin");
          const candidate = fromQuery || fromStorage;
          const safe = getSafeUserPostLoginPath(candidate);
          navigate(safe || "/user/dashboard");
        }
      }, 1000);
    },
    [navigate, location.search]
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleCredential = async (credential) => {
    if (!credential) {
      toast.error("Google sign-in did not return a credential");
      return;
    }
    try {
      const response = await fetch(`${AUTH_API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = data.message || "Google sign-in failed";
        setMessage(msg);
        setMessageType("error");
        toast.error(msg);
        return;
      }
      persistSession(data);
      setMessage(
        data.created
          ? "Welcome! Your account is ready. Redirecting..."
          : "Login successful! Redirecting..."
      );
      setMessageType("success");
      toast.success(
        data.created
          ? "Signed up with Google — you’re in!"
          : "Signed in with Google"
      );
      redirectAfterAuth(data.role);
    } catch (error) {
      console.error("Google login error:", error);
      setMessage("Server connection failed");
      setMessageType("error");
      toast.error("Server connection failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!identifier.trim() || !password.trim()) {
      setMessage("Please fill all fields.");
      setMessageType("error");
      toast.warning("Please fill all fields.");
      return;
    }

    try {
      const response = await fetch(`${AUTH_API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password: password.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        const msg = data.message || "Login failed";
        setMessage(msg);
        setMessageType("error");
        toast.error(msg);
        return;
      }

      persistSession(data);
      setMessage("Login successful! Redirecting...");
      setMessageType("success");
      toast.success("Login successful!");
      redirectAfterAuth(data.role);
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Server connection failed");
      setMessageType("error");
      toast.error("Server connection failed");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-slider">
        {slides.map((slide, index) => (
          <img
            key={index}
            src={slide}
            alt={`slide-${index + 1}`}
            className={`login-slide ${
              index === currentSlide ? "login-slide-active" : ""
            }`}
          />
        ))}
      </div>

      <header className="login-header">
        <div className="login-navbar">
          <div className="login-logo">
            <img src="/images/logo.png" alt="Gradious Logo" />
            <span>Gradious Careers Portal</span>
          </div>
          <nav className="login-nav">
            <Link to="/">Home</Link>
            <Link to="/login" className="login-active">
              Login
            </Link>
            <Link to="/register">Register</Link>
          </nav>
        </div>
      </header>

      <section className="login-page">
        <div className="login-container">
          <div className="login-card">
            <h2>Login</h2>
            <p className="login-subtitle">Sign in to your Gradious account</p>

            <form onSubmit={handleLogin}>
              <div className="login-form-group">
                <label>Email or Phone</label>
                <input
                  type="text"
                  placeholder="Enter your email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="login-form-group">
                <label>Password</label>
                <div className="login-password-box">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <span
                    className="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </span>
                </div>
                <div className="login-forgot-link">
                  <Link to="/forgot-password">Forgot Password?</Link>
                </div>
              </div>

              {message && (
                <p className={`login-message ${messageType}`}>{message}</p>
              )}

              <button type="submit" className="login-btn">
                Login
              </button>

              <p className="login-footer">
                New user? <Link to="/register">Create an account</Link>
              </p>
            </form>

            <div className="login-google-section">
              <div className="login-or-divider">
                <span>or</span>
              </div>

              <div className="login-google-pill-wrap">
                {googleConfigLoading ? (
                  <div
                    className="login-google-pill-skeleton"
                    aria-busy="true"
                    aria-label="Loading Google sign-in"
                  />
                ) : googleEnabled ? (
                  <div className="login-google-pill-native">
                    <GoogleLogin
                      text="signin_with"
                      theme="outline"
                      size="large"
                      shape="pill"
                      width="320"
                      onSuccess={(credentialResponse) => {
                        if (credentialResponse.credential) {
                          void handleGoogleCredential(
                            credentialResponse.credential
                          );
                        }
                      }}
                      onError={() => {
                        toast.error(
                          "Google sign-in was interrupted. Check GOOGLE_CLIENT_ID and Authorized JavaScript origins in Google Cloud Console."
                        );
                      }}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    className="login-google-pill-fallback"
                    aria-label="Sign in with Google"
                    onClick={() =>
                      toast.info(
                        "Google sign-in is not configured. Add GOOGLE_CLIENT_ID to the server .env (Web client ID), restart the API, and refresh this page."
                      )
                    }
                  >
                    <GoogleMarkIcon />
                    <span>Google</span>
                  </button>
                )}
              </div>

              <p className="login-google-footnote">
                New candidates can sign up with Google (verified Gmail). Existing
                users: same Google email signs you in. Recruiters and admins: use
                email and password above.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Login;
