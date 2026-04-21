import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import DetailDrawer, {
  DetailDrawerField,
} from "../../components/common/DetailDrawer";
import TableIconActionButton, {
  TableIconActions,
} from "../../components/common/TableIconActionButton";
import "./ViewApplications.css";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);

  const token = localStorage.getItem("token");

  const loadApplications = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/admin/applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Load applications error:", err);
      toast.error("Could not load applications.");
      setApplications([]);
    }
  }, [token]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const filteredData = applications.filter((app) => {
    const name = String(app.applicant_name || app.name || "").toLowerCase();
    const job = String(app.job_title || "").toLowerCase();
    const keyword = search.toLowerCase().trim();

    const matchSearch =
      name.includes(keyword) || job.includes(keyword);

    const currentStatus = String(app.status || "Applied").toLowerCase();
    const matchFilter =
      filter === "All" || currentStatus === filter.toLowerCase();

    return matchSearch && matchFilter;
  });

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/admin/applications/status/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json();
      console.log("Update response:", data);

      if (!res.ok) {
        toast.error(data?.message || "Failed to update application status.");
        return;
      }

      toast.success(data?.message || "Application status updated.");
      await loadApplications();

      setSelectedApp((prev) =>
        prev && prev.id === id ? { ...prev, status } : prev
      );
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Something went wrong while updating status.");
    }
  };

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();

    if (s === "shortlisted") return "status shortlisted";
    if (s === "rejected") return "status rejected";
    return "status applied";
  };

  return (
    <Layout role="admin">
      <div className="applications-page">
        <div className="applications-head">
          <input
            type="text"
            placeholder="Search by applicant or job title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="filters">
            {["All", "Applied", "Shortlisted", "Rejected"].map((f) => (
              <button
                key={f}
                className={filter === f ? "active" : ""}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Job Title</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data-cell">
                    No applications found.
                  </td>
                </tr>
              ) : (
                filteredData.map((app) => {
                  const status = String(app.status || "Applied");
                  const currentStatus = status.toLowerCase();

                  return (
                    <tr key={app.id}>
                      <td>{app.applicant_name || app.name || "-"}</td>
                      <td>{app.job_title || "-"}</td>
                      <td>
                        {app.applied_date
                          ? app.applied_date.split("T")[0]
                          : "-"}
                      </td>

                      <td>
                        <span className={getStatusClass(status)}>
                          {status}
                        </span>
                      </td>

                      <td className="actions">
                        <TableIconActions>
                          <TableIconActionButton
                            variant="view"
                            tooltip="View application details"
                            onClick={() => setSelectedApp(app)}
                          />
                          {currentStatus === "applied" && (
                            <>
                              <TableIconActionButton
                                variant="shortlist"
                                tooltip="Shortlist applicant"
                                onClick={() =>
                                  updateStatus(app.id, "Shortlisted")
                                }
                              />
                              <TableIconActionButton
                                variant="reject"
                                tooltip="Reject application"
                                onClick={() =>
                                  updateStatus(app.id, "Rejected")
                                }
                              />
                            </>
                          )}
                          {currentStatus === "shortlisted" && (
                            <TableIconActionButton
                              variant="reject"
                              tooltip="Reject application"
                              onClick={() =>
                                updateStatus(app.id, "Rejected")
                              }
                            />
                          )}
                          {currentStatus === "rejected" && (
                            <span className="completed-badge">Completed</span>
                          )}
                        </TableIconActions>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <DetailDrawer
          open={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title="Application Details"
          titleId="app-details-title"
        >
          {selectedApp && (
            <>
              <DetailDrawerField label="Name">
                {selectedApp.applicant_name || selectedApp.name || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Email">
                {selectedApp.email || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Job title">
                {selectedApp.job_title || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Status">
                {selectedApp.status || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Applied date">
                {selectedApp.applied_date
                  ? selectedApp.applied_date.split("T")[0]
                  : "-"}
              </DetailDrawerField>
            </>
          )}
        </DetailDrawer>
      </div>
    </Layout>
  );
}

export default Applications;