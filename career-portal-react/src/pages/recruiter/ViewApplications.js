import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import Swal from "sweetalert2";
import Layout from "../../components/common/Layout";
import AppPortalToast from "../../components/common/AppPortalToast";
import DetailDrawer, {
  DetailDrawerField,
} from "../../components/common/DetailDrawer";
import TableIconActionButton, {
  TableIconActions,
} from "../../components/common/TableIconActionButton";
import "../../components/common/layout.css";
import "./ViewApplications.css";
import {
  getRecruiterApplications,
  updateApplicationStatus,
} from "../../services/recruiterService";
import { getServerOrigin } from "../../utils/getApiBaseUrl";

function resumeFileUrl(resume) {
  if (!resume) return "#";
  const path = String(resume).replace(/^\//, "");
  return `${getServerOrigin()}/${path}`;
}

function ViewApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [toast, setToast] = useState({ message: "", type: "" });

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const response = await getRecruiterApplications();

      const data = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];

      setApplications(data);
    } catch (error) {
      console.error("Error loading applications:", error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type) => {
    flushSync(() => {
      setToast({ message, type });
    });

    setTimeout(() => {
      setToast({ message: "", type: "" });
    }, 3000);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      if (newStatus === "Rejected") {
        const result = await Swal.fire({
          title: "Reject candidate?",
          text: "Are you sure you want to reject this candidate?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#ef4444",
          cancelButtonColor: "#94a3b8",
          confirmButtonText: "Yes, Reject",
          cancelButtonText: "Cancel",
          reverseButtons: true,
        });

        if (!result.isConfirmed) return;
      }

      if (newStatus === "Shortlisted") {
        const result = await Swal.fire({
          title: "Shortlist candidate?",
          text: "Do you want to shortlist this candidate?",
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#16a34a",
          cancelButtonColor: "#94a3b8",
          confirmButtonText: "Yes, Shortlist",
          cancelButtonText: "Cancel",
          reverseButtons: true,
        });

        if (!result.isConfirmed) return;
      }

      setUpdatingId(id);

      const response = await updateApplicationStatus(id, newStatus);

      showToast(
        response.message ||
          (newStatus === "Shortlisted"
            ? "Candidate shortlisted successfully!"
            : "Application rejected successfully!"),
        newStatus === "Shortlisted" ? "success" : "error"
      );

      void loadApplications();
    } catch (error) {
      console.error("Error updating status:", error);
      showToast("Something went wrong while updating status.", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return applications;

    return applications.filter((app) => {
      return (
        app.applicant_name?.toLowerCase().includes(keyword) ||
        app.email?.toLowerCase().includes(keyword) ||
        app.phone?.toLowerCase().includes(keyword) ||
        app.job_title?.toLowerCase().includes(keyword) ||
        app.status?.toLowerCase().includes(keyword) ||
        app.department?.toLowerCase().includes(keyword) ||
        app.location?.toLowerCase().includes(keyword) ||
        app.experience?.toLowerCase().includes(keyword)
      );
    });
  }, [applications, search]);

  const totalApplications = applications.length;
  const appliedCount = applications.filter(
    (app) => app.status?.toLowerCase() === "applied"
  ).length;
  const shortlistedCount = applications.filter(
    (app) => app.status?.toLowerCase() === "shortlisted"
  ).length;
  const rejectedCount = applications.filter(
    (app) => app.status?.toLowerCase() === "rejected"
  ).length;

  return (
    <Layout role="recruiter" title="Applications">
      <div className="recruiter-applications-page">
        <AppPortalToast
          open={Boolean(toast.message)}
          message={toast.message}
          variant={toast.type === "error" ? "error" : "success"}
        />

        <div className="recruiter-applications-summary">
          <div className="summary-card summary-card-total">
            <span className="summary-label">Total Applications</span>
            <h3>{totalApplications}</h3>
          </div>

          <div className="summary-card summary-card-applied">
            <span className="summary-label">Applied</span>
            <h3>{appliedCount}</h3>
          </div>

          <div className="summary-card summary-card-shortlisted">
            <span className="summary-label">Shortlisted</span>
            <h3>{shortlistedCount}</h3>
          </div>

          <div className="summary-card summary-card-rejected">
            <span className="summary-label">Rejected</span>
            <h3>{rejectedCount}</h3>
          </div>
        </div>

        <div className="recruiter-applications-toolbar">
          <div className="recruiter-search-box">
            <input
              type="text"
              placeholder="Search by applicant name, email, phone, job title or status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="recruiter-search-input"
            />
          </div>
        </div>

        {loading ? (
          <div className="recruiter-applications-loader">
            <div className="recruiter-loader"></div>
            <p>Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="recruiter-empty-state">
            <h3>No applications found</h3>
            <p>Applications will appear here when candidates apply for your jobs.</p>
          </div>
        ) : (
          <div className="recruiter-applications-table-card">
            <div className="recruiter-table-wrap">
              <table className="recruiter-applications-table">
                <thead>
                  <tr>
                    <th>Applicant Name</th>
                    <th>Job Title</th>
                    <th>Resume</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map((app) => {
                    const status = app.status?.toLowerCase();
                    const isShortlisted = status === "shortlisted";
                    const isRejected = status === "rejected";
                    const isUpdating = updatingId === app.id;

                    return (
                      <tr key={app.id}>
                        <td className="applicant-name-cell">{app.applicant_name}</td>

                        <td>{app.job_title}</td>

                        <td>
                          {app.resume ? (
                            <a
                              href={resumeFileUrl(app.resume)}
                              target="_blank"
                              rel="noreferrer"
                              className="resume-link-btn"
                            >
                              View Resume
                            </a>
                          ) : (
                            <span className="no-resume-text">No Resume</span>
                          )}
                        </td>

                        <td>
                          <span className={`application-status-badge ${status}`}>
                            {app.status}
                          </span>
                        </td>

                        <td>
                          <TableIconActions className="application-action-group">
                            <TableIconActionButton
                              variant="view"
                              tooltip="View applicant details"
                              onClick={() => setSelectedApp(app)}
                            />
                            <TableIconActionButton
                              variant="shortlist"
                              tooltip="Shortlist applicant"
                              onClick={() =>
                                handleStatusUpdate(app.id, "Shortlisted")
                              }
                              disabled={
                                isShortlisted || isRejected || isUpdating
                              }
                            />
                            <TableIconActionButton
                              variant="reject"
                              tooltip="Reject application"
                              onClick={() =>
                                handleStatusUpdate(app.id, "Rejected")
                              }
                              disabled={
                                isShortlisted || isRejected || isUpdating
                              }
                            />
                          </TableIconActions>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DetailDrawer
          open={!!selectedApp}
          onClose={() => setSelectedApp(null)}
          title="Applicant Details"
          subtitle="Review full candidate and job information"
          titleId="rec-app-details-title"
        >
          {selectedApp && (
            <>
              <div className="detail-drawer-card-grid">
                <DetailDrawerField label="Applicant name">
                  {selectedApp.applicant_name || "-"}
                </DetailDrawerField>
                <DetailDrawerField label="Email">
                  {selectedApp.email || "N/A"}
                </DetailDrawerField>
                <DetailDrawerField label="Phone">
                  {selectedApp.phone || "N/A"}
                </DetailDrawerField>
                <DetailDrawerField label="Job title">
                  {selectedApp.job_title || "-"}
                </DetailDrawerField>
                <DetailDrawerField label="Department">
                  {selectedApp.department || "N/A"}
                </DetailDrawerField>
                <DetailDrawerField label="Experience required">
                  {selectedApp.experience || "N/A"}
                </DetailDrawerField>
                <DetailDrawerField label="Location">
                  {selectedApp.location || "N/A"}
                </DetailDrawerField>
                <DetailDrawerField label="Status">
                  <span
                    className={`application-status-badge ${selectedApp.status?.toLowerCase()}`}
                  >
                    {selectedApp.status}
                  </span>
                </DetailDrawerField>
                <DetailDrawerField label="Applied date">
                  {selectedApp.applied_date
                    ? new Date(selectedApp.applied_date).toLocaleDateString(
                        "en-IN",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    : "-"}
                </DetailDrawerField>
              </div>

              <div className="detail-drawer-resume-box">
                <span className="detail-drawer-card-label">Resume</span>
                {selectedApp.resume ? (
                  <a
                    href={resumeFileUrl(selectedApp.resume)}
                    target="_blank"
                    rel="noreferrer"
                    className="resume-link-btn"
                  >
                    View Resume
                  </a>
                ) : (
                  <span className="no-resume-text">No Resume</span>
                )}
              </div>
            </>
          )}
        </DetailDrawer>
      </div>
    </Layout>
  );
}

export default ViewApplications;