import { useCallback, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import Layout from "../../components/common/Layout";
import ModalPortal from "../../components/common/ModalPortal";
import AppPortalToast from "../../components/common/AppPortalToast";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import "./inviteRecruiter.css";

const API_BASE_URL = getApiBaseUrl();
const ROWS_PER_PAGE = 5;

function InviteRecruiter() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [toast, setToast] = useState({ text: "", type: "" });
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [allInvites, setAllInvites] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedInviteId, setSelectedInviteId] = useState(null);

  const showToast = useCallback((text, type = "success") => {
    flushSync(() => {
      setToast({ text, type });
    });
    setTimeout(() => {
      setToast({ text: "", type: "" });
    }, 3500);
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
  };

  const clearMessage = () => {
    setMessage({ text: "", type: "" });
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const formatDate = (dateString) => {
    if (!dateString) return "-";

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadInvitedRecruiters = useCallback(async () => {
    if (!token) return;

    try {
      setLoadingList(true);

      const response = await fetch(`${API_BASE_URL}/admin/recruiter-invites`, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
          "ngrok-skip-browser-warning": "true",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setAllInvites([]);
        showToast(data.message || "Failed to load invites", "error");
        return;
      }

      if (!Array.isArray(data)) {
        setAllInvites([]);
        return;
      }

      const sorted = [...data].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      setAllInvites(sorted);
    } catch (error) {
      console.error("Error loading recruiter invites:", error);
      setAllInvites([]);
      showToast("Server error while loading invites", "error");
    } finally {
      setLoadingList(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    if (!token || role !== "admin") {
      window.location.href = "/login";
      return;
    }

    loadInvitedRecruiters();
  }, [token, role, loadInvitedRecruiters]);

  const filteredInvites = useMemo(() => {
    return allInvites.filter((invite) => {
      const emailMatch = (invite.email || "")
        .toLowerCase()
        .includes(searchValue.toLowerCase());

      const inviteStatus = (invite.status || "Pending").toLowerCase();
      const statusMatch =
        !statusFilter || inviteStatus === statusFilter.toLowerCase();

      return emailMatch && statusMatch;
    });
  }, [allInvites, searchValue, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredInvites.length / ROWS_PER_PAGE));

  const currentRows = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredInvites.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredInvites, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    clearMessage();

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showMessage("Please enter recruiter email", "error");
      showToast("Please enter recruiter email", "error");
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      showMessage("Please enter a valid email address", "error");
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      setLoadingInvite(true);

      const response = await fetch(`${API_BASE_URL}/admin/invite-recruiter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.message?.includes("Duplicate entry")
            ? "Invite already exists for this email"
            : data.message || "Failed to send invite";

        showMessage(errorMessage, "error");
        showToast(errorMessage, "error");
        return;
      }

      const successMessage = data.message || "Recruiter invite sent successfully";
      showMessage(successMessage, "success");
      showToast(successMessage, "success");
      setEmail("");
      void loadInvitedRecruiters();
    } catch (error) {
      console.error("Error sending recruiter invite:", error);
      showMessage("Server error while sending invite", "error");
      showToast("Server error while sending invite", "error");
    } finally {
      setLoadingInvite(false);
    }
  };

  const resendInvite = async (inviteId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/resend-invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ id: inviteId }),
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "Failed to resend invite", "error");
        return;
      }

      showToast(data.message || "Invite resent successfully", "success");
      void loadInvitedRecruiters();
    } catch (error) {
      console.error("Error resending invite:", error);
      showToast("Server error while resending invite", "error");
    }
  };

  const openCancelModal = (inviteId) => {
    setSelectedInviteId(inviteId);
    setConfirmOpen(true);
  };

  const closeCancelModal = () => {
    setSelectedInviteId(null);
    setConfirmOpen(false);
  };

  const cancelInvite = async () => {
    if (!selectedInviteId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/invite/${selectedInviteId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer " + token,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message || "Failed to cancel invite", "error");
        return;
      }

      showToast(data.message || "Invite cancelled successfully", "success");
      closeCancelModal();
      void loadInvitedRecruiters();
    } catch (error) {
      console.error("Error cancelling invite:", error);
      showToast("Server error while cancelling invite", "error");
    }
  };

  const start = filteredInvites.length
    ? (currentPage - 1) * ROWS_PER_PAGE + 1
    : 0;
  const end = Math.min(currentPage * ROWS_PER_PAGE, filteredInvites.length);

  return (
    <Layout
      role="admin"
      title="Invite Recruiter"
      subtitle="Send recruiter invitation emails and track invite status."
    >
      <div className="invite-page">
        <section className="invite-card">
          <div className="card-header">
            <h2>Send Recruiter Invite</h2>
            <p>Invite only authorized recruiters to access the portal.</p>
          </div>

          <form className="invite-form" onSubmit={handleInviteSubmit}>
            <div className="form-group">
              <label htmlFor="recruiterEmail">Recruiter Email</label>
              <input
                type="email"
                id="recruiterEmail"
                placeholder="Enter recruiter email"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <small className="input-help">
                An invitation email with a secure signup link will be sent.
              </small>
            </div>

            <div className="form-actions">
              <button type="submit" className="send-btn" disabled={loadingInvite}>
                {loadingInvite ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </form>

          {message.text && (
            <p className={`form-message ${message.type}`}>{message.text}</p>
          )}
        </section>

        <section className="list-card">
          <div className="list-header">
            <div className="list-title">
              <h2>Invited Recruiters</h2>
              <p>Track recruiter invitation status and latest activity.</p>
            </div>

            <div className="list-controls">
              <input
                type="text"
                placeholder="Search by email..."
                className="search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Expired">Expired</option>
              </select>

              <button
                type="button"
                className="refresh-btn"
                onClick={loadInvitedRecruiters}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Invited On</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingList ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      Loading invites...
                    </td>
                  </tr>
                ) : filteredInvites.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-row">
                      No invites found
                    </td>
                  </tr>
                ) : (
                  currentRows.map((invite, index) => {
                    const status = invite.status || "Pending";
                    const normalizedStatus = status.toLowerCase();

                    let statusClass = "status-pending";
                    if (normalizedStatus === "accepted") statusClass = "status-accepted";
                    if (normalizedStatus === "expired") statusClass = "status-expired";

                    return (
                      <tr key={invite.id}>
                        <td>{(currentPage - 1) * ROWS_PER_PAGE + index + 1}</td>
                        <td>{invite.email || "-"}</td>
                        <td>
                          <span className={`status-badge ${statusClass}`}>{status}</span>
                        </td>
                        <td>{formatDate(invite.created_at)}</td>
                        <td className="action-cell">
                          {(normalizedStatus === "pending" ||
                            normalizedStatus === "accepted") && (
                            <button
                              type="button"
                              className="action-btn resend"
                              onClick={() => resendInvite(invite.id)}
                            >
                              {normalizedStatus === "accepted" ? "Re-invite" : "Resend"}
                            </button>
                          )}

                          {normalizedStatus === "pending" && (
                            <button
                              type="button"
                              className="action-btn cancel"
                              onClick={() => openCancelModal(invite.id)}
                            >
                              Cancel
                            </button>
                          )}

                          {normalizedStatus === "expired" && (
                            <span className="no-action">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            <div className="pagination-bar">
              <p>
                Showing {start}-{end} of {filteredInvites.length}
              </p>

              <div className="pagination-actions">
                <button
                  type="button"
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Prev
                </button>

                <button
                  type="button"
                  className="page-btn"
                  disabled={currentPage === totalPages || filteredInvites.length === 0}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>

        <AppPortalToast
          open={Boolean(toast.text)}
          message={toast.text}
          variant={toast.type === "error" ? "error" : "success"}
        />

        <ModalPortal open={confirmOpen}>
          <div
            className="confirm-modal"
            onClick={closeCancelModal}
            role="presentation"
          >
            <div
              className="confirm-box"
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-cancel-title"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 id="confirm-cancel-title">Cancel Invite</h3>
              <p>Are you sure you want to cancel this recruiter invite?</p>

              <div className="confirm-actions">
                <button
                  type="button"
                  className="modal-btn secondary-btn"
                  onClick={closeCancelModal}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="modal-btn danger-btn"
                  onClick={cancelInvite}
                >
                  Cancel Invite
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      </div>
    </Layout>
  );
}

export default InviteRecruiter;