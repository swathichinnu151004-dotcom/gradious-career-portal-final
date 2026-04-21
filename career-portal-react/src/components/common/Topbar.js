import React, { useEffect, useState } from "react";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import "./layout.css";

function Topbar({ title, subtitle, role }) {
  const [userName, setUserName] = useState("User");
  const [userSubtitle, setUserSubtitle] = useState("Job Seeker");

  useEffect(() => {
    const loadTopbarProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        let endpoint = "";

        const base = getApiBaseUrl();
        if (role === "admin") {
          endpoint = `${base}/admin/profile`;
        } else if (role === "recruiter") {
          endpoint = `${base}/recruiter/profile`;
        } else {
          endpoint = `${base}/user/profile`;
        }

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setUserName(data.name || "User");

          if (role === "admin") {
            setUserSubtitle("Administrator");
          } else if (role === "recruiter") {
            setUserSubtitle("Recruiter");
          } else {
            setUserSubtitle("Job Seeker");
          }
        }
      } catch (error) {
        console.error("Topbar profile load error:", error);
      }
    };

    loadTopbarProfile();
  }, [role]);

  return (
    <div className="admin-topbar">
      <div className="topbar-left">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-right">
        <div className="notification-box">
          <span className="notification-icon">🔔</span>
          <span className="notification-badge">0</span>
        </div>

        <div className="profile-box">
          <div className="profile-avatar">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-info">
            <h4>{userName}</h4>
            <p>{userSubtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;