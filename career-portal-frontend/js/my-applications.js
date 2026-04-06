const API_BASE_URL = "http://localhost:5000/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../login.html";
  throw new Error("No token found");
}

/* =========================
   LOGOUT
========================= */
function userLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  window.location.href = "../login.html";
}

/* =========================
   LOAD USER INFO
========================= */
function loadUserInfo() {
  const userNameEl = document.getElementById("userName");

  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser && storedUser.name && userNameEl) {
      userNameEl.textContent = storedUser.name;
    } else {
      userNameEl.textContent = "User";
    }
  } catch (error) {
    console.error("User info load error:", error);
    if (userNameEl) {
      userNameEl.textContent = "User";
    }
  }
}

/* =========================
   FORMAT DATE
========================= */
function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB"); 
  // output example: 29/03/2026
}

/* =========================
   GET STATUS STYLE
========================= */
function getStatusInfo(statusValue) {
  const status = (statusValue || "").trim().toLowerCase();

  switch (status) {
    case "shortlisted":
      return { className: "shortlisted", label: "Shortlisted" };

    case "rejected":
      return { className: "rejected", label: "Rejected" };

    case "pending":
      return { className: "pending", label: "Pending" };

    case "applied":
    default:
      return { className: "applied", label: "Applied" };
  }
}

/* =========================
   LOAD MY APPLICATIONS
========================= */
async function loadMyApplications() {
  const tbody = document.getElementById("applicationsTableBody");

  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="5">Loading applications...</td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/jobs/my-applications`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const applications = await response.json();
    tbody.innerHTML = "";

    if (!response.ok) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">${applications.message || "Failed to load applications"}</td>
        </tr>
      `;
      return;
    }

    if (!Array.isArray(applications) || applications.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">No applications found</td>
        </tr>
      `;
      return;
    }

    applications.forEach((app) => {
      const statusInfo = getStatusInfo(app.status);
      const appliedDate = formatDate(app.applied_date);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${app.job_title || "-"}</td>
        <td>${app.department || "-"}</td>
        <td>${app.location || "-"}</td>
        <td>${appliedDate}</td>
        <td>
          <span class="status ${statusInfo.className}">
            ${statusInfo.label}
          </span>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (error) {
    console.error("Applications error:", error);
    tbody.innerHTML = `
      <tr>
        <td colspan="5">Server error</td>
      </tr>
    `;
  }
}

/* =========================
   INIT
========================= */
window.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  loadMyApplications();
});