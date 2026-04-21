import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { refreshNotificationsInbox } from "../../utils/refreshNotificationsInbox";
import { getApiBaseUrl } from "../../utils/getApiBaseUrl";
import "./JobDetails.css";

function JobDetails() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const jobId = searchParams.get("id");

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [resume, setResume] = useState(null);

  useEffect(() => {
    if (jobId) {
      loadJobDetails();
      checkIfAlreadyApplied();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${getApiBaseUrl()}/jobs/public-job/${jobId}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const data = await response.json();
      setJob(data);
    } catch (error) {
      console.error("Error loading job details:", error);
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const checkIfAlreadyApplied = async () => {
    const token = localStorage.getItem("token");
    if (!token || !jobId) return;

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/jobs/check-application/${jobId}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const data = await response.json();

      if (data.applied) {
        setApplied(true);
      }
    } catch (error) {
      console.error("Check applied error:", error);
    }
  };

  const handleApply = async () => {
    const token = localStorage.getItem("token");

    // ✅ If not logged in, return back to SAME job details page after login
    if (!token) {
      localStorage.setItem("redirectAfterLogin", `/job-details?id=${jobId}`);
      toast.warning("Please login first to apply");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
      return;
    }

    // ✅ Logged in but no resume
    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }

    try {
      setApplying(true);

      const formData = new FormData();
      formData.append("resume", resume);

      // change to job_id if your backend expects job_id
      formData.append("jobId", jobId);

      const response = await fetch(`${getApiBaseUrl()}/jobs/apply`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to apply for job");
        return;
      }

      setApplied(true);

      if (data.emailStatus === "failed") {
        toast.warning(
          `Application submitted. Confirmation email was not sent${
            data.emailError ? `: ${data.emailError}` : ""
          }. Check backend .env (EMAIL_USER and a Gmail App Password for EMAIL_PASS).`
        );
      } else if (data.emailStatus === "skipped") {
        toast.success(
          "Application submitted successfully. No email address on your account for a confirmation message."
        );
      } else {
        toast.success("Application submitted successfully!");
      }
      refreshNotificationsInbox();

      setTimeout(() => {
        navigate("/user/applications");
      }, 1200);
    } catch (error) {
      console.error("Apply error:", error);
      toast.error("Something went wrong");
    } finally {
      setApplying(false);
    }
  };

  const handleBack = () => {
    const role = localStorage.getItem("role");

    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "recruiter") {
      navigate("/recruiter/dashboard");
    } else if (role === "user") {
      navigate("/user/dashboard");
    } else {
      navigate("/");
    }
  };

  if (loading) {
    return (
      <section className="job-details-section">
        <div className="container">
          <div className="job-details-card">
            <h2>Loading...</h2>
          </div>
        </div>
      </section>
    );
  }

  if (!job) {
    return (
      <section className="job-details-section">
        <div className="container">
          <div className="job-details-card">
            <h2>Job Details</h2>
            <p className="error-text">Failed to load job details.</p>
            <button className="back-btn" onClick={handleBack}>
              Back
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="job-details-section">
      <div className="container">
        <div className="job-details-card">
          <h2>{job.job_title || "N/A"}</h2>

          <p>
            <strong>Department:</strong> {job.department || "N/A"}
          </p>
          <p>
            <strong>Location:</strong> {job.location || "N/A"}
          </p>
          <p>
            <strong>Experience:</strong> {job.experience || "N/A"}
          </p>
          <p>
            <strong>Status:</strong> {job.status || "N/A"}
          </p>
          <p>
            <strong>Description:</strong>
          </p>
          <p className="job-description">
            {job.description || "No description available"}
          </p>

          {/* ✅ Resume upload shown on same details page */}
          <div className="resume-upload-section">
            <label htmlFor="resumeUpload" className="resume-label">
              Upload Resume
            </label>
            <input
              id="resumeUpload"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResume(e.target.files[0])}
            />
            {resume && <p className="resume-file-name">{resume.name}</p>}
          </div>

          <div className="job-actions">
            <button className="back-btn" onClick={handleBack}>
              Back
            </button>

            <button
              className={`apply-btn ${applied ? "applied-btn" : ""}`}
              onClick={handleApply}
              disabled={applied || applying}
            >
              {applied ? "Applied" : applying ? "Applying..." : "Apply Now"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default JobDetails;