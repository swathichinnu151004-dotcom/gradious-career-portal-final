import { Link } from "react-router-dom";
import "./Home.css";
import "./PublicSubpage.css";

/**
 * Shared header for public marketing pages (About, Contact, Privacy, Terms).
 * @param {{ active?: "home" | "about" | "contact" | "login" | "register" | null, children: import("react").ReactNode }} props
 */
function MarketingSubpageLayout({ active = null, children }) {
  const navClass = (key) =>
    `home-nav-link${active === key ? " active" : ""}`;

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-navbar">
          <Link to="/" className="home-logo">
            <img src="/images/logo.png" alt="Gradious Logo" />
            <span>Gradious Careers Portal</span>
          </Link>

          <nav className="home-nav">
            <Link to="/" className={navClass("home")}>
              Home
            </Link>
            <Link to="/about" className={navClass("about")}>
              About Us
            </Link>
            <Link to="/contact" className={navClass("contact")}>
              Contact
            </Link>
            <Link to="/login" className={navClass("login")}>
              Login
            </Link>
            <Link
              to="/register"
              className={`${navClass("register")} home-btn-register`}
            >
              Register
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}

export default MarketingSubpageLayout;
