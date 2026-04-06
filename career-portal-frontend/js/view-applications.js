const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const API_BASE_URL = "http://localhost:5000/api";

let allApplications = [];
let notificationsLoaded = false;
let currentFilter = "All";

// ===============================
// AUTH CHECK
// ===============================
if (!token || role !== "admin") {
  window.location.href = "../login.html";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.location.href = "../login.html";
}

// ===============================
// TOAST MESSAGE
// ===============================
function showToast(message, type = "success") {
  let toast = document.getElementById("customToast");

  if (!toast) {
    toast = document.createElement("div");
    toast.id = "customToast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `custom-toast ${type}`;
  toast.style.display = "block";
  toast.style.opacity = "1";
  toast.style.transform = "translateY(0)";

  clearTimeout(toast.hideTimeout);
  toast.hideTimeout = setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-10px)";
    setTimeout(() => {
      toast.style.display = "none";
    }, 300);
  }, 2500);
}

// ===============================
// NORMALIZE STATUS
// ===============================
function normalizeStatus(status) {
  const value = String(status || "Applied").trim().toLowerCase();

  if (value === "pending") return "Applied";
  if (value === "applied") return "Applied";
  if (value === "shortlisted") return "Shortlisted";
  if (value === "rejected") return "Rejected";
  if (value === "reviewed") return "Reviewed";

  return "Applied";
}

// ===============================
// LOAD APPLICATIONS
// ===============================
async function loadApplications() {
  const tbody = document.getElementById("applicationsTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5">Loading applications...</td></tr>`;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      tbody.innerHTML = `<tr><td colspan="5">${data.message || "Failed to load applications"}</td></tr>`;
      return;
    }

    allApplications = Array.isArray(data) ? data : [];

    if (allApplications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No applications found</td></tr>`;
      return;
    }

    applyFilters();
  } catch (error) {
    console.log("Load applications error:", error);
    tbody.innerHTML = `<tr><td colspan="5">Server error while loading applications</td></tr>`;
  }
}

// ===============================
// RENDER APPLICATIONS
// ===============================
function renderApplications(applications) {
  const tbody = document.getElementById("applicationsTableBody");
  if (!tbody) return;

  if (!Array.isArray(applications) || applications.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">No applications found</td></tr>`;
    return;
  }

  tbody.innerHTML = applications.map((app) => {
    const safeStatus = normalizeStatus(app.status);
    let statusClass = "applied-status";

    if (safeStatus === "Shortlisted") {
      statusClass = "shortlisted-status";
    } else if (safeStatus === "Rejected") {
      statusClass = "rejected-status";
    } else if (safeStatus === "Reviewed") {
      statusClass = "reviewed-status";
    } else if (safeStatus === "Applied") {
      statusClass = "pending-status";
    }

    let actionButtons = `
      <button class="view-btn" onclick="viewApplication(${app.id})">
        <i class="fa-solid fa-eye"></i> View
      </button>
    `;

    if (safeStatus === "Applied") {
      actionButtons += `
        <button class="shortlist-btn" onclick="updateApplicationStatus(${app.id}, 'Shortlisted')">
          <i class="fa-solid fa-check"></i> Shortlist
        </button>
        <button class="reject-btn" onclick="confirmStatusChange(${app.id}, 'Rejected')">
          <i class="fa-solid fa-xmark"></i> Reject
        </button>
      `;
    } else if (safeStatus === "Shortlisted") {
      actionButtons += `
        <button class="reject-btn" onclick="confirmStatusChange(${app.id}, 'Rejected')">
          <i class="fa-solid fa-xmark"></i> Reject
        </button>
      `;
    } else if (safeStatus === "Rejected") {
      actionButtons += `
        <button class="disabled-btn" disabled>
          No Actions
        </button>
      `;
    }

    return `
      <tr>
        <td>${app.applicant_name || app.name || "N/A"}</td>
        <td>${app.job_title || "Job Not Found"}</td>
        <td>${app.applied_date ? String(app.applied_date).split("T")[0] : "N/A"}</td>
        <td>
          <span class="${statusClass}">${safeStatus}</span>
        </td>
        <td class="action-cell">
          ${actionButtons}
        </td>
      </tr>
    `;
  }).join("");
}

// ===============================
// FILTER BY STATUS
// ===============================
function filterByStatus(status) {
  currentFilter = status;

  document.querySelectorAll(".status-filters button").forEach((btn) => {
    btn.classList.remove("active-filter");

    if (btn.innerText.trim() === status) {
      btn.classList.add("active-filter");
    }
  });

  applyFilters();
}

// ===============================
// APPLY SEARCH + STATUS FILTERS
// ===============================
function applyFilters() {
  const input = document.getElementById("applicationSearch");
  const keyword = input ? input.value.toLowerCase().trim() : "";

  let filteredApplications = [...allApplications];

  if (keyword) {
    filteredApplications = filteredApplications.filter((app) =>
      String(app.applicant_name || app.name || "N/A").toLowerCase().includes(keyword) ||
      String(app.job_title || "Job Not Found").toLowerCase().includes(keyword)
    );
  }

  if (currentFilter !== "All") {
    filteredApplications = filteredApplications.filter((app) => {
      return normalizeStatus(app.status) === currentFilter;
    });
  }

  renderApplications(filteredApplications);
}

// ===============================
// SEARCH APPLICATIONS
// ===============================
function searchApplications() {
  applyFilters();
}

// ===============================
// VIEW APPLICATION
// ===============================
function viewApplication(id) {
  const app = allApplications.find((item) => Number(item.id) === Number(id));

  if (!app) {
    showToast("Application details not found", "error");
    return;
  }

  document.getElementById("detailApplicantName").textContent =
    app.applicant_name || app.name || "N/A";
  document.getElementById("detailJobTitle").textContent =
    app.job_title || "Job Not Found";
  document.getElementById("detailAppliedDate").textContent =
    app.applied_date ? String(app.applied_date).split("T")[0] : "-";
  document.getElementById("detailApplicationStatus").textContent =
    normalizeStatus(app.status);

  document.getElementById("applicationSidebar").classList.add("active");
  document.getElementById("applicationSidebarOverlay").classList.add("active");
}

function closeApplicationSidebar() {
  document.getElementById("applicationSidebar").classList.remove("active");
  document.getElementById("applicationSidebarOverlay").classList.remove("active");
}

// ===============================
// CONFIRM STATUS CHANGE
// ===============================
function confirmStatusChange(id, status) {
  const confirmBox = document.getElementById("confirmModal");
  const confirmText = document.getElementById("confirmModalText");
  const confirmYesBtn = document.getElementById("confirmYesBtn");

  if (!confirmBox || !confirmText || !confirmYesBtn) {
    updateApplicationStatus(id, status);
    return;
  }

  confirmText.textContent = `Are you sure you want to mark this application as ${status}?`;

  confirmYesBtn.onclick = async function () {
    closeConfirmModal();
    await updateApplicationStatus(id, status);
  };

  confirmBox.classList.add("active");
}

function closeConfirmModal() {
  const confirmBox = document.getElementById("confirmModal");
  if (confirmBox) {
    confirmBox.classList.remove("active");
  }
}

// ===============================
// UPDATE APPLICATION STATUS
// ===============================
async function updateApplicationStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/applications/status/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to update application status", "error");
      return;
    }

    showToast(data.message || `Application marked as ${status}`, "success");
    await loadApplications();
  } catch (error) {
    console.log("Update application status error:", error);
    showToast("Server error while updating application status", "error");
  }
}

// ===============================
// NOTIFICATIONS
// ===============================
async function loadNotificationCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/notifications/count`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById("notificationCount").textContent = data.count || 0;
    }
  } catch (error) {
    console.log("Error loading notification count:", error);
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById("notificationDropdown");
  if (!dropdown) return;

  if (dropdown.style.display === "block") {
    dropdown.style.display = "none";
  } else {
    dropdown.style.display = "block";

    if (!notificationsLoaded) {
      loadNotifications();
      notificationsLoaded = true;
    }
  }
}

async function loadNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();
    const notificationList = document.getElementById("notificationList");
    const notificationCount = document.getElementById("notificationCount");

    if (!notificationList || !notificationCount) return;

    notificationList.innerHTML = "";

    if (response.ok) {
      notificationCount.textContent = data.length || 0;

      if (data.length === 0) {
        notificationList.innerHTML = "<li class='no-data'>No notifications found</li>";
      } else {
        data.forEach((item) => {
          const li = document.createElement("li");
          li.textContent = `${item.applicant_name || item.name || "User"} applied for ${item.job_title || "a job"}`;
          notificationList.appendChild(li);
        });
      }
    } else {
      notificationList.innerHTML = `<li class='no-data'>${data.message}</li>`;
    }
  } catch (error) {
    const notificationList = document.getElementById("notificationList");
    if (notificationList) {
      notificationList.innerHTML = "<li class='no-data'>Error loading notifications</li>";
    }
  }
}

function clearNotifications(event) {
  event.stopPropagation();

  const notificationList = document.getElementById("notificationList");
  const notificationCount = document.getElementById("notificationCount");

  if (notificationList) {
    notificationList.innerHTML = `<li class="no-data">No new notifications</li>`;
  }

  if (notificationCount) {
    notificationCount.textContent = "0";
  }
}

function closeNotifications(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("notificationDropdown");
  if (dropdown) {
    dropdown.style.display = "none";
  }
}

window.addEventListener("click", (event) => {
  const dropdown = document.getElementById("notificationDropdown");
  const notification = document.querySelector(".notification");

  if (dropdown && notification && !notification.contains(event.target)) {
    dropdown.style.display = "none";
  }
});

// ===============================
// PAGE LOAD
// ===============================
window.addEventListener("DOMContentLoaded", () => {
  loadApplications();
  loadNotificationCount();

  const searchInput = document.getElementById("applicationSearch");
  if (searchInput) {
    searchInput.addEventListener("input", searchApplications);
  }
});