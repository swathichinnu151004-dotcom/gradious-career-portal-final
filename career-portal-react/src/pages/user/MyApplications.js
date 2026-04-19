import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import "../../components/common/layout.css";
import { Search } from "lucide-react";
import "./MyApplications.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/jobs/my-applications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await res.json().catch(() => []);
      if (!res.ok) {
        toast.error(
          (data && data.message) || "Failed to load applications."
        );
        setApplications([]);
        return;
      }
      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading applications:", error);
      toast.error("Could not load applications.");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return applications;

    const value = searchTerm.toLowerCase();
    return applications.filter(
      (app) =>
        app.job_title?.toLowerCase().includes(value) ||
        app.status?.toLowerCase().includes(value)
    );
  }, [applications, searchTerm]);

  const getStatusClass = (status) => {
    const value = status?.toLowerCase();
    if (value === "shortlisted") return "status-badge shortlisted";
    if (value === "rejected") return "status-badge rejected";
    return "status-badge applied";
  };

  return (
    <Layout
      role="user"
      title="My Applications"
      subtitle="Track your job applications and status updates here."
    >
      <div className="myapps-page">
        <div className="myapps-search-wrap">
          <div className="myapps-search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by job title or status"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="page-loader">
            <div className="loader"></div>
            <span className="loader-text">Loading applications...</span>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="myapps-empty-state">
            No applications found.
          </div>
        ) : (
          <div className="myapps-table-card">
            <div className="table-wrapper">
              <table className="myapps-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Status</th>
                    <th>Applied Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => (
                    <tr key={app.id}>
                      <td>{app.job_title}</td>
                      <td>
                        <span className={getStatusClass(app.status)}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        {app.applied_date
                          ? new Date(app.applied_date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
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

export default MyApplications;