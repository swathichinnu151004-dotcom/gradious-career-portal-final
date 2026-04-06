const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "admin") {
  alert("Access denied. Admin login required.");
  window.location.href = "../login.html";
}

const API_BASE_URL = "http://localhost:5000/api";

let deleteUserId = null;
let deleteTimeout = null;
let notificationsLoaded = false;

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  localStorage.removeItem("userId");
  window.location.href = "../login.html";
}

async function loadUsers() {
  const tbody = document.querySelector("#usersTable tbody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="8">Loading users...</td></tr>`;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    if (!response.ok) {
      tbody.innerHTML = `<tr><td colspan="8">${data.message || "Failed to load users"}</td></tr>`;
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8">No users found</td></tr>`;
      return;
    }

    tbody.innerHTML = "";

    data.forEach((user) => {
      const safeName = user.name || "-";
      const safeEmail = user.email || "-";
      const safePhone = user.phone || "-";
      const safeCity = user.city || "-";
      const safeQualification = user.qualification || "-";
      const safeRole = user.role || "-";
      const safeStatus = user.status || "Blocked";

      const statusClass =
        safeStatus.toLowerCase() === "active" ? "active-status" : "blocked-status";

      const statusButton =
        safeStatus.toLowerCase() === "active"
          ? `<button class="block-btn" onclick="updateUserStatus(${user.id}, 'Blocked')">Block</button>`
          : `<button class="unblock-btn" onclick="updateUserStatus(${user.id}, 'Active')">Unblock</button>`;

      const row = `
        <tr>
          <td>${safeName}</td>
          <td>${safeEmail}</td>
          <td>${safePhone}</td>
          <td>${safeCity}</td>
          <td>${safeQualification}</td>
          <td>${safeRole}</td>
          <td><span class="status ${statusClass}">${safeStatus}</span></td>
          <td class="action-buttons">
            <button class="view-btn" onclick="viewUser(${user.id})">
              <i class="fa-solid fa-eye"></i> View
            </button>
            ${statusButton}
            <button class="delete-btn" onclick="openDeleteModal(${user.id})">
              <i class="fa-solid fa-trash"></i> Delete
            </button>
          </td>
        </tr>
      `;

      tbody.insertAdjacentHTML("beforeend", row);
    });
  } catch (error) {
    console.error("Load users error:", error);
    tbody.innerHTML = `<tr><td colspan="8">Server error while loading users</td></tr>`;
  }
}

function searchUsers() {
  const input = document.getElementById("userSearch");
  const rows = document.querySelectorAll("#usersTable tbody tr");
  if (!input) return;

  const keyword = input.value.toLowerCase().trim();

  rows.forEach((row) => {
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(keyword) ? "" : "none";
  });
}

function filterUsers(type, event) {
  const rows = document.querySelectorAll("#usersTable tbody tr");
  const buttons = document.querySelectorAll(".filter-btn");

  buttons.forEach((btn) => btn.classList.remove("active"));
  event.target.classList.add("active");

  rows.forEach((row) => {
    const statusCell = row.querySelector(".status");
    if (!statusCell) return;

    const statusText = statusCell.textContent.toLowerCase();

    if (type === "all") {
      row.style.display = "";
    } else if (type === "active") {
      row.style.display = statusText === "active" ? "" : "none";
    } else if (type === "blocked") {
      row.style.display = statusText === "blocked" ? "" : "none";
    }
  });
}

async function viewUser(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      }
    });

    const user = await response.json();

    if (!response.ok) {
      alert(user.message || "Failed to load user details");
      return;
    }

    document.getElementById("detailName").textContent = user.name || "-";
    document.getElementById("detailEmail").textContent = user.email || "-";
    document.getElementById("detailPhone").textContent = user.phone || "-";
    document.getElementById("detailCity").textContent = user.city || "-";
    document.getElementById("detailQualification").textContent = user.qualification || "-";
    document.getElementById("detailRole").textContent = user.role || "-";
    document.getElementById("detailStatus").textContent = user.status || "-";

    document.getElementById("userSidebar").classList.add("active");
    document.getElementById("userSidebarOverlay").classList.add("active");
  } catch (error) {
    console.error("View user error:", error);
    alert("Server error while loading user details");
  }
}

function closeUserSidebar() {
  document.getElementById("userSidebar").classList.remove("active");
  document.getElementById("userSidebarOverlay").classList.remove("active");
}

async function updateUserStatus(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/status/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ status })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to update user status");
      return;
    }

    loadUsers();
    closeUserSidebar();
  } catch (error) {
    console.error("Update user status error:", error);
    alert("Server error while updating user status");
  }
}

function openDeleteModal(id) {
  deleteUserId = id;
  document.getElementById("deleteModalOverlay").classList.add("active");
}

function closeDeleteModal() {
  document.getElementById("deleteModalOverlay").classList.remove("active");
}

async function confirmDeleteUser() {
  if (!deleteUserId) return;

  closeDeleteModal();

  const rowButton = document.querySelector(
    `button.delete-btn[onclick="openDeleteModal(${deleteUserId})"]`
  );

  if (rowButton) {
    const row = rowButton.closest("tr");
    if (row) row.remove();
  }

  showUndoToast();

  deleteTimeout = setTimeout(async () => {
    await finalDeleteUser(deleteUserId);
    hideUndoToast();
    deleteUserId = null;
    loadUsers();
  }, 5000);
}

function showUndoToast() {
  document.getElementById("undoToast").classList.add("show");
}

function hideUndoToast() {
  document.getElementById("undoToast").classList.remove("show");
}

function undoDelete() {
  clearTimeout(deleteTimeout);
  hideUndoToast();
  deleteUserId = null;
  loadUsers();
}

async function finalDeleteUser(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Failed to delete user");
    }
  } catch (error) {
    console.error("Final delete error:", error);
    alert("Server error while deleting user");
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

window.addEventListener("click", (event) => {
  const dropdown = document.getElementById("notificationDropdown");
  const notification = document.querySelector(".notification");

  if (dropdown && notification && !notification.contains(event.target)) {
    dropdown.style.display = "none";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  loadNotificationCount();

  const searchInput = document.getElementById("userSearch");
  if (searchInput) {
    searchInput.addEventListener("input", searchUsers);
  }
});