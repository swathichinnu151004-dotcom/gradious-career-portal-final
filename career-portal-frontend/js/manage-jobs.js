const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  alert("Access denied. Admin login required.");
  window.location.href = "../login.html";
}

const API_BASE_URL = "http://localhost:5000/api";

let allJobs = [];
let deleteJobId = null;
let updateJobId = null;
let deleteTimeout = null;
let notificationsLoaded = false;

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.location.href = "../login.html";
}

async function loadJobs() {
  const tbody = document.getElementById("jobsTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7">Loading jobs...</td></tr>`;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    if (!response.ok) {
      tbody.innerHTML = `<tr><td colspan="7">${data.message || "Failed to load jobs"}</td></tr>`;
      return;
    }

    allJobs = Array.isArray(data) ? data : [];

    if (allJobs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">No jobs found</td></tr>`;
      return;
    }

    renderJobs(allJobs);
  } catch (error) {
    console.error("Load jobs error:", error);
    tbody.innerHTML = `<tr><td colspan="7">Server error while loading jobs</td></tr>`;
  }
}

function renderJobs(jobs) {
  const tbody = document.getElementById("jobsTableBody");
  if (!tbody) return;

  if (!Array.isArray(jobs) || jobs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No jobs found</td></tr>`;
    return;
  }

  tbody.innerHTML = jobs.map((job) => {
    const safeTitle = job.job_title || "-";
    const safeDepartment = job.department || "-";
    const safeLocation = job.location || "-";
    const safeExperience = job.experience || "-";
    const safeStatus = job.status || "INACTIVE";
    const safeDate = job.posted_date ? String(job.posted_date).split("T")[0] : "-";

    const statusClass =
      String(safeStatus).toUpperCase() === "ACTIVE"
        ? "active-status"
        : "inactive-status";

    return `
      <tr>
        <td>${safeTitle}</td>
        <td>${safeDepartment}</td>
        <td>${safeLocation}</td>
        <td>${safeExperience}</td>
        <td><span class="status ${statusClass}">${safeStatus}</span></td>
        <td>${safeDate}</td>
        <td>
          <div class="action-buttons">
            <button class="view-btn" onclick="viewJob(${job.id})">
              <i class="fa-solid fa-eye"></i> View
            </button>

            <button class="update-btn" onclick="openUpdateModal(${job.id}, '${safeStatus}')">
              <i class="fa-solid fa-pen"></i> Update
            </button>

            <button class="delete-btn" onclick="openDeleteModal(${job.id})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
}

function searchJobs() {
  const input = document.getElementById("jobSearch");
  if (!input) return;

  const keyword = input.value.toLowerCase().trim();

  const filteredJobs = allJobs.filter((job) =>
    String(job.job_title || "").toLowerCase().includes(keyword) ||
    String(job.department || "").toLowerCase().includes(keyword) ||
    String(job.location || "").toLowerCase().includes(keyword)
  );

  renderJobs(filteredJobs);
}

function viewJob(id) {
  const job = allJobs.find((item) => Number(item.id) === Number(id));
  if (!job) return;

  document.getElementById("detailJobTitle").textContent = job.job_title || "-";
  document.getElementById("detailDepartment").textContent = job.department || "-";
  document.getElementById("detailLocation").textContent = job.location || "-";
  document.getElementById("detailExperience").textContent = job.experience || "-";
  document.getElementById("detailStatus").textContent = job.status || "-";
  document.getElementById("detailPostedDate").textContent =
    job.posted_date ? String(job.posted_date).split("T")[0] : "-";

  document.getElementById("jobSidebar").classList.add("active");
  document.getElementById("jobSidebarOverlay").classList.add("active");
}

function closeJobSidebar() {
  document.getElementById("jobSidebar").classList.remove("active");
  document.getElementById("jobSidebarOverlay").classList.remove("active");
}

function openUpdateModal(id, currentStatus) {
  updateJobId = id;
  document.getElementById("jobStatusSelect").value = String(currentStatus).toUpperCase();
  document.getElementById("updateModalOverlay").classList.add("active");
}

function closeUpdateModal() {
  updateJobId = null;
  document.getElementById("updateModalOverlay").classList.remove("active");
}

async function confirmUpdateJobStatus() {
  if (!updateJobId) return;

  const status = document.getElementById("jobStatusSelect").value;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs/status/${updateJobId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update job status");
      return;
    }

    closeUpdateModal();
    closeJobSidebar();
    loadJobs();
  } catch (error) {
    console.error("Update job status error:", error);
    alert("Server error while updating job status");
  }
}

function openDeleteModal(id) {
  deleteJobId = id;
  document.getElementById("deleteModalOverlay").classList.add("active");
}

function closeDeleteModal() {
  document.getElementById("deleteModalOverlay").classList.remove("active");
}

async function confirmDeleteJob() {
  if (!deleteJobId) return;

  closeDeleteModal();

  const rowButton = document.querySelector(
    `button.delete-btn[onclick="openDeleteModal(${deleteJobId})"]`
  );

  if (rowButton) {
    const row = rowButton.closest("tr");
    if (row) row.remove();
  }

  showUndoToast();

  deleteTimeout = setTimeout(async () => {
    await finalDeleteJob(deleteJobId);
    hideUndoToast();
    deleteJobId = null;
    loadJobs();
  }, 5000);
}

function showUndoToast() {
  document.getElementById("undoToast").classList.add("show");
}

function hideUndoToast() {
  document.getElementById("undoToast").classList.remove("show");
}

function undoDeleteJob() {
  clearTimeout(deleteTimeout);
  hideUndoToast();
  deleteJobId = null;
  loadJobs();
}

async function finalDeleteJob(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete job");
    }
  } catch (error) {
    console.error("Final delete job error:", error);
    alert("Server error while deleting job");
  }
}

async function loadNotificationCount() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/notifications/count`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
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
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    const notificationList = document.getElementById("notificationList");
    const notificationCount = document.getElementById("notificationCount");

    notificationList.innerHTML = "";

    if (response.ok) {
      notificationCount.textContent = data.length || 0;

      if (data.length === 0) {
        notificationList.innerHTML = "<li class='no-data'>No notifications found</li>";
      } else {
        data.forEach(item => {
          const li = document.createElement("li");
          li.textContent = `${item.applicant_name} applied for ${item.job_title}`;
          notificationList.appendChild(li);
        });
      }
    } else {
      notificationList.innerHTML = `<li class='no-data'>${data.message}</li>`;
    }
  } catch (error) {
    document.getElementById("notificationList").innerHTML =
      "<li class='no-data'>Error loading notifications</li>";
  }
}

function clearNotifications(event) {
  event.stopPropagation();
  renderNotifications([]);
  document.getElementById("notificationCount").textContent = "0";
}

function closeNotifications(event) {
  event.stopPropagation();
  document.getElementById("notificationDropdown").style.display = "none";
}

function renderNotifications(notifications) {
  const list = document.getElementById("notificationList");
  const footer = document.querySelector(".dropdown-footer");

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
  loadJobs();
  loadNotificationCount();
});