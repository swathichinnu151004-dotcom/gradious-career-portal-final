import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import "../../components/common/layout.css";
import { getAllJobs } from "../../services/jobService";
import { Building2, Search } from "lucide-react";
import "./ViewJobs.css";

function ViewJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const department = (searchParams.get("department") || "").trim() || null;

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await getAllJobs();
      setJobs(response.data || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast.error("Could not load jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    let result = jobs;

    if (department) {
      const d = department.toLowerCase();
      result = result.filter(
        (job) => (job.department || "").trim().toLowerCase() === d
      );
    }

    if (searchTerm.trim()) {
      const value = searchTerm.toLowerCase();
      result = result.filter(
        (job) =>
          job.job_title?.toLowerCase().includes(value) ||
          job.department?.toLowerCase().includes(value) ||
          job.location?.toLowerCase().includes(value)
      );
    }

    return result;
  }, [jobs, department, searchTerm]);

  const handleViewDetails = (jobId) => {
    navigate(`/job-details?id=${jobId}`);
  };

  const pageTitle = department ? `${department} Jobs` : "View Jobs";

  return (
    <Layout
      role="user"
      title={pageTitle}
      subtitle="Open roles you can still apply to. Jobs you already applied for are listed under My Applications."
    >
      <div className="view-jobs-page">
        {department ? (
          <div className="jobs-dept-active-banner" role="status" aria-live="polite">
            <div className="jobs-dept-active-banner-main">
              <div className="jobs-dept-active-icon" aria-hidden>
                <Building2 size={28} strokeWidth={1.75} />
              </div>
              <div className="jobs-dept-active-copy">
                <p className="jobs-dept-active-label">You are viewing jobs in</p>
                <p className="jobs-dept-active-name">{department}</p>
                <p className="jobs-dept-active-hint">
                  Only openings in this department are listed below. To see every
                  department, clear the filter.
                </p>
              </div>
            </div>
            <Link to="/user/jobs" className="jobs-dept-filter-clear jobs-dept-filter-clear-btn">
              Show all departments
            </Link>
          </div>
        ) : null}
        <div className="jobs-search-wrap">
          <div className="jobs-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by job title, department, or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="page-loader">
            <div className="loader"></div>
            <span className="loader-text">Loading jobs...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="jobs-empty-state">
            {searchTerm.trim()
              ? "No jobs match your search."
              : department
              ? `No open roles in ${department} right now.`
              : jobs.length === 0
              ? "There are no roles you can apply to here yet, or you have already applied to every current posting. Open My Applications to see your submissions."
              : "No jobs found."}
          </div>
        ) : (
          <div className="jobs-table-card">
            {department ? (
              <p className="jobs-table-dept-caption">
                Showing <strong>{filteredJobs.length}</strong>{" "}
                {filteredJobs.length === 1 ? "role" : "roles"} in{" "}
                <strong className="jobs-table-dept-name">{department}</strong>
              </p>
            ) : null}
            <div className="table-wrapper">
              <table className="jobs-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Experience</th>
                    <th>Apply</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.job_title}</td>
                      <td>{job.department}</td>
                      <td>{job.location}</td>
                      <td>{job.experience}</td>
                      <td>
                        <button
                          className="apply-btn"
                          onClick={() => handleViewDetails(job.id)}
                        >
                          Apply
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default ViewJobs;