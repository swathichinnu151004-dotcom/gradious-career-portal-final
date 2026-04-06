let allJobsData = [];
let jobsExpanded = false;

// ===============================
// LOAD JOBS FROM BACKEND
// ===============================
async function loadJobs() {
    try {
        const response = await fetch("http://localhost:5000/api/admin/latest-jobs");
        const jobs = await response.json();

        allJobsData = Array.isArray(jobs) ? jobs : [];
        jobsExpanded = false;

        renderJobs(allJobsData);

    } catch (error) {
        console.log("Error loading jobs:", error);

        const jobGrid = document.querySelector(".job-grid");
        if (jobGrid) {
            jobGrid.innerHTML = `<p>Failed to load jobs</p>`;
        }
    }
}

// ===============================
// RENDER JOBS
// ===============================
function renderJobs(jobsToRender) {
    const jobGrid = document.querySelector(".job-grid");
    const toggleBtn = document.getElementById("toggleJobsBtn");

    if (!jobGrid) return;

    jobGrid.innerHTML = "";

    const visibleJobs = jobsExpanded ? jobsToRender : jobsToRender.slice(0, 3);

    visibleJobs.forEach(job => {
        const jobCard = `
            <div class="job-card" data-dept="${job.department || ''}">
                <h3>${job.job_title || '-'}</h3>
                <p><strong>Department:</strong> ${job.department || '-'}</p>
                <p><strong>Location:</strong> ${job.location || '-'}</p>
                <p><strong>Experience:</strong> ${job.experience || '-'}</p>
                <a href="job-details.html?id=${job.id}" class="btn-view">View Details</a>
            </div>
        `;
        jobGrid.innerHTML += jobCard;
    });

    if (toggleBtn) {
        if (jobsToRender.length > 3) {
            toggleBtn.style.display = "inline-block";
            toggleBtn.textContent = jobsExpanded ? "Show Less" : "View All";
        } else {
            toggleBtn.style.display = "none";
        }
    }
}

// ===============================
// TOGGLE VIEW ALL / SHOW LESS
// ===============================
function toggleJobs() {
    jobsExpanded = !jobsExpanded;
    renderJobs(allJobsData);
}

// ===============================
// SEARCH JOBS
// ===============================
function searchJobs() {
    const skillInput = document.getElementById("skill");
    const locationInput = document.getElementById("location");

    const skill = skillInput ? skillInput.value.toLowerCase().trim() : "";
    const location = locationInput ? locationInput.value.toLowerCase().trim() : "";

    const filteredJobs = allJobsData.filter(job => {
        const title = (job.job_title || "").toLowerCase();
        const department = (job.department || "").toLowerCase();
        const jobLocation = (job.location || "").toLowerCase();
        const experience = (job.experience || "").toLowerCase();

        const fullText = `${title} ${department} ${jobLocation} ${experience}`;

        const matchSkill = skill === "" || fullText.includes(skill);
        const matchLocation = location === "" || jobLocation.includes(location);

        return matchSkill && matchLocation;
    });

    jobsExpanded = true;
    renderJobs(filteredJobs);

    if (filteredJobs.length === 0) {
        alert("No jobs found for the selected search.");
    }
}

// ===============================
// FILTER JOBS BY DEPARTMENT
// ===============================
function filterJobs(department) {
    const jobsSection = document.getElementById("jobs");
    const skillInput = document.getElementById("skill");
    const locationInput = document.getElementById("location");

    const filteredJobs = allJobsData.filter(job => {
        return job.department &&
            job.department.toLowerCase().trim() === department.toLowerCase().trim();
    });

    if (skillInput) skillInput.value = "";
    if (locationInput) locationInput.value = "";

    jobsExpanded = true;
    renderJobs(filteredJobs);

    if (jobsSection) {
        jobsSection.scrollIntoView({ behavior: "smooth" });
    }

    if (filteredJobs.length === 0) {
        alert("No jobs available in " + department + " department.");
    }
}

// ===============================
// SHOW ALL JOBS / RESET FILTERS
// ===============================
function showAllJobs() {
    const skillInput = document.getElementById("skill");
    const locationInput = document.getElementById("location");

    if (skillInput) skillInput.value = "";
    if (locationInput) locationInput.value = "";

    jobsExpanded = true;
    renderJobs(allJobsData);
}

// ===============================
// TOGGLE PASSWORD
// ===============================
function togglePassword(inputId) {
    const input = document.getElementById(inputId);

    if (input.type === "password") {
        input.type = "text";
    } else {
        input.type = "password";
    }
}

// ===============================
// REGISTER FORM
// ===============================
function handleRegister(event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const role = document.getElementById("role").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const message = document.getElementById("registerMessage");

    message.style.color = "#d62828";
    message.textContent = "";

    if (fullName === "" || email === "" || phone === "" || role === "" || password === "" || confirmPassword === "") {
        message.textContent = "Please fill all required fields.";
        return;
    }

    if (password.length < 6) {
        message.textContent = "Password must be at least 6 characters.";
        return;
    }

    if (password !== confirmPassword) {
        message.textContent = "Password and Confirm Password do not match.";
        return;
    }

    message.style.color = "green";
    message.textContent = "Registration successful! Redirecting to login...";

    setTimeout(() => {
        window.location.href = "login.html";
    }, 1500);
}

// ===============================
// AUTO LOAD JOBS ON HOME PAGE
// ===============================
window.addEventListener("DOMContentLoaded", loadJobs);