const params = new URLSearchParams(window.location.search);
const jobId = params.get("id");

async function loadJobDetails() {
  try {
    const response = await fetch(`http://localhost:5000/api/jobs/public-job/${jobId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch job details");
    }

    const job = await response.json();

    document.getElementById("jobTitle").textContent = job.job_title || "N/A";
    document.getElementById("jobDepartment").textContent = job.department || "N/A";
    document.getElementById("jobLocation").textContent = job.location || "N/A";
    document.getElementById("jobExperience").textContent = job.experience || "N/A";
    document.getElementById("jobStatus").textContent = job.status || "N/A";
    document.getElementById("jobDescription").textContent = job.description || "No description available";
  } catch (error) {
    console.log("Error:", error);
    document.getElementById("jobDetailsCard").innerHTML = `
      <h2>Job Details</h2>
      <p style="color:red;">Failed to load job details.</p>
      <a href="index.html" class="back-btn">Back</a>
    `;
  }
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `show ${type}`;

  setTimeout(() => {
    toast.className = "";
  }, 2500);
}

function goToLogin() {
  const token = localStorage.getItem("token");

  if (!token) {
    localStorage.setItem("redirectAfterLogin", `job-details.html?id=${jobId}`);
    showToast("Please login first to apply", "warning");

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1200);

    return;
  }

  applyJob();
}

async function applyJob() {
  const token = localStorage.getItem("token");

  try {
    const response = await fetch("http://localhost:5000/api/jobs/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ job_id: jobId })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.message || "Failed to apply for job", "error");
      return;
    }

    showToast("Applied successfully!", "success");

    setTimeout(() => {
      window.location.href = "User/my-applications.html";
    }, 1200);

  } catch (error) {
    console.log(error);
    showToast("Something went wrong", "error");
  }
}

loadJobDetails();
checkIfAlreadyApplied(); 

async function loadMyApplications() {
  const tbody = document.getElementById("applicationsTableBody");

  try {
    const response = await fetch("http://localhost:5000/api/jobs/my-applications", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const applications = await response.json();
    tbody.innerHTML = "";

    if (!response.ok) {
      tbody.innerHTML = `<tr><td colspan="5">${applications.message || "Server error"}</td></tr>`;
      return;
    }

    if (applications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">No applications found</td></tr>`;
      return;
    }

    applications.forEach(app => {
      let statusClass = "applied";

      if (app.status === "Shortlisted") statusClass = "shortlisted";
      if (app.status === "Rejected") statusClass = "rejected";

      const appliedDate = app.applied_date
        ? String(app.applied_date).split("T")[0]
        : "";

      const row = `
        <tr>
          <td>${app.job_title}</td>
          <td>${app.department}</td>
          <td>${app.location}</td>
          <td>${appliedDate}</td>
          <td><span class="status ${statusClass}">${app.status}</span></td>
        </tr>
      `;

      tbody.innerHTML += row;
    });

  } catch (error) {
    console.log("Applications error", error);
    tbody.innerHTML = `<tr><td colspan="5">Server error</td></tr>`;
  }
}

async function checkIfAlreadyApplied() {
  const token = localStorage.getItem("token");
  const applyBtn = document.querySelector(".apply-btn");

  if (!token || !applyBtn) return;

  try {
    const response = await fetch(`http://localhost:5000/api/jobs/check-application/${jobId}`, {
      headers: {
        "Authorization": "Bearer " + token
      }
    });

    const data = await response.json();

    if (data.applied) {
      applyBtn.textContent = "Applied";
      applyBtn.disabled = true;
      applyBtn.style.backgroundColor = "#999";
      applyBtn.style.cursor = "not-allowed";
    }
  } catch (error) {
    console.log("Check applied error:", error);
  }
}

function handleBack() {
  const role = localStorage.getItem("role");

  if (role === "admin") {
    window.location.href = "Admin/dashboard.html";
  } else if (role === "recruiter") {
    window.location.href = "Recruiter/dashboard.html";
  } else if (role === "user") {
    window.location.href = "User/dashboard.html";
  } else {
    window.location.href = "index1.html";
  }
}