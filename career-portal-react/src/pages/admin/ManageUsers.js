import { useEffect, useMemo, useState } from "react";
import Layout from "../../components/common/Layout";
import ModalPortal from "../../components/common/ModalPortal";
import DetailDrawer, {
  DetailDrawerField,
} from "../../components/common/DetailDrawer";
import TableIconActionButton, {
  TableIconActions,
} from "../../components/common/TableIconActionButton";
import { toast } from "react-toastify";
import { getAllUsers } from "../../services/adminService";
import "./ManageUsers.css";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [selectedUser, setSelectedUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [deleteUser, setDeleteUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [deletedUser, setDeletedUser] = useState(null);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [deleteTimeoutId, setDeleteTimeoutId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers();
      const userData = Array.isArray(response?.data) ? response.data : [];
      setUsers(userData);
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Could not load users.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (filterType === "active") {
      result = result.filter(
        (user) => (user.status || "Active").toLowerCase() === "active"
      );
    } else if (filterType === "blocked") {
      result = result.filter(
        (user) => (user.status || "").toLowerCase() === "blocked"
      );
    }

    if (searchText.trim()) {
      const keyword = searchText.toLowerCase();
      result = result.filter((user) => {
        const name = (user.name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const phone = String(user.phone || "").toLowerCase();

        return (
          name.includes(keyword) ||
          email.includes(keyword) ||
          phone.includes(keyword)
        );
      });
    }

    return result;
  }, [users, filterType, searchText]);

  const handleView = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setSelectedUser(null);
    setShowViewModal(false);
  };

  const handleToggleStatus = (id) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === id
          ? {
              ...user,
              status:
                (user.status || "Active").toLowerCase() === "active"
                  ? "Blocked"
                  : "Active",
            }
          : user
      )
    );
  };

  const openDeleteModal = (user) => {
    setDeleteUser(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setDeleteUser(null);
    setShowDeleteModal(false);
  };

  const confirmDeleteUser = () => {
    if (!deleteUser) return;

    const removedUser = deleteUser;

    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== deleteUser.id));
    setDeletedUser(removedUser);
    setShowDeleteModal(false);
    setShowUndoToast(true);

    const timeoutId = setTimeout(() => {
      setShowUndoToast(false);
      setDeletedUser(null);
      setDeleteUser(null);
    }, 5000);

    setDeleteTimeoutId(timeoutId);
  };

  const handleUndoDelete = () => {
    if (deleteTimeoutId) {
      clearTimeout(deleteTimeoutId);
    }

    if (deletedUser) {
      setUsers((prevUsers) => [deletedUser, ...prevUsers]);
    }

    setShowUndoToast(false);
    setDeletedUser(null);
    setDeleteUser(null);
  };

  return (
    <Layout
      role="admin"
      title="Manage Users"
      subtitle="View, block, unblock, and delete users"
    >
      <div className="manage-users-page">
        <h2 className="manage-users-title">Manage Users</h2>

        <div className="manage-users-toolbar">
          <div className="manage-users-filters">
            <button
              className={`manage-users-filter-btn ${filterType === "all" ? "active" : ""}`}
              onClick={() => setFilterType("all")}
            >
              All
            </button>

            <button
              className={`manage-users-filter-btn ${filterType === "active" ? "active" : ""}`}
              onClick={() => setFilterType("active")}
            >
              Active
            </button>

            <button
              className={`manage-users-filter-btn ${filterType === "blocked" ? "active" : ""}`}
              onClick={() => setFilterType("blocked")}
            >
              Blocked
            </button>
          </div>

          <div className="manage-users-search">
            <input
              type="text"
              placeholder="Search by name, email, or phone"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="page-loader">
            <div className="loader"></div>
            <span className="loader-text">Loading users...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="empty-text">No users found.</p>
        ) : (
          <div className="manage-users-table-wrapper">
            <table className="manage-users-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const status = user.status || "Active";
                  const isActive = status.toLowerCase() === "active";

                  return (
                    <tr key={user.id}>
                      <td>{user.name || "-"}</td>
                      <td>{user.email || "-"}</td>
                      <td>
                        <span
                          className={`manage-users-status ${
                            isActive ? "active-status" : "blocked-status"
                          }`}
                        >
                          {status}
                        </span>
                      </td>
                      <td>
                        <TableIconActions className="manage-users-actions">
                          <TableIconActionButton
                            variant="view"
                            tooltip="View user details"
                            onClick={() => handleView(user)}
                          />
                          {isActive ? (
                            <TableIconActionButton
                              variant="block"
                              tooltip="Block this user"
                              onClick={() => handleToggleStatus(user.id)}
                            />
                          ) : (
                            <TableIconActionButton
                              variant="unblock"
                              tooltip="Unblock this user"
                              onClick={() => handleToggleStatus(user.id)}
                            />
                          )}
                          <TableIconActionButton
                            variant="delete"
                            tooltip="Delete user"
                            onClick={() => openDeleteModal(user)}
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
          open={showViewModal && !!selectedUser}
          onClose={closeViewModal}
          title="User Details"
          titleId="view-user-title"
        >
          {selectedUser && (
            <>
              <DetailDrawerField label="Name">
                {selectedUser.name || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Email">
                {selectedUser.email || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Phone">
                {selectedUser.phone || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="City">
                {selectedUser.city || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Qualification">
                {selectedUser.qualification || "-"}
              </DetailDrawerField>
              <DetailDrawerField label="Status">
                {selectedUser.status || "Active"}
              </DetailDrawerField>
            </>
          )}
        </DetailDrawer>

        <ModalPortal open={showDeleteModal && !!deleteUser}>
          {deleteUser && (
            <div
              className="delete-modal-overlay"
              onClick={closeDeleteModal}
              role="presentation"
            >
              <div
                className="delete-modal"
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="delete-modal-icon">
                  <i className="fa-solid fa-trash"></i>
                </div>

                <h3>Delete User</h3>
                <p>
                  Are you sure you want to delete this user? This action cannot
                  be undone.
                </p>

                <div className="delete-modal-actions">
                  <button
                    type="button"
                    className="cancel-delete-btn"
                    onClick={closeDeleteModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="confirm-delete-btn"
                    onClick={confirmDeleteUser}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </ModalPortal>

        <ModalPortal open={showUndoToast} lockBodyScroll={false}>
          <div className={`undo-toast ${showUndoToast ? "show" : ""}`}>
            <span>User deleted successfully</span>
            <button type="button" onClick={handleUndoDelete}>
              Undo
            </button>
          </div>
        </ModalPortal>
      </div>
    </Layout>
  );
}

export default ManageUsers;