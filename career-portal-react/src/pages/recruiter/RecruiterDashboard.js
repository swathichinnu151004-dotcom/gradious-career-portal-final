import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import "./recruiter-dashboard.css";
import { Chart } from "chart.js/auto";
import {
  chartFontFamily,
  niceAxisMax,
  tooltipDefaults,
} from "../../utils/chartTheme";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

function RecruiterDashboard() {
  const [summary, setSummary] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    appliedApplications: 0,
    shortlistedApplications: 0,
    rejectedApplications: 0,
  });

  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const token = localStorage.getItem("token");

  const jobsChartRef = useRef(null);
  const appChartRef = useRef(null);

  const renderCharts = useCallback((data) => {
    const jobsCanvas = document.getElementById("jobsChart");
    const appCanvas = document.getElementById("appChart");

    if (jobsChartRef.current) jobsChartRef.current.destroy();
    if (appChartRef.current) appChartRef.current.destroy();

    if (jobsCanvas) {
      jobsChartRef.current = new Chart(jobsCanvas, {
        type: "doughnut",
        data: {
          labels: ["Active Jobs", "Inactive Jobs"],
          datasets: [
            {
              data: [
                data.activeJobs || 0,
                Math.max((data.totalJobs || 0) - (data.activeJobs || 0), 0),
              ],
              backgroundColor: ["#2563eb", "#e2e8f0"],
              borderColor: "#ffffff",
              borderWidth: 2,
              spacing: 2,
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 14,
                font: {
                  size: 12,
                  weight: "500",
                  family: chartFontFamily,
                },
                color: "#475569",
                boxWidth: 8,
                boxHeight: 8,
              },
            },
            tooltip: {
              ...tooltipDefaults,
              callbacks: {
                label: (ctx) => {
                  const n = Number(ctx.raw ?? 0);
                  const sum = (ctx.dataset.data || []).reduce(
                    (a, b) => a + Number(b || 0),
                    0
                  );
                  const pct = sum ? Math.round((n / sum) * 100) : 0;
                  return ` ${n.toLocaleString()} (${pct}%)`;
                },
              },
            },
          },
        },
      });
    }

    if (appCanvas) {
  appChartRef.current = new Chart(appCanvas, {
    type: "bar",
    data: {
      labels: ["Applied", "Shortlisted", "Rejected"],
      datasets: [
        {
          data: [
            data.appliedApplications || 0,
            data.shortlistedApplications || 0,
            data.rejectedApplications || 0,
          ],
          backgroundColor: ["#f59e0b", "#22c55e", "#ef4444"],
          borderRadius: 10,
          borderSkipped: false,
          maxBarThickness: 44,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults,
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed?.y;
              return ` ${v?.toLocaleString?.() ?? v} applications`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: "#64748b",
            font: { size: 12, weight: "600", family: chartFontFamily },
          },
        },
        y: {
          beginAtZero: true,
          max: niceAxisMax(
            [
              data.appliedApplications || 0,
              data.shortlistedApplications || 0,
              data.rejectedApplications || 0,
            ],
            5
          ),
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
            drawBorder: false,
          },
          ticks: {
            color: "#94a3b8",
            font: { size: 11, family: chartFontFamily },
            precision: 0,
            maxTicksLimit: 8,
          },
        },
      },
    },
  });
}
  }, []);

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/recruiter/dashboard-summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) {
        localStorage.clear();
        window.location.href = "/login";
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Failed to load dashboard summary.");
        return;
      }

      const formattedSummary = {
        totalJobs: data.totalJobs || 0,
        activeJobs: data.activeJobs || 0,
        totalApplications: data.totalApplications || 0,
        appliedApplications: data.appliedApplications || 0,
        shortlistedApplications: data.shortlistedApplications || 0,
        rejectedApplications: data.rejectedApplications || 0,
      };

      setSummary(formattedSummary);
      renderCharts(formattedSummary);
    } catch (err) {
      console.log(err);
      toast.error("Could not load dashboard summary.");
    }
  }, [token, renderCharts]);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/recruiter/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        toast.error(
          (data && typeof data === "object" && data.message) ||
            "Failed to load jobs."
        );
        setJobs([]);
        return;
      }
      setJobs(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch (err) {
      console.log(err);
      toast.error("Could not load jobs.");
    }
  }, [token]);

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/recruiter/applications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        toast.error(
          (data && typeof data === "object" && data.message) ||
            "Failed to load applications."
        );
        setApplications([]);
        return;
      }
      setApplications(Array.isArray(data) ? data.slice(0, 3) : []);
    } catch (err) {
      console.log(err);
      toast.error("Could not load applications.");
    }
  }, [token]);

  useEffect(() => {
    loadSummary();
    loadJobs();
    loadApplications();
  }, [loadSummary, loadJobs, loadApplications]);

  return (
    <Layout>
      <div className="recruiter-main">
        <div className="recruiter-cards">
          <Card title="Total Jobs Posted" value={summary.totalJobs} />
          <Card title="Active Jobs" value={summary.activeJobs} />
          <Card title="Total Applications" value={summary.totalApplications} />
          <Card title="Applied" value={summary.appliedApplications} />
          <Card title="Shortlisted" value={summary.shortlistedApplications} />
          <Card title="Rejected" value={summary.rejectedApplications} />
        </div>

        <div className="recruiter-section">
          <h2>Analytics overview</h2>
          <p className="section-lead">
            Live split of your job inventory and how applications are moving
            through your pipeline.
          </p>

          <div className="analytics-grid">
            <div className="chart-card">
              <div className="recruiter-chart-head">
                <h3>Jobs by status</h3>
                <p>Active vs inactive postings in your portfolio</p>
              </div>
              <div className="chart-box">
                <canvas id="jobsChart"></canvas>
              </div>
            </div>

            <div className="chart-card">
              <div className="recruiter-chart-head">
                <h3>Applications by status</h3>
                <p>Applied, shortlisted, and rejected volumes</p>
              </div>
              <div className="chart-box">
                <canvas id="appChart"></canvas>
              </div>
            </div>
          </div>
        </div>

        <div className="recruiter-section">
          <div className="section-header">
            <h2>Recent Jobs</h2>
            <a href="/recruiter/jobs" className="view-all">
              View All
            </a>
          </div>

          <table className="recruiter-table">
            <thead>
              <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Location</th>
                <th>Status</th>
                <th>Posted Date</th>
              </tr>
            </thead>

            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan="5">No jobs found</td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.job_title}</td>
                    <td>{job.department}</td>
                    <td>{job.location}</td>
                    <td>
                      <span
                        className={`status-badge ${job.status?.toLowerCase()}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td>{job.posted_date?.split("T")[0]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="recruiter-section">
          <div className="section-header">
            <h2>Recent Applications</h2>
            <a href="/recruiter/applications" className="view-all">
              View All
            </a>
          </div>

          <table className="recruiter-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Job Title</th>
                <th>Status</th>
                <th>Applied Date</th>
              </tr>
            </thead>

            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="4">No applications found</td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id}>
                    <td>{app.applicant_name || app.name}</td>
                    <td>{app.job_title}</td>
                    <td>
                      <span
                        className={`status-badge ${app.status?.toLowerCase()}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td>{app.applied_date?.split("T")[0]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}

function Card({ title, value }) {
  return (
    <div className="recruiter-card">
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
}

export default RecruiterDashboard;