const API_BASE_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  alert("Access denied. Admin login required.");
  window.location.href = "../login.html";
}

function adminLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.location.href = "../login.html";
}

let jobsStatusChartInstance = null;
let applicationsStatusChartInstance = null;
let notificationsLoaded = false;

async function loadDashboardSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard-summary`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to load dashboard summary");
      return;
    }

    document.getElementById("totalUsers").innerText = data.totalUsers || 0;
    document.getElementById("totalRecruiters").innerText = data.totalRecruiters || 0;
    document.getElementById("totalJobs").innerText = data.totalJobs || 0;
    document.getElementById("totalApplications").innerText = data.totalApplications || 0;

    renderJobsStatusChart(
      Number(data.activeJobs || 0),
      Number(data.inactiveJobs || 0)
    );

    renderApplicationsStatusChart(
  Number(data.appliedCount || 0),
  Number(data.shortlistedCount || 0),
  Number(data.rejectedCount || 0),
  Number(data.pendingCount || 0)
);
  } catch (error) {
    console.log("Dashboard summary error:", error);
  }
}

async function loadRecentJobs() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/jobs`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    const jobs = await response.json();
    const tbody = document.getElementById("recentJobsBody");

    if (!response.ok) {
      tbody.innerHTML = `<tr><td colspan="5">${jobs.message || "Failed to load jobs"}</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    const recentJobs = jobs.slice(0, 3);

    if (recentJobs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No jobs found</td></tr>`;
      return;
    }

    recentJobs.forEach(job => {
      const statusText = String(job.status || "").toUpperCase();
      const statusClass = statusText === "ACTIVE" ? "active-status" : "inactive-status";

      const row = `
        <tr>
          <td>${job.job_title || "-"}</td>
          <td>${job.department || "-"}</td>
          <td>${job.location || "-"}</td>
          <td><span class="status ${statusClass}">${job.status || "-"}</span></td>
          <td>${job.posted_date ? String(job.posted_date).split("T")[0] : "-"}</td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (error) {
    console.log("Recent jobs error:", error);
    document.getElementById("recentJobsBody").innerHTML =
      `<tr><td colspan="5">Error loading jobs</td></tr>`;
  }
}

async function loadRecentUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    const users = await response.json();
    const tbody = document.getElementById("recentUsersBody");

    if (!response.ok) {
      tbody.innerHTML = `<tr><td colspan="4">${users.message || "Failed to load users"}</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    const recentUsers = users.slice(0, 3);

    if (recentUsers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">No users found</td></tr>`;
      return;
    }

    recentUsers.forEach(user => {
      const statusText = String(user.status || "").toLowerCase();
      const statusClass = statusText === "active" ? "active-status" : "blocked-status";

      const row = `
        <tr>
          <td>${user.name || "-"}</td>
          <td>${user.email || "-"}</td>
          <td>${user.role || "-"}</td>
          <td><span class="status ${statusClass}">${user.status || "-"}</span></td>
        </tr>
      `;
      tbody.innerHTML += row;
    });
  } catch (error) {
    console.log("Recent users error:", error);
    document.getElementById("recentUsersBody").innerHTML =
      `<tr><td colspan="4">Error loading users</td></tr>`;
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
        notificationList.innerHTML = "<li>No notifications found</li>";
      } else {
        data.forEach(item => {
          const li = document.createElement("li");
          li.textContent = `${item.applicant_name} applied for ${item.job_title}`;
          notificationList.appendChild(li);
        });
      }
    } else {
      notificationList.innerHTML = `<li>${data.message}</li>`;
    }
  } catch (error) {
    console.log("Error loading notifications:", error);
    document.getElementById("notificationList").innerHTML = "<li>Error loading notifications</li>";
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

  list.innerHTML = "";

  if (notifications.length === 0) {
    list.innerHTML = `<li class="no-data">No new notifications</li>`;
    if (footer) footer.style.display = "none";
  } else {
    if (footer) footer.style.display = "block";

    notifications.forEach(n => {
      const li = document.createElement("li");
      li.textContent = n.message;
      list.appendChild(li);
    });
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.location.href = "../login.html";
}

function renderJobsStatusChart(activeJobs, inactiveJobs) {
  const ctx = document.getElementById("jobsStatusChart");
  if (!ctx) return;

  if (jobsStatusChartInstance) {
    jobsStatusChartInstance.destroy();
  }

  jobsStatusChartInstance = new Chart(ctx, {
  type: "doughnut",
  data: {
    labels: ["Active Jobs", "Inactive Jobs"],
    datasets: [
      {
        data: [activeJobs, inactiveJobs],
        backgroundColor: ["#2563eb", "#cbd5f5"],
        borderWidth: 0
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom"
      }
    }
  }
});
}

function renderApplicationsStatusChart(applied, shortlisted, rejected, pending) {
  const ctx = document.getElementById("applicationsStatusChart");
  if (!ctx) return;

  if (applicationsStatusChartInstance) {
    applicationsStatusChartInstance.destroy();
  }

  applicationsStatusChartInstance = new Chart(ctx, {
  type: "bar",
  data: {
    labels: ["Applied", "Shortlisted", "Rejected", "Pending"],
    datasets: [
      {
        label: "Applications",
        data: [applied, shortlisted, rejected, pending],
        backgroundColor: ["#3b82f6", "#22c55e", "#ef4444", "#f59e0b"],
        borderRadius: 8
      }
    ]
  },
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
});
}

window.addEventListener("DOMContentLoaded", () => {
  loadDashboardSummary();
  loadRecentJobs();
  loadRecentUsers();
  loadNotificationCount();
});