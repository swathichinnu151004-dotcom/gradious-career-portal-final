const toggleBtn = document.getElementById("toggleJobsBtn");
let allJobs = [];
let expanded = false;

// render jobs
function renderJobs(jobs) {
  const jobGrid = document.querySelector(".job-grid");
  if (!jobGrid) return;

  jobGrid.innerHTML = "";

  const jobsToShow = expanded ? jobs : jobs.slice(0, 3);

  jobsToShow.forEach(job => {
    jobGrid.innerHTML += `
      <div class="job-card">
        <h3>${job.job_title}</h3>
        <p><strong>Department:</strong> ${job.department}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Experience:</strong> ${job.experience}</p>
        <a href="job-details.html?id=${job.id}" class="btn-view">View Details</a>
      </div>
    `;
  });

  // ✅ Always show button
  if (toggleBtn) {
    toggleBtn.style.display = "inline-block";
    toggleBtn.textContent = expanded ? "Show Less" : "View All";
  }
}
// load latest jobs
async function loadJobs() {
  try {
    const response = await fetch("http://localhost:5000/api/jobs/public-latest-jobs");

    if (!response.ok) {
      throw new Error("Failed to fetch jobs");
    }

    const jobs = await response.json();
    allJobs = jobs;
    expanded = false;
    renderJobs(allJobs);

  } catch (error) {
    console.log("Error loading jobs:", error);
    const jobGrid = document.querySelector(".job-grid");
    if (jobGrid) {
      jobGrid.innerHTML = `<p style="color:red;">Failed to load jobs</p>`;
    }
  }
}

// toggle jobs
function toggleJobs() {
  expanded = !expanded;
  renderJobs(allJobs);
}

// search jobs
async function searchJobs() {
  const skill = document.getElementById("skill").value.trim();
  const location = document.getElementById("location").value.trim();

  if (!skill && !location) {
    loadJobs();
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/jobs/search?skill=${encodeURIComponent(skill)}&location=${encodeURIComponent(location)}`
    );

    if (!response.ok) {
      throw new Error("Failed to search jobs");
    }

    const jobs = await response.json();
    allJobs = jobs;
    expanded = true;

    if (jobs.length === 0) {
      const jobGrid = document.querySelector(".job-grid");
      if (jobGrid) {
        jobGrid.innerHTML = `<p style="color:red;">No jobs found</p>`;
      }
      if (toggleBtn) toggleBtn.style.display = "none";
      return;
    }

    renderJobs(allJobs);

  } catch (error) {
    console.log("Search error:", error);
    const jobGrid = document.querySelector(".job-grid");
    if (jobGrid) {
      jobGrid.innerHTML = `<p style="color:red;">Server error</p>`;
    }
  }
}

// button events
if (toggleBtn) {
  toggleBtn.addEventListener("click", toggleJobs);
}

window.addEventListener("DOMContentLoaded", loadJobs);