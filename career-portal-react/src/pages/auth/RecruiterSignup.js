import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import "./RecruiterSignup.css";

function RecruiterSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    company_name: "",
    location: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formDisabled, setFormDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "http://localhost:5000/api";
  // If you want ngrok, use:
  // const API_BASE_URL = "https://timocratic-sessional-lewis.ngrok-free.dev/api";
useEffect(() => {
  const loadInvite = async () => {
    clearMessage();

    if (!token) {
      showMessage("Invalid signup link. Token is missing.", "error");
      setFormDisabled(true);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/validate-invite?token=${encodeURIComponent(token)}`
      );

      const data = await response.json();

      if (!response.ok) {
        const msg = data.message || "Invalid or expired invite link.";
        showMessage(msg, "error");
        toast.error(msg);
        setFormDisabled(true);
        return;
      }

      setFormData((prev) => ({
        ...prev,
        email: data.email || "",
      }));
    } catch (error) {
      console.error("Validate invite error:", error);
      showMessage("Server error while validating invite link.", "error");
      toast.error("Server error while validating invite link.");
      setFormDisabled(true);
    }
  };

  loadInvite();
}, [token]);
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
  };

  const clearMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);
  const isValidName = (name) => /^[A-Za-z\s]+$/.test(name);
  const isValidLocation = (location) => /^[A-Za-z\s]+$/.test(location);
  const isValidPassword = (password) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessage();

    const { name, phone, company_name, location, password } = formData;

    if (!token) {
      showMessage("Invalid signup link. Token is missing.", "error");
      return;
    }

    if (!name || !phone || !company_name || !location || !password) {
      showMessage("Please fill all required fields.", "error");
      return;
    }

    if (!isValidName(name.trim())) {
      showMessage("Name should contain only letters.", "error");
      return;
    }

    if (!isValidPhone(phone.trim())) {
      showMessage("Please enter a valid 10-digit phone number.", "error");
      return;
    }

    if (!isValidLocation(location.trim())) {
      showMessage("Location should contain only letters.", "error");
      return;
    }

    if (company_name.trim().length < 2) {
      showMessage("Please enter a valid company name.", "error");
      return;
    }

    if (!isValidPassword(password.trim())) {
      showMessage(
        "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);
const response = await fetch(`${API_BASE_URL}/auth/register-recruiter`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    token,
    name: name.trim(),
    phone: phone.trim(),
    company_name: company_name.trim(),
    location: location.trim(),
    password: password.trim(),
  }),
});
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || "Recruiter registration failed.";
        showMessage(errorMessage, "error");
        toast.error(errorMessage);

        if (
          errorMessage.toLowerCase().includes("already registered") ||
          errorMessage.toLowerCase().includes("already exists")
        ) {
          setTimeout(() => {
            navigate("/login");
          }, 2000);
        }

        return;
      }

      const okMsg = data.message || "Recruiter registered successfully.";
      showMessage(okMsg, "success");
      toast.success(okMsg);

      setFormData((prev) => ({
        email: prev.email,
        name: "",
        phone: "",
        company_name: "",
        location: "",
        password: "",
      }));

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Recruiter signup error:", error);
      showMessage("Server error while registering recruiter.", "error");
      toast.error("Server error while registering recruiter.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container-wrapper">
      <div className="signup-container">
        <div className="signup-card">
          <div className="signup-left">
            <h1>Recruiter Signup</h1>
            <p>
              Complete your recruiter registration to access the Gradious
              Careers Portal and manage jobs, candidates, and hiring activity.
            </p>

            <div className="info-box">
              <span>📩</span>
              <div>
                Use the invited email and complete your account setup to start
                using the recruiter portal.
              </div>
            </div>
          </div>

          <div className="signup-right">
            <form id="recruiterSignupForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  placeholder="Recruiter email"
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  disabled={formDisabled}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  disabled={formDisabled}
                />
              </div>

              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  disabled={formDisabled}
                />
              </div>

              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter location"
                  disabled={formDisabled}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    disabled={formDisabled}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={formDisabled}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <div className={`form-message ${messageType}`}>{message}</div>

              <button
                type="submit"
                className="signup-btn"
                disabled={formDisabled || loading}
              >
                {loading ? "Signing Up..." : "Complete Signup"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruiterSignup;