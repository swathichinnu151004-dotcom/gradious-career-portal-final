import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import ModalPortal from "../../components/common/ModalPortal";
import DetailDrawer, {
  DetailDrawerField,
} from "../../components/common/DetailDrawer";
import TableIconActionButton, {
  TableIconActions,
} from "../../components/common/TableIconActionButton";
import "./ManageJobs.css";

function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [selectedJob, setSelectedJob] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const [updateId, setUpdateId] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [status, setStatus] = useState("ACTIVE");

  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showToast, setShowToast] = useState(false);
  let deleteTimer = null;

  const token = localStorage.getItem("token");

  /* ================= LOAD JOBS ================= */
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/admin/jobs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toast.error("Failed to load jobs.");
        setJobs([]);
        setFiltered([]);
        return;
      }

      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      setJobs(list);
      setFiltered(list);
    } catch (err) {
      console.error(err);
      toast.error("Could not load jobs.");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  /* ================= SEARCH ================= */
  const handleSearch = useCallback(
    (val) => {
      const keyword = val.toLowerCase();

      const result = jobs.filter((j) =>
        j.job_title?.toLowerCase().includes(keyword) ||
        j.department?.toLowerCase().includes(keyword) ||
        j.location?.toLowerCase().includes(keyword) ||
        String(j.experience || "")
          .toLowerCase()
          .includes(keyword)
      );

      setFiltered(result);
    },
    [jobs]
  );

  useEffect(() => {
    handleSearch(search);
  }, [search, handleSearch]);

  /* ================= VIEW ================= */
  const viewJob = (job) => {
    setSelectedJob(job);
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setSelectedJob(null);
  };

  /* ================= UPDATE ================= */
  const openUpdateModal = (id, currentStatus) => {
    setUpdateId(id);
    setStatus(currentStatus);
    setShowUpdateModal(true);
  };

  const confirmUpdate = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/jobs/status/${updateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Failed to update job status.");
        return;
      }

      toast.success(data.message || "Job status updated.");
      setShowUpdateModal(false);
      closeSidebar();
      loadJobs();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while updating job status.");
    }
  };

  /* ================= DELETE ================= */
  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    setShowDeleteModal(false);
    setShowToast(true);

    deleteTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/admin/jobs/${deleteId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toast.error(data.message || "Failed to delete job.");
        } else {
          toast.success(data.message || "Job deleted successfully.");
        }
      } catch (e) {
        console.error(e);
        toast.error("Could not delete job.");
      } finally {
        setShowToast(false);
        loadJobs();
      }
    }, 5000);
  };

  const undoDelete = () => {
    clearTimeout(deleteTimer);
    setShowToast(false);
  };

  return (
    <Layout role="admin">
      <div className="manage-jobs-page">

        {/* SEARCH */}
        <div className="jobs-toolbar">
          <div></div>
          <input
            type="text"
            placeholder="Search by job title, department, location, or experience"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
                <tr>
                <th>Job Title</th>
                <th>Department</th>
                <th>Status</th>
                <th>Posted Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5">Loading jobs...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5">No jobs found</td>
                </tr>
              ) : (
                filtered.map((job) => {
                  const isActive =
                    job.status?.toUpperCase() === "ACTIVE";

                  return (
                    <tr key={job.id}>
                      <td>{job.job_title}</td>
                      <td>{job.department}</td>

                      <td>
                        <span
                          className={`status ${
                            isActive
                              ? "active-status"
                              : "inactive-status"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>

                      <td>
                        {job.posted_date?.split("T")[0]}
                      </td>

                      <td>
                        <TableIconActions>
                          <TableIconActionButton
                            variant="view"
                            tooltip="View job details"
                            onClick={() => viewJob(job)}
                          />
                          <TableIconActionButton
                            variant="update"
                            tooltip="Update job status"
                            onClick={() =>
                              openUpdateModal(job.id, job.status)
                            }
                          />
                          <TableIconActionButton
                            variant="delete"
                            tooltip="Delete job"
                            onClick={() => openDeleteModal(job.id)}
                          />
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
          open={showSidebar && !!selectedJob}
          onClose={closeSidebar}
          title="Job Details"
          titleId="job-drawer-title"
          size="lg"
        >
          {selectedJob && (
            <>
              <DetailDrawerField label="Title">
                {selectedJob.job_title || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Department">
                {selectedJob.department || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Location">
                {selectedJob.location || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Experience">
                {selectedJob.experience || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Status">
                <p className="status-highlight">{selectedJob.status || "-"}</p>
              </DetailDrawerField>
              <DetailDrawerField label="Posted date">
                {selectedJob.posted_date?.split("T")[0] || "-"}
              </DetailDrawerField>
            </>
          )}
        </DetailDrawer>

        <ModalPortal open={showUpdateModal}>
          <div
            className="modal-overlay"
            onClick={() => setShowUpdateModal(false)}
            role="presentation"
          >
            <div
              className="modal-card"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>Update Job Status</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowUpdateModal(false)}
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn cancel"
                  onClick={() => setShowUpdateModal(false)}
                >
                  Cancel
                </button>

                <button type="button" className="btn primary" onClick={confirmUpdate}>
                  Update
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>

        <ModalPortal open={showDeleteModal}>
          <div
            className="custom-delete-overlay"
            onClick={() => setShowDeleteModal(false)}
            role="presentation"
          >
            <div
              className="custom-delete-box"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Delete Job</h2>

              <p>Are you sure you want to delete this job?</p>

              <div className="custom-delete-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancel
                </button>

                <button type="button" className="btn-delete" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>

        <ModalPortal open={showToast} lockBodyScroll={false}>
          <div className="undo-toast show">
            Job deleted successfully
            <button type="button" onClick={undoDelete}>
              Undo
            </button>
          </div>
        </ModalPortal>
      </div>
    </Layout>
  );
}

export default ManageJobs;