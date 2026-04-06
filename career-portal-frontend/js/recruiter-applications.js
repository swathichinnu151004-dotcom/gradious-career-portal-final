const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "recruiter") {
  alert("Please login as recruiter first");
  window.location.href = "../login.html";
}

function recruiterLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  window.location.href = "../login.html";
}

function getStatusLabel(status) {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  switch (normalizedStatus) {
    case "APPLIED":
      return "Applied";
    case "PENDING":
      return "Pending";
    case "SHORTLISTED":
      return "Shortlisted";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending";
  }
}

function getStatusClass(status) {
  const normalizedStatus = String(status || "").trim().toUpperCase();

  switch (normalizedStatus) {
    case "APPLIED":
      return "status-applied";
    case "PENDING":
      return "status-pending";
    case "SHORTLISTED":
      return "status-shortlisted";
    case "REJECTED":
      return "status-rejected";
    default:
      return "status-pending";
  }
}

function formatDate(dateValue) {
  return dateValue ? String(dateValue).split("T")[0] : "-";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function loadRecruiterApplications() {
  const tbody = document.getElementById("applicationsTableBody");

  try {
    const response = await fetch("http://localhost:5000/api/recruiter/applications", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const applications = await response.json();

    if (!response.ok) {
      tbody.innerHTML = `<tr><td colspan="5">${applications.message || "Failed to load applications"}</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    if (!applications || applications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No applications found</td></tr>`;
      return;
    }

    applications.forEach((app) => {
      const applicantName = app.applicant_name || app.user_name || app.name || "-";
      const jobTitle = app.job_title || "-";
      const appliedDate = formatDate(app.applied_date);
      const statusLabel = getStatusLabel(app.status);
      const statusClass = getStatusClass(app.status);
      const normalizedStatus = String(app.status || "").trim().toUpperCase();

      const disableShortlist = normalizedStatus === "SHORTLISTED";
      const disableReject = normalizedStatus === "REJECTED";

      const safeApp = {
        id: app.id,
        applicant_name: applicantName,
        job_title: jobTitle,
        status: statusLabel,
        applied_date: appliedDate
      };

      const row = `
        <tr>
          <td>${escapeHtml(applicantName)}</td>
          <td>${escapeHtml(jobTitle)}</td>
          <td>
            <span class="status ${statusClass}">
              ${escapeHtml(statusLabel)}
            </span>
          </td>
          <td>${escapeHtml(appliedDate)}</td>
          <td class="action-buttons">
            <button class="view-btn" onclick='viewApplication(${JSON.stringify(safeApp)})'>
              <i class="fa-solid fa-eye"></i> View
            </button>

            <button class="shortlist-btn" onclick="updateApplicationStatus(${app.id}, 'Shortlisted')">
  Shortlist
</button>

<button class="reject-btn" onclick="updateApplicationStatus(${app.id}, 'Rejected')">
  Reject
</button>
          </td>
        </tr>
      `;

      tbody.innerHTML += row;
    });

  } catch (error) {
    console.log("Applications error:", error);
    tbody.innerHTML = `<tr><td colspan="5">Server error while loading applications</td></tr>`;
  }
}

function viewApplication(app) {
  document.getElementById("appName").innerText =
    app.applicant_name || "N/A";

  document.getElementById("appJob").innerText =
    app.job_title || "N/A";

  document.getElementById("appStatus").innerText =
    app.status || "N/A";

  document.getElementById("appDate").innerText =
    app.applied_date || "N/A";

  document.getElementById("viewApplicationModal").style.display = "block";
}

function closeApplicationModal() {
  document.getElementById("viewApplicationModal").style.display = "none";
}

window.addEventListener("click", function (e) {
  const modal = document.getElementById("viewApplicationModal");
  if (e.target === modal) {
    closeApplicationModal();
  }
});

async function updateApplicationStatus(applicationId, status) {
  try {
    const response = await fetch(`http://localhost:5000/api/recruiter/applications/status/${applicationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update application status");
      return;
    }

    loadRecruiterApplications();

  } catch (error) {
    console.log("Update application error:", error);
    alert("Server error while updating application");
  }
}

function searchApplications() {
  const input = document.getElementById("applicationSearch").value.toLowerCase();
  const rows = document.querySelectorAll("#applicationsTableBody tr");

  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(input) ? "" : "none";
  });
}

window.addEventListener("DOMContentLoaded", loadRecruiterApplications);