document.addEventListener("DOMContentLoaded", loadDepartments);

async function loadDepartments() {
  try {
    const res = await fetch("http://localhost:5000/api/jobs/department-counts");
    const data = await res.json();

    const container = document.getElementById("deptGrid");
    container.innerHTML = "";

    data.forEach((dept) => {
      const card = `
        <div class="dept-card">
          <h3>${dept.department}</h3>
          <p>${dept.totalJobs} Open Positions</p>
          <button class="dept-btn" onclick="viewJobs('${dept.department}')">
            View Jobs
          </button>
        </div>
      `;
      container.innerHTML += card;
    });
  } catch (error) {
    console.error("Error loading departments:", error);
  }
}

function viewJobs(department) {
  const targetUrl = `User/view-jobs.html?department=${encodeURIComponent(department)}`;
  const token = localStorage.getItem("token");

  if (!token) {
    localStorage.setItem("redirectAfterLogin", targetUrl);
    window.location.href = "login.html";
    return;
  }

  window.location.href = targetUrl;
}