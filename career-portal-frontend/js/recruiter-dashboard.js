const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

if (!token || role !== "recruiter") {
    alert("Access denied. Recruiter login required.");
    window.location.href = "../login.html";
}

function recruiterLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    window.location.href = "../login.html";
}

let jobsStatusChart;
let applicationsStatusChart;

async function loadRecruiterSummary() {
    try {
        const response = await fetch("http://localhost:5000/api/recruiter/dashboard-summary", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message || "Failed to load summary");
            return;
        }

        document.getElementById("totalJobs").innerText = data.totalJobs || 0;
        document.getElementById("activeJobs").innerText = data.activeJobs || 0;
        document.getElementById("totalApplications").innerText = data.totalApplications || 0;
        document.getElementById("pendingApplications").innerText = data.pendingApplications || 0;
        document.getElementById("shortlistedApplications").innerText = data.shortlistedApplications || 0;
        document.getElementById("rejectedApplications").innerText = data.rejectedApplications || 0;

        renderJobsStatusChart(data);
        renderApplicationsStatusChart(data);

    } catch (error) {
        console.log("Recruiter summary error:", error);
    }
}
function renderJobsStatusChart(data) {
    const canvas = document.getElementById("jobsStatusChart");
    if (!canvas) return;

    if (jobsStatusChart) {
        jobsStatusChart.destroy();
    }

    let activeJobs = data.activeJobs || 0;
    let totalJobs = data.totalJobs || 0;
    let inactiveJobs = Math.max(totalJobs - activeJobs, 0);

    // 👇 important fix for UI balance
    if (inactiveJobs === 0) {
        inactiveJobs = 0.2; // small slice so circle looks balanced
    }

    const centerTextPlugin = {
        id: 'centerText',
        beforeDraw(chart) {
            const { width, height, ctx } = chart;
            ctx.restore();

            ctx.font = "bold 22px sans-serif";
            ctx.fillStyle = "#1e293b";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillText(activeJobs, width / 2, height / 2);

            ctx.font = "12px sans-serif";
            ctx.fillStyle = "#64748b";
            ctx.fillText("Active", width / 2, height / 2 + 20);

            ctx.save();
        }
    };

    jobsStatusChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: ["Active Jobs", "Inactive Jobs"],
            datasets: [{
                data: [activeJobs, inactiveJobs],
                backgroundColor: [
                    "#2f62e8",   // 🔵 blue
                    "#e5e7eb"    // grey
                ],
                borderWidth: 0,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: "#475569",
                        font: {
                            size: 13,
                            weight: "600"
                        }
                    }
                }
            }
        },
        plugins: [centerTextPlugin]
    });
}

function renderApplicationsStatusChart(data) {
    const canvas = document.getElementById("applicationsStatusChart");
    if (!canvas) return;

    if (applicationsStatusChart) {
        applicationsStatusChart.destroy();
    }

    applicationsStatusChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: ["Pending", "Shortlisted", "Rejected"],
            datasets: [{
                label: "Applications",
                data: [
                    data.pendingApplications || 0,
                    data.shortlistedApplications || 0,
                    data.rejectedApplications || 0
                ],
                backgroundColor: [
                    "#f59e0b",
                    "#22c55e",
                    "#ef4444"
                ],
                borderRadius: 10,
                barThickness: 80
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: "#1e293b",
                    titleColor: "#fff",
                    bodyColor: "#fff"
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: "#64748b",
                        font: {
                            size: 13,
                            weight: "600"
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 1,
                        color: "#64748b",
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: "#e5ebf5"
                    }
                }
            }
        }
    });
}

async function loadRecentJobs() {
    try {
        const response = await fetch("http://localhost:5000/api/recruiter/jobs", {
            method: "GET",
            headers: {
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
            const statusClass =
                String(job.status).toUpperCase() === "ACTIVE"
                    ? "status-badge status-active"
                    : "status-badge status-inactive";

            const row = `
                <tr>
                    <td>${job.job_title}</td>
                    <td>${job.department}</td>
                    <td>${job.location}</td>
                    <td><span class="${statusClass}">${job.status}</span></td>
                    <td>${job.posted_date ? String(job.posted_date).split("T")[0] : ""}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.log("Recent jobs error:", error);
        document.getElementById("recentJobsBody").innerHTML =
            `<tr><td colspan="5">Server error while loading jobs</td></tr>`;
    }
}

async function loadRecentApplications() {
    try {
        const response = await fetch("http://localhost:5000/api/recruiter/applications", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const applications = await response.json();
        const tbody = document.getElementById("recentApplicationsBody");

        if (!response.ok) {
            tbody.innerHTML = `<tr><td colspan="4">${applications.message || "Failed to load applications"}</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        const recentApplications = applications.slice(0, 3);

        if (recentApplications.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4">No applications found</td></tr>`;
            return;
        }

        recentApplications.forEach(app => {
            let statusClass = "status-badge status-applied";

            if (app.status === "Shortlisted") {
                statusClass = "status-badge status-shortlisted";
            } else if (app.status === "Rejected") {
                statusClass = "status-badge status-rejected";
            } else if (app.status === "Pending") {
                statusClass = "status-badge status-pending";
            }

            const row = `
                <tr>
                    <td>${app.applicant_name || app.name}</td>
                    <td>${app.job_title}</td>
                    <td><span class="${statusClass}">${app.status}</span></td>
                    <td>${app.applied_date ? String(app.applied_date).split("T")[0] : ""}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });

    } catch (error) {
        console.log("Recent applications error:", error);
        document.getElementById("recentApplicationsBody").innerHTML =
            `<tr><td colspan="4">Server error while loading applications</td></tr>`;
    }
}

window.addEventListener("DOMContentLoaded", () => {
    loadRecruiterSummary();
    loadRecentJobs();
    loadRecentApplications();
});