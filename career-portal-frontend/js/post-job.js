const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

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

function showMessage(text, type = "") {
  const message = document.getElementById("postJobMessage");
  message.textContent = text;
  message.className = "form-message";

  if (type) {
    message.classList.add(type);
  }
}

async function submitJob(event) {
  event.preventDefault();

  const submitBtn = document.getElementById("submitBtn");
  const form = document.getElementById("postJobForm");

  const jobTitle = document.getElementById("jobTitle").value.trim();
  const department = document.getElementById("department").value.trim();
  const location = document.getElementById("location").value.trim();
  const experience = document.getElementById("experience").value.trim();
  const description = document.getElementById("description").value.trim();

  showMessage("");

  if (!jobTitle || !department || !location || !experience || !description) {
    showMessage("Please fill all fields.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    <span>Posting...</span>
  `;

  try {
    const response = await fetch("http://localhost:5000/api/recruiter/jobs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        job_title: jobTitle,
        department,
        location,
        experience,
        description
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || "Failed to post job.", "error");
      return;
    }

    showMessage(data.message || "Job posted successfully.", "success");
    form.reset();

    setTimeout(() => {
      window.location.href = "manage-recruiter-jobs.html";
    }, 1500);

  } catch (error) {
    console.log("Post job error:", error);
    showMessage("Server error. Please try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <i class="fa-solid fa-paper-plane"></i>
      <span>Post Job</span>
    `;
  }
}

document.getElementById("postJobForm").addEventListener("submit", submitJob);