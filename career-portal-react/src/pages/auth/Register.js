import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./Register.css";
import registerBg from "../../assets/register.jpg";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    qualification: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  useEffect(() => {
    const p = formData.password;
    const c = formData.confirmPassword;
    if (!c.trim()) {
      setConfirmPasswordError("");
      return;
    }
    if (p !== c) {
      setConfirmPasswordError("Passwords do not match. Re-enter to match your password.");
    } else {
      setConfirmPasswordError("");
    }
  }, [formData.password, formData.confirmPassword]);

  const showFormMessage = (text, type, existingUser = false) => {
    setMessage(text);
    setMessageType(type);
    setIsExistingUser(existingUser);
  };

  const clearFormMessage = () => {
    setMessage("");
    setMessageType("");
    setIsExistingUser(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const {
      firstName,
      lastName,
      email,
      phone,
      city,
      qualification,
      password,
      confirmPassword,
      terms,
    } = formData;

    if (!firstName.trim()) return "Please enter first name.";
    if (!lastName.trim()) return "Please enter last name.";
    if (!email.trim()) return "Please enter email address.";
    if (!phone.trim()) return "Please enter phone number.";
    if (!city.trim()) return "Please enter your city.";
    if (city.trim().length < 2) {
      return "City must be at least 2 characters.";
    }
    if (!qualification.trim()) {
      return "Please select your qualification from the list.";
    }
    if (!password.trim()) return "Please enter password.";
    if (!confirmPassword.trim()) return "Please enter confirm password.";

    const namePattern = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
    if (!namePattern.test(firstName.trim())) {
      return "First name should contain only letters and spaces.";
    }

    if (!namePattern.test(lastName.trim())) {
      return "Last name should contain only letters and spaces.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    const phonePattern = /^[6-9][0-9]{9}$/;
    if (!phonePattern.test(phone.trim())) {
      return "Please enter a valid 10-digit phone number starting with 6 to 9.";
    }

    const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordPattern.test(password.trim())) {
      return "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    if (!terms) {
      return "Please accept Terms & Conditions.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearFormMessage();

    const error = validateForm();
    if (error) {
      showFormMessage(error, "error");
      return;
    }

    if (confirmPasswordError) {
      showFormMessage(confirmPasswordError, "error");
      return;
    }

    const payload = {
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      city: formData.city.trim(),
      qualification: formData.qualification.trim(),
      password: formData.password.trim(),
    };

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = { message: "Invalid server response from backend." };
      }

      if (!res.ok) {
        const backendMessage = (data.message || "").toLowerCase();

        if (
          backendMessage.includes("email already registered") ||
          backendMessage.includes("already exists") ||
          backendMessage.includes("user already exists")
        ) {
          showFormMessage(
            "Email already registered. Please login.",
            "success",
            true
          );
          toast.info("Email already registered. Please log in.");
        } else {
          const errMsg = data.message || "Registration failed.";
          showFormMessage(errMsg, "error");
          toast.error(errMsg);
        }
        return;
      }

      const okMsg =
        data.message || "Registration successful! Redirecting to login...";
      showFormMessage(okMsg, "success");
      toast.success(okMsg);

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        city: "",
        qualification: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Registration error:", err);
      showFormMessage("Server error. Please check backend connection.", "error");
      toast.error("Server error. Please check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page-wrapper">
      <header className="register-header">
        <div className="register-navbar">
          <div className="register-logo-section">
            <img src="/images/logo.png" alt="logo" />
            <h2>Gradious Careers Portal</h2>
          </div>

          <nav className="register-nav">
            <Link to="/" className="register-nav-link">
              Home
            </Link>
            <Link to="/login" className="register-nav-link">
              Login
            </Link>
            <Link to="/register" className="register-nav-link active">
              Register
            </Link>
          </nav>
        </div>
      </header>

      <section
        className="register-page"
        style={{ backgroundImage: `url(${registerBg})` }}
      >
        <div className="register-left">
          <h1>Create Your Account</h1>
          <p>
            Register to explore internal job opportunities, apply easily, and
            track your application status with Gradious.
          </p>

          <ul className="register-benefits-list">
            <li>✔ Apply for internal job openings</li>
            <li>✔ Track your application status</li>
            <li>✔ Connect with recruiters easily</li>
          </ul>
        </div>

        <div className="register-right">
          <div className="register-card">
            <h2>Register</h2>
            <p>Create your Gradious career account</p>

            <p className="register-required-text">
              <span>*</span> indicates required fields
            </p>

            <form onSubmit={handleSubmit} className="register-form">
              <label>First Name *</label>
              <input
                type="text"
                name="firstName"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange}
              />

              <label>Last Name *</label>
              <input
                type="text"
                name="lastName"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange}
              />

              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleChange}
              />

              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
              />

              <label htmlFor="register-city">City *</label>
              <input
                id="register-city"
                type="text"
                name="city"
                placeholder="Enter your city"
                value={formData.city}
                onChange={handleChange}
                required
                minLength={2}
                autoComplete="address-level2"
              />

              <label htmlFor="register-qualification">Qualification *</label>
              <select
                id="register-qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                required
              >
                <option value="">Select qualification</option>
                <option value="B.Tech">B.Tech</option>
                <option value="B.E">B.E</option>
                <option value="B.Sc">B.Sc</option>
                <option value="BCA">BCA</option>
                <option value="M.Tech">M.Tech</option>
                <option value="MCA">MCA</option>
                <option value="MBA">MBA</option>
                <option value="Diploma">Diploma</option>
                <option value="Other">Other</option>
              </select>

              <label>Password *</label>
              <div className="register-password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <span onClick={() => setShowPassword(!showPassword)}>👁</span>
              </div>

              <small className="register-password-help">
                Must be at least 8 characters, include 1 uppercase letter, 1
                number, and 1 special character.
              </small>

              <label htmlFor="register-confirm-password">Confirm Password *</label>
              <div className="register-password-field">
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  aria-invalid={confirmPasswordError ? "true" : "false"}
                  aria-describedby={
                    confirmPasswordError
                      ? "register-confirm-password-error"
                      : undefined
                  }
                  className={confirmPasswordError ? "register-input-error" : ""}
                />
                <span onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  👁
                </span>
              </div>
              {confirmPasswordError ? (
                <p
                  id="register-confirm-password-error"
                  className="register-inline-error"
                  role="alert"
                >
                  {confirmPasswordError}
                </p>
              ) : null}

              <div className="register-checkbox-group">
                <input
                  type="checkbox"
                  name="terms"
                  checked={formData.terms}
                  onChange={handleChange}
                />
                <label>
                  I agree to the{" "}
                  <span
                    className="register-link-text"
                    onClick={() => setShowModal(true)}
                  >
                    Terms & Conditions
                  </span>{" "}
                  <span className="register-star">*</span>
                </label>
              </div>

              <button
                type="submit"
                className="register-submit-btn"
                disabled={loading}
              >
                {loading ? "Registering..." : "👤 Register"}
              </button>

              {message && (
                <div className={`register-form-message ${messageType}`}>
                  {isExistingUser ? (
                    <>
                      Email already registered.{" "}
                      <Link to="/login" className="register-message-login-link">
                        Please login
                      </Link>
                    </>
                  ) : (
                    message
                  )}
                </div>
              )}

              <p className="register-login-text">
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </form>

            {showModal && (
              <div className="register-modal-overlay">
                <div className="register-modal">
                  <div className="register-modal-header">
                    <h3>Terms & Conditions</h3>
                    <span
                      className="register-close"
                      onClick={() => setShowModal(false)}
                    >
                      ✖
                    </span>
                  </div>

                  <div className="register-modal-body">
                    <p>
                      Welcome to our platform. By creating an account, you agree
                      to follow the terms and conditions.
                    </p>

                    <ul>
                      <li>Provide accurate information</li>
                      <li>Keep your account secure</li>
                      <li>No misuse of platform</li>
                      <li>Features may change anytime</li>
                      <li>Violation may lead to suspension</li>
                    </ul>

                    <p>By continuing, you agree to these terms.</p>
                  </div>

                  <div className="register-modal-footer">
                    <button type="button" onClick={() => setShowModal(false)}>
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Register;