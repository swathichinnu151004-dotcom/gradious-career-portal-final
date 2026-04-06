const API_BASE_URL = "http://localhost:5000/api";
const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "../login.html";
}

let selectedJobId = null;
let appliedJobIds = [];

/* =========================
   LOGOUT
========================= */
function userLogout() {
  localStorage.clear();
  window.location.href = "../login.html";
}

/* =========================
   LOAD USER INFO
========================= */
function loadUserInfo() {
  const userNameEl = document.getElementById("userName");

  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (storedUser && userNameEl) {
      userNameEl.textContent = storedUser.name || "User";

      const fullName = document.getElementById("fullName");
      const email = document.getElementById("email");

      if (fullName) fullName.value = storedUser.name || "";
      if (email) email.value = storedUser.email || "";
    }
  } catch (error) {
    console.error("User info error:", error);
  }
}
async function loadNotificationCount() {
  try {
    const response = await fetch("http://localhost:5000/api/notifications/count", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const data = await response.json();
    document.getElementById("notificationCount").innerText = data.count || 0;
  } catch (error) {
    console.log("Notification count error:", error);
  }
} 
/* =========================
   TOAST
========================= */
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 4000); // better timing
}

/* =========================
   MODAL
========================= */
function openApplyModal(jobId) {
  if (appliedJobIds.includes(Number(jobId))) {
    showToast("You already applied for this job", "error");
    return;
  }

  selectedJobId = Number(jobId);
  loadUserInfo();

  document.getElementById("applyModal").style.display = "flex";
}

function closeApplyModal() {
  document.getElementById("applyModal").style.display = "none";
  document.getElementById("applyJobForm").reset();

  loadUserInfo();

  const submitBtn = document.getElementById("submitApplicationBtn");
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Application";
  }

  selectedJobId = null;
}

/* =========================
   LOAD JOBS + APPLICATIONS
========================= */
async function loadJobs() {
  const tbody = document.getElementById("jobsTableBody");

  try {
    const [jobsResponse, applicationsResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/jobs/all-jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_BASE_URL}/jobs/my-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const jobs = await jobsResponse.json();
    const applications = await applicationsResponse.json();

    tbody.innerHTML = "";

    if (!jobsResponse.ok) {
      tbody.innerHTML = `<tr><td colspan="5">Failed to load jobs</td></tr>`;
      return;
    }

    if (!jobs.length) {
      tbody.innerHTML = `<tr><td colspan="5">No jobs available</td></tr>`;
      return;
    }

    // store applied jobs
    appliedJobIds = applications.map(app => Number(app.job_id));

    jobs.forEach(job => {
      const alreadyApplied = appliedJobIds.includes(Number(job.id));

      const buttonHTML = alreadyApplied
        ? `<button class="applied-btn" disabled>Applied</button>`
        : `<button class="apply-btn" onclick="openApplyModal(${job.id})">Apply</button>`;

      tbody.innerHTML += `
        <tr>
          <td>${job.job_title}</td>
          <td>${job.department}</td>
          <td>${job.location}</td>
          <td>${job.experience}</td>
          <td>${buttonHTML}</td>
        </tr>
      `;
    });

  } catch (error) {
    console.error("LOAD ERROR:", error);
    tbody.innerHTML = `<tr><td colspan="5">Server error</td></tr>`;
  }
}

/* =========================
   APPLY JOB (FIXED)
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadUserInfo();
  loadJobs();

  const form = document.getElementById("applyJobForm");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    console.log("FORM SUBMITTED");

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const resume = document.getElementById("resume").files[0];
    const submitBtn = document.getElementById("submitApplicationBtn");

    if (!selectedJobId) {
      showToast("Select a job first", "error");
      return;
    }

    if (!fullName || !email) {
      showToast("Fill all fields", "error");
      return;
    }

    if (!resume) {
      showToast("Upload resume", "error");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const formData = new FormData();
      formData.append("jobId", selectedJobId);
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("resume", resume);

      const response = await fetch(`${API_BASE_URL}/jobs/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      console.log("STATUS:", response.status);
      console.log("DATA:", data);

      // ✅ IMPORTANT FIX (handles 201)
      if (response.ok) {
        showToast(data.message || "Application submitted successfully");

        // update UI immediately
        appliedJobIds.push(Number(selectedJobId));

        closeApplyModal();

        setTimeout(() => {
          window.location.href = "my-applications.html";
        }, 1500);

      } else {
        showToast(data.message || "Apply failed", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Application";
      }

    } catch (error) {
      console.error("APPLY ERROR:", error);
      showToast("Server error", "error");

      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Application";
    }
  });
});

/* =========================
   SEARCH
========================= */
function filterJobs() {
  const search = document.getElementById("jobSearch").value.toLowerCase();
  const rows = document.querySelectorAll("#jobsTableBody tr");

  rows.forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(search) ? "" : "none";
  });
}