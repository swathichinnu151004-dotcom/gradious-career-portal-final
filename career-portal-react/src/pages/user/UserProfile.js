import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import "../../components/common/layout.css";
import "./UserProfile.css";

function UserProfile() {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    qualification: "",
    role: "Job Seeker",
    status: "Active",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    qualification: "",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Failed to load profile.";
        setMessage(msg);
        toast.error(msg);
        return;
      }

      const userData = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        city: data.city || "",
        qualification: data.qualification || "",
        role: data.role || "Job Seeker",
        status: data.status || "Active",
      };

      setProfile(userData);
      setFormData({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        city: userData.city,
        qualification: userData.qualification,
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage("Failed to load profile.");
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEdit = () => {
    setEditing(true);
    setMessage("");
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      city: profile.city,
      qualification: profile.qualification,
    });
    setMessage("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Profile update failed.";
        setMessage(msg);
        toast.error(msg);
        return;
      }

      setMessage("Profile updated successfully.");
      toast.success(data.message || "Profile updated successfully.");
      setEditing(false);

      // Reload latest profile from backend so UI always matches DB
      await loadProfile();
    } catch (error) {
      console.error("Update error:", error);
      setMessage("Something went wrong while updating profile.");
      toast.error("Something went wrong while updating profile.");
    }
  };

  return (
    <Layout
      role="user"
      title="Profile"
      subtitle="View and update your personal information here."
    >
      <div className="profile-page">
        {loading ? (
          <div className="profile-loader">Loading profile...</div>
        ) : (
          <div className="profile-card">
            <div className="profile-card-header">
              <div>
                <h2>User Profile</h2>
                <p>Manage your account details</p>
              </div>

              {!editing && (
                <button className="edit-profile-btn" onClick={handleEdit}>
                  Edit Profile
                </button>
              )}
            </div>

            {message && <div className="profile-message">{message}</div>}

            {editing ? (
              <form className="profile-form" onSubmit={handleUpdate}>
                <div className="profile-grid">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
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
                  <button type="submit" className="save-btn">
                    Save Changes
                  </button>

                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={handleCancel}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="profile-grid">
                  <div className="detail-box">
                    <span>Name</span>
                    <h4>{profile.name || "-"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>Email</span>
                    <h4>{profile.email || "-"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>Phone</span>
                    <h4>{profile.phone || "-"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>City</span>
                    <h4>{profile.city || "-"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>Qualification</span>
                    <h4>{profile.qualification || "-"}</h4>
                  </div>

                  <div className="detail-box">
                    <span>Status</span>
                    <h4 className="status-active">{profile.status || "Active"}</h4>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default UserProfile;