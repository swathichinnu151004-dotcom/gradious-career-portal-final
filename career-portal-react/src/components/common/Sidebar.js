import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaUsers,
  FaUserTie,
  FaBriefcase,
  FaFileAlt,
  FaUserPlus,
  FaUser,
  FaSignOutAlt,
  FaPlus,
} from "react-icons/fa";
import "./layout.css";

function Sidebar({ role }) {
  const navigate = useNavigate();

  // ✅ FIX ROLE (IMPORTANT)
  const finalRole = (role || localStorage.getItem("role") || "")
    .toLowerCase()
    .trim();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const brandText =
    finalRole === "admin"
      ? "Gradious Admin"
      : finalRole === "recruiter"
      ? "Gradious Recruiter"
      : "Gradious User";

  return (
    <aside className="sidebar">
      {/* BRAND */}
      <div className="sidebar-brand">
        <img
          src="/images/logo.png"
          alt="Gradious Logo"
          className="sidebar-logo"
        />
        <span className="sidebar-brand-text">{brandText}</span>
      </div>

      {/* NAVIGATION */}
      <nav className="sidebar-nav">
        {/* DASHBOARD */}
        <NavLink to={`/${finalRole}/dashboard`} className="sidebar-link">
          <FaTachometerAlt />
          <span>Dashboard</span>
        </NavLink>

        {/* ADMIN */}
        {finalRole === "admin" && (
          <>
            <NavLink to="/admin/users" className="sidebar-link">
              <FaUsers />
              <span>Users</span>
            </NavLink>

            <NavLink to="/admin/recruiters" className="sidebar-link">
              <FaUserTie />
              <span>Recruiters</span>
            </NavLink>

            <NavLink to="/admin/invite-recruiter" className="sidebar-link">
              <FaUserPlus />
              <span>Invite Recruiter</span>
            </NavLink>

            <NavLink to="/admin/jobs" className="sidebar-link">
              <FaBriefcase />
              <span>Jobs</span>
            </NavLink>

            <NavLink to="/admin/applications" className="sidebar-link">
              <FaFileAlt />
              <span>Applications</span>
            </NavLink>

            <NavLink to="/admin/profile" className="sidebar-link">
              <FaUser />
              <span>Profile</span>
            </NavLink>
          </>
        )}

        {/* USER */}
        {finalRole === "user" && (
          <>
            <NavLink to="/user/jobs" className="sidebar-link">
              <FaBriefcase />
              <span>Jobs</span>
            </NavLink>

            <NavLink to="/user/applications" className="sidebar-link">
              <FaFileAlt />
              <span>My Applications</span>
            </NavLink>

            <NavLink to="/user/profile" className="sidebar-link">
              <FaUser />
              <span>Profile</span>
            </NavLink>
          </>
        )}

        {/* RECRUITER ✅ FIXED */}
        {finalRole === "recruiter" && (
          <>
            <NavLink to="/recruiter/post-job" className="sidebar-link">
              <FaPlus />
              <span>Post Job</span>
            </NavLink>

            <NavLink to="/recruiter/jobs" className="sidebar-link">
              <FaBriefcase />
              <span>Manage Jobs</span>
            </NavLink>

            <NavLink to="/recruiter/applications" className="sidebar-link">
              <FaFileAlt />
              <span>Applications</span>
            </NavLink>

            <NavLink to="/recruiter/profile" className="sidebar-link">
              <FaUser />
              <span>Profile</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* LOGOUT */}
      <button className="sidebar-logout" onClick={handleLogout}>
        <FaSignOutAlt />
        <span>Logout</span>
      </button>
    </aside>
  );
}

export default Sidebar;