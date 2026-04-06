const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  alert("Access denied. Admin login required.");
  window.location.href = "../login.html";
}

const API_BASE_URL = "http://localhost:5000/api";

let allRecruiters = [];
let deleteRecruiterId = null;
let notificationsLoaded = false;

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.location.href = "../login.html";
}

async function loadRecruiters() {
  const tableBody = document.getElementById("recruitersTableBody");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="8">Loading recruiters...</td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/recruiters`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">${data.message || "Failed to load recruiters."}</td>
        </tr>
      `;
      return;
    }

    allRecruiters = Array.isArray(data) ? data : [];

    if (allRecruiters.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8">No recruiters found.</td>
        </tr>
      `;
      return;
    }

    renderRecruiters(allRecruiters);
  } catch (error) {
    console.error("Load recruiters error:", error);
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">Server error while loading recruiters.</td>
      </tr>
    `;
  }
}

function renderRecruiters(recruiters) {
  const tableBody = document.getElementById("recruitersTableBody");
  if (!tableBody) return;

  if (!Array.isArray(recruiters) || recruiters.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">No recruiters found.</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = recruiters.map((recruiter) => {
    const safeName = recruiter.name || "-";
    const safeEmail = recruiter.email || "-";
    const safeCompany = recruiter.company_name || "-";
    const safePhone = recruiter.phone || "-";
    const safeLocation = recruiter.location || recruiter.city || "-";
    const safeRole = recruiter.role || "recruiter";
    const safeStatus = recruiter.status || "Active";

    const statusText = String(safeStatus).toLowerCase();
    const statusClass = statusText === "blocked" ? "blocked" : "active";

    const actionButton =
      statusText === "blocked"
        ? `
          <button class="unblock-btn" onclick="updateRecruiterStatus(${recruiter.id}, 'Active')">
            <i class="fa-solid fa-check"></i> Unblock
          </button>
        `
        : `
          <button class="block-btn" onclick="updateRecruiterStatus(${recruiter.id}, 'Blocked')">
            <i class="fa-solid fa-ban"></i> Block
          </button>
        `;

    return `
      <tr>
        <td>${safeName}</td>
        <td>${safeEmail}</td>
        <td>${safeCompany}</td>
        <td>${safePhone}</td>
        <td>${safeLocation}</td>
        <td>${safeRole}</td>
        <td>
          <span class="status-badge ${statusClass}">${safeStatus}</span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="view-btn" onclick="viewRecruiter(${recruiter.id})">
              <i class="fa-solid fa-eye"></i> View
            </button>

            ${actionButton}

            <button class="delete-btn" onclick="openDeleteRecruiterModal(${recruiter.id})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function searchRecruiters() {
  const input = document.getElementById("recruiterSearch");
  if (!input) return;

  const value = input.value.toLowerCase().trim();

  const filteredRecruiters = allRecruiters.filter((recruiter) => {
    return (
      String(recruiter.name || "").toLowerCase().includes(value) ||
      String(recruiter.email || "").toLowerCase().includes(value) ||
      String(recruiter.company_name || "").toLowerCase().includes(value)
    );
  });

  renderRecruiters(filteredRecruiters);
}

function viewRecruiter(id) {
  const recruiter = allRecruiters.find((item) => Number(item.id) === Number(id));

  if (!recruiter) {
    console.error("Recruiter not found for ID:", id);
    return;
  }

  document.getElementById("detailName").textContent = recruiter.name || "-";
  document.getElementById("detailEmail").textContent = recruiter.email || "-";
  document.getElementById("detailCompany").textContent = recruiter.company_name || "-";
  document.getElementById("detailPhone").textContent = recruiter.phone || "-";
  document.getElementById("detailLocation").textContent = recruiter.location || recruiter.city || "-";
  document.getElementById("detailRole").textContent = recruiter.role || "recruiter";
  document.getElementById("detailStatus").textContent = recruiter.status || "Active";

  document.getElementById("recruiterSidebar").classList.add("active");
  document.getElementById("recruiterSidebarOverlay").classList.add("active");
}

function closeRecruiterSidebar() {
  document.getElementById("recruiterSidebar").classList.remove("active");
  document.getElementById("recruiterSidebarOverlay").classList.remove("active");
}

async function updateRecruiterStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/recruiters/status/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to update recruiter status", "error");
      return;
    }

    showToast(`Recruiter ${status === "Blocked" ? "blocked" : "unblocked"} successfully`, "success");
    await loadRecruiters();
    closeRecruiterSidebar();
  } catch (error) {
    console.error("Update recruiter status error:", error);
    showToast("Server error while updating recruiter status", "error");
  }
}

function openDeleteRecruiterModal(id) {
  deleteRecruiterId = id;
  document.getElementById("deleteRecruiterModalOverlay").classList.add("active");
}

function closeDeleteRecruiterModal() {
  deleteRecruiterId = null;
  document.getElementById("deleteRecruiterModalOverlay").classList.remove("active");
}

function showToast(message, type = "success") {
  const toast = document.getElementById("undoToast");
  const toastMessage = document.getElementById("undoToastMessage");

  if (!toast || !toastMessage) return;

  toastMessage.textContent = message;
  toast.classList.remove("error", "success");
  toast.classList.add("show");
  toast.classList.add(type);

  if (type === "error") {
    setTimeout(() => {
      toast.classList.remove("show", "error");
    }, 3000);
  }
}

function hideUndoToast() {
  const toast = document.getElementById("undoToast");
  if (!toast) return;
  toast.classList.remove("show", "success", "error");
}

async function confirmDeleteRecruiter() {
  if (!deleteRecruiterId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/recruiters/${deleteRecruiterId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to delete recruiter", "error");
      closeDeleteRecruiterModal();
      return;
    }

    showToast("Recruiter deleted successfully", "success");
    closeDeleteRecruiterModal();
    closeRecruiterSidebar();
    await loadRecruiters();

    setTimeout(() => {
      hideUndoToast();
    }, 3000);
  } catch (error) {
    console.error("Delete recruiter error:", error);
    showToast("Server error while deleting recruiter", "error");
    closeDeleteRecruiterModal();
  }
}

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
    } else {
      console.log(data.message);
    }
  } catch (error) {
    console.log("Error loading notification count:", error);
  }
}

function toggleNotifications() {
  const dropdown = document.getElementById("notificationDropdown");

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
          li.textContent = `${item.applicant_name} applied for ${item.job_title}`;
          notificationList.appendChild(li);
        });
      }
    } else {
      notificationList.innerHTML = `<li class='no-data'>${data.message || "Failed to load notifications"}</li>`;
    }
  } catch (error) {
    console.log("Error loading notifications:", error);
    document.getElementById("notificationList").innerHTML = "<li class='no-data'>Error loading notifications</li>";
  }
}

function clearNotifications(event) {
  event.stopPropagation();
  renderNotifications([]);
  document.getElementById("notificationCount").textContent = "0";
}

function closeNotifications(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("notificationDropdown");
  dropdown.style.display = "none";
}

function renderNotifications(notifications) {
  const list = document.getElementById("notificationList");
  const footer = document.querySelector(".dropdown-footer");

  if (!list) return;

  list.innerHTML = "";

  if (notifications.length === 0) {
    list.innerHTML = `<li class="no-data">No new notifications</li>`;
    if (footer) footer.style.display = "none";
  } else {
    if (footer) footer.style.display = "block";

    notifications.forEach((n) => {
      const li = document.createElement("li");
      li.textContent = n.message;
      list.appendChild(li);
    });
  }
}

window.addEventListener("click", (event) => {
  const dropdown = document.getElementById("notificationDropdown");
  const notification = document.querySelector(".notification");

  if (dropdown && notification && !notification.contains(event.target)) {
    dropdown.style.display = "none";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadRecruiters();
  loadNotificationCount();
});