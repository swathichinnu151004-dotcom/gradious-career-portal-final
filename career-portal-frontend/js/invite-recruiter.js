const inviteRecruiterForm = document.getElementById("inviteRecruiterForm");
const recruiterEmailInput = document.getElementById("recruiterEmail");
const inviteMessage = document.getElementById("inviteMessage");
const invitedRecruitersTableBody = document.getElementById("invitedRecruitersTableBody");
const refreshInvitesBtn = document.getElementById("refreshInvitesBtn");
const logoutBtn = document.getElementById("logoutBtn");
const topLogoutBtn = document.getElementById("topLogoutBtn");
const sendInviteBtn = document.getElementById("sendInviteBtn");
const toast = document.getElementById("toast");

const searchInviteInput = document.getElementById("searchInvite");
const statusFilter = document.getElementById("statusFilter");

const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const paginationInfo = document.getElementById("paginationInfo");

const confirmModal = document.getElementById("confirmModal");
const closeConfirmBtn = document.getElementById("closeConfirmBtn");
const confirmCancelBtn = document.getElementById("confirmCancelBtn");

const API_BASE_URL = "http://localhost:5000/api";
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

let allInvites = [];
let filteredInvites = [];
let currentPage = 1;
const rowsPerPage = 5;
let selectedInviteId = null;

if (!token || role !== "admin") {
  window.location.href = "../login.html";
}

document.addEventListener("DOMContentLoaded", () => {
  loadInvitedRecruiters();
});

/* =========================
   INVITE SUBMIT
========================= */
if (inviteRecruiterForm) {
  inviteRecruiterForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = recruiterEmailInput.value.trim();
    clearMessage();

    if (!email) {
      showMessage("Please enter recruiter email", "error");
      showToast("Please enter recruiter email", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("Please enter a valid email address", "error");
      showToast("Please enter a valid email address", "error");
      return;
    }

    try {
      if (sendInviteBtn) {
        sendInviteBtn.disabled = true;
        sendInviteBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Sending...`;
      }

      const response = await fetch(`${API_BASE_URL}/admin/invite-recruiter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.message || "Failed to send invite";
        showMessage(errorMessage, "error");
        showToast(errorMessage, "error");
        return;
      }

      const successMessage = data.message || "Recruiter invite sent successfully";
      showMessage(successMessage, "success");
      showToast(successMessage, "success");

      inviteRecruiterForm.reset();
      await loadInvitedRecruiters();

    } catch (error) {
      console.error("Error sending recruiter invite:", error);
      showMessage("Server error while sending invite", "error");
      showToast("Server error while sending invite", "error");
    } finally {
      if (sendInviteBtn) {
        sendInviteBtn.disabled = false;
        sendInviteBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Invite`;
      }
    }
  });
}

/* =========================
   REFRESH
========================= */
if (refreshInvitesBtn) {
  refreshInvitesBtn.addEventListener("click", async () => {
    await loadInvitedRecruiters();
    showToast("Invite list refreshed", "success");
  });
}

/* =========================
   SEARCH + FILTER
========================= */
if (searchInviteInput) {
  searchInviteInput.addEventListener("input", () => {
    currentPage = 1;
    applyFilters();
  });
}

if (statusFilter) {
  statusFilter.addEventListener("change", () => {
    currentPage = 1;
    applyFilters();
  });
}

/* =========================
   PAGINATION
========================= */
if (prevPageBtn) {
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderCurrentPage();
    }
  });
}

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredInvites.length / rowsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderCurrentPage();
    }
  });
}

/* =========================
   LOGOUT
========================= */
function adminLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("user");
  window.location.href = "../login.html";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", (event) => {
    event.preventDefault();
    adminLogout();
  });
}

if (topLogoutBtn) {
  topLogoutBtn.addEventListener("click", adminLogout);
}

/* =========================
   LOAD INVITES
========================= */
async function loadInvitedRecruiters() {
  invitedRecruitersTableBody.innerHTML = `
    <tr>
      <td colspan="5" class="empty-row">Loading invites...</td>
    </tr>
  `;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/recruiter-invites`, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "ngrok-skip-browser-warning": "true"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      invitedRecruitersTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-row">${data.message || "Failed to load invites"}</td>
        </tr>
      `;
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      allInvites = [];
      filteredInvites = [];
      invitedRecruitersTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="empty-row">No invites found</td>
        </tr>
      `;
      updatePaginationInfo();
      return;
    }

    allInvites = [...data].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    currentPage = 1;
    applyFilters();

  } catch (error) {
    console.error("Error loading recruiter invites:", error);
    invitedRecruitersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">Server error while loading invites</td>
      </tr>
    `;
  }
}

/* =========================
   FILTER
========================= */
function applyFilters() {
  const searchValue = searchInviteInput ? searchInviteInput.value.trim().toLowerCase() : "";
  const statusValue = statusFilter ? statusFilter.value.toLowerCase() : "";

  filteredInvites = allInvites.filter((invite) => {
    const emailMatch = (invite.email || "").toLowerCase().includes(searchValue);
    const inviteStatus = (invite.status || "Pending").toLowerCase();
    const statusMatch = !statusValue || inviteStatus === statusValue;

    return emailMatch && statusMatch;
  });

  renderCurrentPage();
}

function renderCurrentPage() {
  if (!filteredInvites.length) {
    invitedRecruitersTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-row">No matching invites found</td>
      </tr>
    `;
    updatePaginationInfo();
    updatePaginationButtons();
    return;
  }

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentRows = filteredInvites.slice(startIndex, endIndex);

  renderInvitedRecruiters(currentRows, startIndex);
  updatePaginationInfo();
  updatePaginationButtons();
}

function renderInvitedRecruiters(invites, startIndex) {
  invitedRecruitersTableBody.innerHTML = invites.map((invite, index) => {
    const status = invite.status || "Pending";
    const normalizedStatus = status.toLowerCase();

    let statusClass = "status-pending";
    if (normalizedStatus === "accepted") {
      statusClass = "status-accepted";
    } else if (normalizedStatus === "expired") {
      statusClass = "status-expired";
    }

    return `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td>${invite.email || "-"}</td>
        <td>
          <span class="status-badge ${statusClass}">${status}</span>
        </td>
        <td>${formatDate(invite.created_at)}</td>
        <td class="action-cell">
          ${
  normalizedStatus === "pending" || normalizedStatus === "accepted"
    ? `<button class="action-btn resend" onclick="resendInvite(${invite.id})">
         <i class="fa-solid fa-rotate"></i> ${normalizedStatus === "accepted" ? "Re-invite" : "Resend"}
       </button>
       ${
         normalizedStatus === "pending"
           ? `<button class="action-btn cancel" onclick="openCancelModal(${invite.id})">
                <i class="fa-solid fa-xmark"></i> Cancel
              </button>`
           : ""
       }`
    : `<span class="no-action">—</span>`
}
        </td>
      </tr>
    `;
  }).join("");
}

function updatePaginationInfo() {
  if (!paginationInfo) return;

  if (!filteredInvites.length) {
    paginationInfo.textContent = "Showing 0-0 of 0";
    return;
  }

  const start = (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, filteredInvites.length);
  paginationInfo.textContent = `Showing ${start}-${end} of ${filteredInvites.length}`;
}

function updatePaginationButtons() {
  const totalPages = Math.ceil(filteredInvites.length / rowsPerPage) || 1;

  if (prevPageBtn) prevPageBtn.disabled = currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = currentPage === totalPages || filteredInvites.length === 0;
}

/* =========================
   RESEND INVITE
========================= */
async function resendInvite(inviteId) {
  try {
    showToast("Resending invite...", "success");

    const response = await fetch(`${API_BASE_URL}/admin/resend-invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "ngrok-skip-browser-warning": "true"
      },
      body: JSON.stringify({ id: inviteId })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to resend invite");
    }

    showToast(data.message || "Invite resent successfully", "success");
    await loadInvitedRecruiters();
  } catch (error) {
    console.error("Error resending invite:", error);
    showToast(error.message || "Server error while resending invite", "error");
  }
}

/* =========================
   CANCEL INVITE MODAL
========================= */
function openCancelModal(inviteId) {
  selectedInviteId = inviteId;
  if (confirmModal) {
    confirmModal.classList.add("show");
  }
}

function closeCancelModal() {
  selectedInviteId = null;
  if (confirmModal) {
    confirmModal.classList.remove("show");
  }
}

if (closeConfirmBtn) {
  closeConfirmBtn.addEventListener("click", closeCancelModal);
}

if (confirmModal) {
  confirmModal.addEventListener("click", (event) => {
    if (event.target === confirmModal) {
      closeCancelModal();
    }
  });
}

if (confirmCancelBtn) {
  confirmCancelBtn.addEventListener("click", async () => {
    if (!selectedInviteId) return;
    await cancelInvite(selectedInviteId);
  });
}

async function cancelInvite(inviteId) {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/invite/${inviteId}`, {
      method: "DELETE",
      headers: {
        "Authorization": "Bearer " + token,
        "ngrok-skip-browser-warning": "true"
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to cancel invite", "error");
      return;
    }

    showToast(data.message || "Invite cancelled successfully", "success");
    closeCancelModal();
    await loadInvitedRecruiters();

  } catch (error) {
    console.error("Error cancelling invite:", error);
    showToast("Server error while cancelling invite", "error");
  }
}

/* =========================
   MESSAGE
========================= */
function showMessage(message, type) {
  if (!inviteMessage) return;
  inviteMessage.textContent = message;
  inviteMessage.className = `form-message ${type}`;
}

function clearMessage() {
  if (!inviteMessage) return;
  inviteMessage.textContent = "";
  inviteMessage.className = "form-message";
}

/* =========================
   TOAST
========================= */
function showToast(message, type = "success") {
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3500);
}

/* =========================
   HELPERS
========================= */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}