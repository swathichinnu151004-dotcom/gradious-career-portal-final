import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  const [allJobs, setAllJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [skill, setSkill] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [deptError, setDeptError] = useState("");

  useEffect(() => {
    loadJobs();
    loadDepartments();
  }, []);

  const loadJobs = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs/public-latest-jobs");

      if (!res.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await res.json();
      setAllJobs(Array.isArray(data) ? data : []);
      setExpanded(false);
      setError("");
    } catch (err) {
      console.error("Error loading jobs:", err);
      setError("Failed to load jobs");
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs/department-counts");

      if (!res.ok) {
        throw new Error("Failed to fetch departments");
      }

      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
      setDeptError("");
    } catch (err) {
      console.error("Error loading departments:", err);
      setDeptError("Failed to load departments");
    }
  };

  const toggleJobs = () => {
    setExpanded((prev) => !prev);
  };

  const searchJobs = async () => {
    if (!skill.trim() && !location.trim()) {
      loadJobs();
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/jobs/search?skill=${encodeURIComponent(
          skill
        )}&location=${encodeURIComponent(location)}`
      );

      if (!res.ok) {
        throw new Error("Failed to search jobs");
      }

      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        setAllJobs([]);
        setExpanded(true);
        setError("No jobs found");
        return;
      }

      setAllJobs(data);
      setExpanded(true);
      setError("");
    } catch (err) {
      console.error("Search error:", err);
      setError("Server error");
    }
  };

  const handleViewJobs = (department) => {
    const targetUrl = `/user/jobs?department=${encodeURIComponent(department)}`;
    const token = localStorage.getItem("token");

    if (!token) {
      localStorage.setItem("redirectAfterLogin", targetUrl);
      navigate("/login");
      return;
    }

    navigate(targetUrl);
  };

  const jobsToShow = expanded ? allJobs : allJobs.slice(0, 3);

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="home-navbar">
          <div className="home-logo">
            <img src="/images/logo.png" alt="Gradious Logo" />
            <span>Gradious Careers Portal</span>
          </div>

          <nav className="home-nav">
            <Link to="/" className="home-nav-link active">
              Home
            </Link>
            <Link to="/login" className="home-nav-link">
              Login
            </Link>
            <Link to="/register" className="home-nav-link home-btn-register">
              Register
            </Link>
          </nav>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-container home-hero-content">
          <div className="home-hero-badge">Explore careers within Gradious</div>

          <h1>Welcome to Gradious Careers</h1>
          <p>
            Explore internal job opportunities, apply easily, and grow your
            career with Gradious through a modern and seamless recruitment
            experience.
          </p>

          <div className="home-hero-stats">
            <div className="home-hero-stat-card">
              <h3>50+</h3>
              <p>Open Positions</p>
            </div>

            <div className="home-hero-stat-card">
              <h3>{departments.length}+</h3>
              <p>Departments Hiring</p>
            </div>

            <div className="home-hero-stat-card">
              <h3>100%</h3>
              <p>Easy Application Process</p>
            </div>
          </div>

          <div className="home-job-search">
            <input
              type="text"
              placeholder="Search by skill, technology, or job title"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
            <input
              type="text"
              placeholder="Search by preferred location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button onClick={searchJobs}>Search Jobs</button>
          </div>
        </div>
      </section>

      <section className="home-jobs-section">
        <div className="home-container">
          <div className="home-section-title">
            <div className="home-section-title-left">
              <h2>Latest Job Openings</h2>
              <p className="home-section-subtitle">
                Active roles posted in the last 60 days.
              </p>
            </div>

            {allJobs.length > 0 && (
              <button
                type="button"
                className="home-jobs-toggle"
                onClick={toggleJobs}
              >
                {expanded ? "Show Less" : "View All"}
              </button>
            )}
          </div>

          <div className="home-job-grid">
            {error ? (
              <p className="home-message-box">{error}</p>
            ) : (
              jobsToShow.map((job) => (
                <div className="home-job-card" key={job.id}>
                  <h3>{job.job_title}</h3>
                  <p>
                    <strong>Department:</strong> {job.department}
                  </p>
                  <p>
                    <strong>Location:</strong> {job.location}
                  </p>
                  <p>
                    <strong>Experience:</strong> {job.experience}
                  </p>

                  <Link to={`/job-details?id=${job.id}`} className="home-btn-view">
                    View Details
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="home-departments">
        <div className="home-container">
          <h2>Departments Hiring</h2>
          <p className="home-departments-subtitle">
            Explore teams that are actively hiring across Gradious.
          </p>

          <div className="home-dept-grid">
            {deptError ? (
              <p className="home-message-box">{deptError}</p>
            ) : departments.length === 0 ? (
              <p className="home-message-box">No department data available</p>
            ) : (
              departments.map((dept, index) => (
                <div className="home-dept-card" key={index}>
                  <div className="home-dept-icon">💼</div>
                  <h3>{dept.department}</h3>
                  <p>{dept.totalJobs} Open Positions</p>
                  <button
                    className="home-dept-btn"
                    onClick={() => handleViewJobs(dept.department)}
                  >
                    View Jobs
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-top">
          <div className="home-footer-left">
            <h3>Career Portal</h3>
            <p>Your gateway to internal job opportunities at Gradious.</p>
          </div>

          <div className="home-footer-right">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms & Conditions</Link>
          </div>
        </div>

        <div className="home-footer-bottom">
          <p>© 2026 Gradious Careers Portal. All Rights Reserved.</p>

          <div className="home-footer-social">
            <a
              href="https://www.linkedin.com/company/gradious"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-linkedin"></i>
            </a>

            <a
              href="https://github.com/gradious"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-github"></i>
            </a>

            <a
              href="https://twitter.com/gradious"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-x-twitter"></i>
            </a>

            <a
              href="https://www.instagram.com/gradious"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;