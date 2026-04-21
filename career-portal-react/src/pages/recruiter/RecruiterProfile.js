import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import "./RecruiterProfile.css";

function RecruiterProfile() {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company_name: "",
    location: "",
    status: "",
  });

  const loadProfile = useCallback(async (signal) => {
    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) return;

      const res = await fetch(`${getApiBaseUrl()}/recruiter/profile`, {
        signal,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Failed to load profile";
        console.error(msg);
        toast.error(msg);
        return;
      }

      const formattedProfile = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        company_name: data.company_name || "",
        location: data.location || "",
        status: data.status || "ACTIVE",
      };

      setProfile(formattedProfile);
      setFormData(formattedProfile);
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("Profile error:", err);
      toast.error("Could not load profile.");
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void loadProfile(ac.signal);
    return () => ac.abort();
  }, [loadProfile]);

  const handleEdit = () => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      company_name: profile?.company_name || "",
      location: profile?.location || "",
      status: profile?.status || "ACTIVE",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      company_name: profile?.company_name || "",
      location: profile?.location || "",
      status: profile?.status || "ACTIVE",
    });
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      const authToken = localStorage.getItem("token");
      if (!authToken) {
        toast.error("Session expired. Please sign in again.");
        return;
      }

      const payload = {
        name: formData.name?.trim() || "",
        email: formData.email?.trim() || "",
        phone: formData.phone?.trim() || "",
        company_name: formData.company_name?.trim() || "",
        location: formData.location?.trim() || "",
      };

      const res = await fetch(`${getApiBaseUrl()}/recruiter/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Failed to update profile";
        console.error(msg);
        toast.error(msg);
        return;
      }

      const updatedProfile = {
        ...profile,
        ...payload,
      };

      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setIsEditing(false);
      localStorage.setItem("name", payload.name);
      toast.success("Profile updated successfully.");
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating profile.");
    }
  };

  return (
    <Layout
      role="recruiter"
      title="Profile"
      subtitle={
        profile ? "Manage your recruiter details" : "Loading your details…"
      }
    >
      {!profile ? (
        <div className="loading">Loading profile...</div>
      ) : (
        <div className="profile-page">
        <div className="profile-header">
          <h2>Recruiter Profile</h2>

          {!isEditing && (
            <button type="button" className="edit-btn" onClick={handleEdit}>
              Edit Profile
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="profile-grid">
            <div className="profile-card">
              <label>Name</label>
              <p>{profile.name || "-"}</p>
            </div>

            <div className="profile-card">
              <label>Email</label>
              <p>{profile.email || "-"}</p>
            </div>

            <div className="profile-card">
              <label>Phone</label>
              <p>{profile.phone || "-"}</p>
            </div>

            <div className="profile-card">
              <label>Company</label>
              <p>{profile.company_name || "-"}</p>
            </div>

            <div className="profile-card">
              <label>Location</label>
              <p>{profile.location || "-"}</p>
            </div>

            <div className="profile-card">
              <label>Status</label>
              <p className={`status ${profile.status?.toLowerCase()}`}>
                {profile.status || "-"}
              </p>
            </div>
          </div>
        ) : (
          <form className="profile-form" onSubmit={handleSave}>
            <div className="profile-grid">
              <div className="profile-card">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="profile-card">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="profile-card">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-card">
                <label>Company</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name || ""}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-card">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-actions">
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
        )}
        </div>
      )}
    </Layout>
  );
}

export default RecruiterProfile;