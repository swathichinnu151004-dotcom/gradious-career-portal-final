const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

let recruiterJobs = [];
let deleteJobId = null;

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

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 3000);
}

async function loadRecruiterJobs() {
  const tbody = document.getElementById("jobsTableBody");

  try {
    const response = await fetch("http://localhost:5000/api/recruiter/jobs", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const jobs = await response.json();

    if (!response.ok) {
      tbody.innerHTML = `<tr><td colspan="7">${jobs.message || "Failed to load jobs"}</td></tr>`;
      return;
    }

    recruiterJobs = jobs || [];
    renderJobsTable(recruiterJobs);

  } catch (error) {
    console.log("Jobs error:", error);
    tbody.innerHTML = `<tr><td colspan="7">Server error while loading jobs</td></tr>`;
  }
}

function renderJobsTable(jobs) {
  const tbody = document.getElementById("jobsTableBody");
  tbody.innerHTML = "";

  if (!jobs || jobs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">No jobs found</td></tr>`;
    return;
  }

  jobs.forEach((job) => {
    const statusClass =
      String(job.status).toUpperCase() === "ACTIVE"
        ? "status-active"
        : "status-inactive";

    const postedDate = job.posted_date
      ? String(job.posted_date).split("T")[0]
      : "-";

    const experience = job.experience || "-";

    const row = `
      <tr>
        <td>${job.job_title || "-"}</td>
        <td>${job.department || "-"}</td>
        <td>${job.location || "-"}</td>
        <td>${experience}</td>
        <td><span class="status ${statusClass}">${job.status || "-"}</span></td>
        <td>${postedDate}</td>
        <td class="action-buttons">
          <button class="view-btn" onclick="viewJob(${job.id})">
            <i class="fa-solid fa-eye"></i> View
          </button>

          <button class="update-btn" onclick="openUpdateModal(${job.id})">
            <i class="fa-solid fa-pen"></i> Update
          </button>

          <button class="delete-btn" onclick="openDeleteModal(${job.id})">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </td>
      </tr>
    `;

    tbody.innerHTML += row;
  });
}

function searchJobs() {
  const input = document.getElementById("jobSearch").value.toLowerCase();

  const filteredJobs = recruiterJobs.filter((job) => {
    const text = `
      ${job.job_title || ""}
      ${job.department || ""}
      ${job.location || ""}
      ${job.experience || ""}
      ${job.status || ""}
    `.toLowerCase();

    return text.includes(input);
  });

  renderJobsTable(filteredJobs);
}

function getJobById(jobId) {
  return recruiterJobs.find((job) => Number(job.id) === Number(jobId));
}

/* ===== VIEW ===== */
function viewJob(jobId) {
  const job = getJobById(jobId);
  if (!job) return;

  document.getElementById("viewJobTitle").textContent = job.job_title || "-";
  document.getElementById("viewDepartment").textContent = job.department || "-";
  document.getElementById("viewLocation").textContent = job.location || "-";
  document.getElementById("viewExperience").textContent = job.experience || "-";
  document.getElementById("viewStatus").textContent = job.status || "-";
  document.getElementById("viewPostedDate").textContent = job.posted_date
    ? String(job.posted_date).split("T")[0]
    : "-";
  document.getElementById("viewDescription").textContent = job.description || "-";

  document.getElementById("viewModal").classList.add("show");
}

function closeViewModal() {
  document.getElementById("viewModal").classList.remove("show");
}

/* ===== UPDATE ===== */
function openUpdateModal(jobId) {
  const job = getJobById(jobId);
  if (!job) return;

  document.getElementById("updateJobId").value = job.id;
  document.getElementById("updateJobTitle").value = job.job_title || "";
  document.getElementById("updateDepartment").value = job.department || "";
  document.getElementById("updateLocation").value = job.location || "";
  document.getElementById("updateExperience").value = job.experience || "";
  document.getElementById("updateStatus").value = (job.status || "ACTIVE").toUpperCase();
  document.getElementById("updateDescription").value = job.description || "";

  document.getElementById("updateModal").classList.add("show");
}

function closeUpdateModal() {
  document.getElementById("updateModal").classList.remove("show");
}

document.getElementById("updateJobForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const jobId = document.getElementById("updateJobId").value;

  const payload = {
    job_title: document.getElementById("updateJobTitle").value.trim(),
    department: document.getElementById("updateDepartment").value.trim(),
    location: document.getElementById("updateLocation").value.trim(),
    experience: document.getElementById("updateExperience").value.trim(),
    status: document.getElementById("updateStatus").value.trim(),
    description: document.getElementById("updateDescription").value.trim()
  };

  try {
    const response = await fetch(`http://localhost:5000/api/recruiter/jobs/${jobId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to update job", "error");
      return;
    }

    closeUpdateModal();
    showToast(data.message || "Job updated successfully");
    await loadRecruiterJobs();

  } catch (error) {
    console.log("Update job error:", error);
    showToast("Server error while updating job", "error");
  }
});

/* ===== DELETE ===== */
function openDeleteModal(jobId) {
  deleteJobId = jobId;
  document.getElementById("deleteModal").classList.add("show");
}

function closeDeleteModal() {
  deleteJobId = null;
  document.getElementById("deleteModal").classList.remove("show");
}

document.getElementById("confirmDeleteBtn").addEventListener("click", async function () {
  if (!deleteJobId) return;

  try {
    const response = await fetch(`http://localhost:5000/api/recruiter/jobs/${deleteJobId}`, {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to delete job", "error");
      return;
    }

    closeDeleteModal();
    showToast(data.message || "Job deleted successfully");
    await loadRecruiterJobs();

  } catch (error) {
    console.log("Delete job error:", error);
    showToast("Server error while deleting job", "error");
  }
});

/* ===== CLOSE MODAL ON OUTSIDE CLICK ===== */
window.addEventListener("click", function (e) {
  const viewModal = document.getElementById("viewModal");
  const updateModal = document.getElementById("updateModal");
  const deleteModal = document.getElementById("deleteModal");

  if (e.target === viewModal) closeViewModal();
  if (e.target === updateModal) closeUpdateModal();
  if (e.target === deleteModal) closeDeleteModal();
});

window.addEventListener("DOMContentLoaded", loadRecruiterJobs);