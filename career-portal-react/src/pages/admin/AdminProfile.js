import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import "../../components/common/layout.css";
import "../user/UserProfile";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";

function AdminProfile() {
  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    qualification: "",
    status: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    qualification: "",
  });

  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const loadAdminProfile = useCallback(async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(`${getApiBaseUrl()}/admin/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("Admin profile data =>", data);

      if (res.ok) {
        setAdmin(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          city: data.city || "",
          qualification: data.qualification || "",
        });
      } else {
        const msg = data.message || "Failed to load profile";
        setMessage(msg);
        toast.error(msg);
      }
    } catch (error) {
      console.error("Load admin profile error:", error);
      setMessage("Something went wrong while loading profile");
      toast.error("Something went wrong while loading profile");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAdminProfile();
  }, [loadAdminProfile]);

  const handleEditClick = () => {
    setEditMode(true);
    setMessage("");
    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      city: admin.city || "",
      qualification: admin.qualification || "",
    });
  };

  const handleCancel = () => {
    setEditMode(false);
    setMessage("");
    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      city: admin.city || "",
      qualification: admin.qualification || "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setMessage("");

      const res = await fetch(`${getApiBaseUrl()}/admin/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      console.log("Update profile response =>", data);

      if (res.ok) {
        const updatedAdmin = {
          ...admin,
          ...formData,
        };

        setAdmin(updatedAdmin);
        setEditMode(false);
        const okMsg = data.message || "Profile updated successfully";
        setMessage(okMsg);
        toast.success(okMsg);
      } else {
        const msg = data.message || "Failed to update profile";
        setMessage(msg);
        toast.error(msg);
      }
    } catch (error) {
      console.error("Update admin profile error:", error);
      setMessage("Something went wrong while updating profile");
      toast.error("Something went wrong while updating profile");
    }
  };

  return (
    <Layout role="admin">
      <div className="profile-page">
        <div className="profile-card">
          {loading ? (
            <div className="profile-loader">Loading profile...</div>
          ) : (
            <>
              <div className="profile-card-header">
                <div>
                  <h2>Admin Profile</h2>
                  <p>Manage your account details</p>
                </div>

                {!editMode && (
                  <button
                    className="edit-profile-btn"
                    onClick={handleEditClick}
                    type="button"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {message && <div className="profile-message">{message}</div>}

              {!editMode ? (
                <div className="profile-grid">
                  <div className="detail-box">
                    <span>Name</span>
                    <h4>{admin.name || "Not Provided"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>Email</span>
                    <h4>{admin.email || "Not Provided"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>Phone</span>
                    <h4>{admin.phone || "Not Provided"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>City</span>
                    <h4>{admin.city || "Not Provided"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>Qualification</span>
                    <h4>{admin.qualification || "Not Provided"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>Status</span>
                    <h4 className={admin.status === "Active" ? "status-active" : ""}>
                      {admin.status || "Not Provided"}
                    </h4>
                  </div>
                </div>
              ) : (
                <div className="profile-form">
                  <div className="profile-grid">
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label>Qualification</label>
                      <input
                        type="text"
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button
                      className="save-btn"
                      onClick={handleSave}
                      type="button"
                    >
                      Save Changes
                    </button>

                    <button
                      className="cancel-btn"
                      onClick={handleCancel}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AdminProfile;