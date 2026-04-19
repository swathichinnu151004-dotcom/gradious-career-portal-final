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
import "./ManageRecruiters.css";

function ManageRecruiters() {
  const [recruiters, setRecruiters] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const token = localStorage.getItem("token");

  /* ================= LOAD RECRUITERS ================= */
  const loadRecruiters = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/admin/recruiters", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      const list = Array.isArray(data) ? data : [];
      setRecruiters(list);
      setFiltered(list);
    } catch (err) {
      console.error("Load recruiters error:", err);
      toast.error("Could not load recruiters.");
      setRecruiters([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRecruiters();
  }, [loadRecruiters]);

  /* ================= SEARCH ================= */
  const handleSearch = useCallback(
    (value) => {
      const val = value.toLowerCase();

      const result = recruiters.filter((r) => {
        return (
          r.name?.toLowerCase().includes(val) ||
          r.email?.toLowerCase().includes(val) ||
          r.company_name?.toLowerCase().includes(val)
        );
      });

      setFiltered(result);
    },
    [recruiters]
  );

  useEffect(() => {
    handleSearch(search);
  }, [search, handleSearch]);

  /* ================= VIEW ================= */
  const handleView = (rec) => {
    setSelectedRecruiter(rec);
    setShowSidebar(true);
  };

  const closeSidebar = () => {
    setShowSidebar(false);
    setSelectedRecruiter(null);
  };

  /* ================= STATUS UPDATE ================= */
  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/recruiters/status/${id}`,
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
        toast.error(data.message || "Failed to update recruiter status.");
        return;
      }

      toast.success(data.message || "Recruiter status updated.");
      loadRecruiters();
      closeSidebar();
    } catch (err) {
      console.error("Update status error:", err);
      toast.error("Something went wrong while updating status.");
    }
  };

  /* ================= DELETE ================= */
  const openDeleteModal = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteId(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/recruiters/${deleteId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || "Failed to delete recruiter.");
        return;
      }

      toast.success(data.message || "Recruiter deleted successfully.");
      closeDeleteModal();
      closeSidebar();
      loadRecruiters();
    } catch (err) {
      console.error("Delete recruiter error:", err);
      toast.error("Something went wrong while deleting recruiter.");
    }
  };

  return (
    <Layout role="admin" title="Manage Recruiters">
      <div className="manage-recruiters-page">

        {/* SEARCH */}
        <div className="manage-recruiters-head">
          <input
            type="text"
            placeholder="Search by name, email, or company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        {loading ? (
          <div className="page-loader">Loading recruiters...</div>
        ) : filtered.length === 0 ? (
          <p className="empty-text">No recruiters found.</p>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((r) => {
                  const status = r.status || "Active";
                  const isBlocked = status.toLowerCase() === "blocked";

                  return (
                    <tr key={r.id}>
                      <td>{r.name || "-"}</td>
                      <td>{r.email || "-"}</td>
                      <td>{r.company_name || "-"}</td>

                      <td>
                        <span
                          className={`status-badge ${
                            isBlocked ? "blocked" : "active"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        <TableIconActions>
                          <TableIconActionButton
                            variant="view"
                            tooltip="View recruiter details"
                            onClick={() => handleView(r)}
                          />
                          {isBlocked ? (
                            <TableIconActionButton
                              variant="unblock"
                              tooltip="Unblock this recruiter"
                              onClick={() => updateStatus(r.id, "Active")}
                            />
                          ) : (
                            <TableIconActionButton
                              variant="block"
                              tooltip="Block this recruiter"
                              onClick={() => updateStatus(r.id, "Blocked")}
                            />
                          )}
                          <TableIconActionButton
                            variant="delete"
                            tooltip="Delete recruiter"
                            onClick={() => openDeleteModal(r.id)}
                          />
                        </TableIconActions>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <DetailDrawer
          open={showSidebar && !!selectedRecruiter}
          onClose={closeSidebar}
          title="Recruiter Details"
          titleId="recruiter-drawer-title"
        >
          {selectedRecruiter && (
            <>
              <DetailDrawerField label="Name">
                {selectedRecruiter.name || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Email">
                {selectedRecruiter.email || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Company">
                {selectedRecruiter.company_name || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Phone">
                {selectedRecruiter.phone || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Location">
                {selectedRecruiter.location ||
                  selectedRecruiter.city ||
                  "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Role">
                {selectedRecruiter.role || "recruiter"}
              </DetailDrawerField>
              <DetailDrawerField label="Status">
                <p className="status-highlight">
                  {selectedRecruiter.status || "-"}
                </p>
              </DetailDrawerField>
            </>
          )}
        </DetailDrawer>

        <ModalPortal open={showDeleteModal}>
          <div
            className="delete-modal-overlay active"
            onClick={closeDeleteModal}
            role="presentation"
          >
            <div
              className="delete-modal"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Recruiter</h3>
              <p>Are you sure you want to delete this recruiter?</p>

              <div className="delete-actions">
                <button type="button" onClick={closeDeleteModal}>
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      </div>
    </Layout>
  );
}

export default ManageRecruiters;