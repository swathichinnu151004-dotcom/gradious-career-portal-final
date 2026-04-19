import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";
import logo from "../../assets/logo.png"; // put logo here

function Navbar() {
  const location = useLocation();

  return (
    <div className="navbar">
      <div className="logo-section">
        <img src={logo} alt="logo" />
        <h2>Gradious Careers Portal</h2>
      </div>

      <nav>
        <Link to="/" className={location.pathname === "/" ? "active" : ""}>
          Home
        </Link>

        <Link to="/login" className={location.pathname === "/login" ? "active" : ""}>
          Login
        </Link>

        <Link to="/register" className="register-btn-nav">
          Register
        </Link>
      </nav>
    </div>
  );
}

export default Navbar;