import { useState } from "react";
import { toast } from "react-toastify";
import Layout from "../../components/common/Layout";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import "./postJob.css";

function PostJob() {
  const [formData, setFormData] = useState({
    jobTitle: "",
    department: "",
    location: "",
    experience: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("");

  const token = localStorage.getItem("token");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showMessage = (msg, type = "") => {
    setMessage(msg);
    setType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { jobTitle, department, location, experience, description } = formData;

    if (!jobTitle || !department || !location || !experience || !description) {
      showMessage("Please fill all fields.", "error");
      toast.warning("Please fill all fields.");
      return;
    }

    setLoading(true);
    showMessage("");

    try {
      const res = await fetch(`${getApiBaseUrl()}/recruiter/jobs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          job_title: jobTitle,
          department,
          location,
          experience,
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || "Failed to post job";
        showMessage(msg, "error");
        toast.error(msg);
        return;
      }

      const okMsg = data.message || "Job posted successfully";
      showMessage(okMsg, "success");
      toast.success(okMsg);

      setFormData({
        jobTitle: "",
        department: "",
        location: "",
        experience: "",
        description: "",
      });

      setTimeout(() => {
        window.location.href = "/recruiter/jobs";
      }, 1500);
    } catch (err) {
      console.error(err);
      showMessage("Server error. Try again.", "error");
      toast.error("Server error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout role="recruiter">
      <div className="recruiter-main">

        {/* TOPBAR */}
        <div className="recruiter-topbar">
          <div className="topbar-left">
            <h1>Post Job</h1>
            <p>Create and publish a new job opening</p>
          </div>
        </div>

        {/* FORM */}
        <section className="post-job-section">
          <form className="post-job-form" onSubmit={handleSubmit}>

            <div className="form-row">
              <div className="form-group">
                <label>Job Title</label>
                <input
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Enter job title"
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter department"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Enter location"
                />
              </div>

              <div className="form-group">
                <label>Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="Example: 2+ Years"
                />
              </div>
            </div>

            <div className="form-row single">
              <div className="form-group full-width">
                <label>Job Description</label>
                <textarea
                  name="description"
                  rows="6"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter job description"
                />
              </div>
            </div>

            {/* MESSAGE */}
            {message && (
              <p className={`form-message ${type}`}>{message}</p>
            )}

            {/* BUTTON */}
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Posting..." : "Post Job"}
              </button>
            </div>

          </form>
        </section>

      </div>
    </Layout>
  );
}

export default PostJob;