import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import "../../components/common/layout.css";
import StatusChart from "./StatusChart";
import DepartmentChart from "./DepartmentChart";
import "./dashboard.css";

function UserDashboard() {
  const [summary, setSummary] = useState({
    totalJobs: 0,
    appliedJobs: 0,
    shortlisted: 0,
    rejected: 0,
    pending: 0,
  });

  const [latestJobs, setLatestJobs] = useState([]);
  const token = localStorage.getItem("token");

  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/user/dashboard-summary", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Failed to load dashboard.");
        return;
      }

      const shortlisted = data.shortlisted || 0;
      const rejected = data.rejected || 0;
      const applied = data.appliedJobs || 0;

      setSummary({
        totalJobs: data.totalJobs || 0,
        appliedJobs: applied,
        shortlisted,
        rejected,
        pending: Math.max(applied - (shortlisted + rejected), 0),
      });
    } catch (err) {
      console.error("Dashboard error:", err);
      toast.error("Could not load dashboard.");
    }
  }, [token]);

  const loadLatestJobs = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/jobs/latest-jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        toast.error(
          (data && typeof data === "object" && data.message) ||
            "Failed to load latest jobs."
        );
        setLatestJobs([]);
        return;
      }
      setLatestJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Jobs error:", err);
      toast.error("Could not load latest jobs.");
    }
  }, [token]);

  useEffect(() => {
    loadDashboard();
    loadLatestJobs();
  }, [loadDashboard, loadLatestJobs]);

  return (
    <Layout>
      <div className="user-main">
        <section className="user-cards">
          <div className="user-card">
            <h3>Total Jobs Available</h3>
            <h2>{summary.totalJobs}</h2>
          </div>

          <div className="user-card">
            <h3>Jobs Applied</h3>
            <h2>{summary.appliedJobs}</h2>
          </div>

          <div className="user-card">
            <h3>Shortlisted</h3>
            <h2>{summary.shortlisted}</h2>
          </div>

          <div className="user-card">
            <h3>Rejected</h3>
            <h2>{summary.rejected}</h2>
          </div>
        </section>

        <section className="user-section analytics-section">
          <h2>Analytics overview</h2>
          <p className="section-desc">
            How your applications break down, and where recent openings sit by
            department.
          </p>

          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-card-head">
                <h3>Applications by status</h3>
                <p>Pending, shortlisted, and rejected from your applications</p>
              </div>
              <StatusChart summary={summary} />
            </div>

            <div className="chart-card">
              <div className="chart-card-head">
                <h3>Jobs by department</h3>
                <p>Based on the latest jobs list loaded for your dashboard</p>
              </div>
              <DepartmentChart jobs={latestJobs} />
            </div>
          </div>
        </section>

        <section className="user-section">
          <div className="user-section-head">
            <h2>Latest Jobs</h2>
          </div>

          <table className="user-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Location</th>
                <th>Experience</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {latestJobs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>
                    No jobs found
                  </td>
                </tr>
              ) : (
                latestJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.job_title}</td>
                    <td>{job.department}</td>
                    <td>{job.location}</td>
                    <td>{job.experience}</td>
                    <td>
                      <span className="status active">
                        {job.status || "ACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </Layout>
  );
}

export default UserDashboard;