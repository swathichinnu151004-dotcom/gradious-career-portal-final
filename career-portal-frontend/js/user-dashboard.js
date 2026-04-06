const API_BASE_URL = "http://localhost:5000/api";

const token = localStorage.getItem("token");
const role = localStorage.getItem("role");

/* ================= AUTH CHECK ================= */
if (!token || role !== "user") {
    alert("Access denied. User login required.");
    window.location.href = "../login.html";
}

function userLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "../login.html";
}

/* ================= TOTAL JOBS ================= */
async function loadTotalJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs/all-jobs`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();

        if (!response.ok) {
            document.getElementById("totalJobs").innerText = 0;
            return;
        }

        document.getElementById("totalJobs").innerText = data.length || 0;

    } catch (error) {
        console.log("Total jobs error:", error);
        document.getElementById("totalJobs").innerText = 0;
    }
}

/* ================= DASHBOARD SUMMARY ================= */
async function loadUserDashboardSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/user/dashboard-summary`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const data = await response.json();
        console.log("Dashboard summary:", data);

        if (!response.ok) {
            document.getElementById("totalJobs").innerText = 0;
            document.getElementById("jobsApplied").innerText = 0;
            document.getElementById("shortlistedJobs").innerText = 0;
            document.getElementById("rejectedJobs").innerText = 0;
            return;
        }

        document.getElementById("totalJobs").innerText = data.totalJobs || 0;
        document.getElementById("jobsApplied").innerText = data.totalApplied || 0;
        document.getElementById("shortlistedJobs").innerText = data.totalShortlisted || 0;
        document.getElementById("rejectedJobs").innerText = data.totalRejected || 0;

    } catch (error) {
        console.log("Dashboard summary error:", error);
    }
}

/* ================= LATEST JOBS ================= */
async function loadLatestJobs() {
    const tbody = document.getElementById("latestJobsBody");

    try {
        const response = await fetch(`${API_BASE_URL}/jobs/latest-jobs`, {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        const jobs = await response.json();

        if (!response.ok) {
            tbody.innerHTML = `<tr><td colspan="5">${jobs.message || "Failed to load jobs"}</td></tr>`;
            return;
        }

        tbody.innerHTML = "";

        if (jobs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">No jobs found</td></tr>`;
            return;
        }

        jobs.slice(0, 3).forEach(job => {
            const statusClass =
                job.status?.toUpperCase() === "ACTIVE"
                    ? "active-status"
                    : "inactive-status";

            tbody.innerHTML += `
                <tr>
                    <td>${job.job_title}</td>
                    <td>${job.department}</td>
                    <td>${job.location}</td>
                    <td>${job.experience}</td>
                    <td><span class="status ${statusClass}">${job.status}</span></td>
                </tr>
            `;
        });

    } catch (error) {
        console.log("Latest jobs error:", error);
    }
}

/* ================= APPLICATION CHART ================= */
let applicationsChartInstance = null;
let departmentsChartInstance = null;

/* ================= APPLICATION CHART ================= */
async function loadApplicationChart() {
  try {
    const response = await fetch(`${API_BASE_URL}/user/application-stats`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const data = await response.json();
    console.log("Application Stats:", data);

    const values = [
      Number(data.Pending || 0),
      Number(data.Shortlisted || 0),
      Number(data.Rejected || 0)
    ];

    const ctx = document.getElementById("applicationsChart").getContext("2d");

    if (applicationsChartInstance) {
      applicationsChartInstance.destroy();
    }

    applicationsChartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Pending", "Shortlisted", "Rejected"],
        datasets: [
          {
            data: values,
            backgroundColor: ["#f59e0b", "#10b981", "#ef4444"],
            borderRadius: 12,
            borderSkipped: false,
            barThickness: 42,
            maxBarThickness: 48
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 800
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: "#0f172a",
            titleColor: "#ffffff",
            bodyColor: "#ffffff",
            cornerRadius: 8,
            padding: 10
          }
        },
        layout: {
          padding: {
            top: 10,
            right: 10,
            bottom: 0,
            left: 0
          }
        },
        scales: {
          x: {
            grid: {
              display: false,
              drawBorder: false
            },
            ticks: {
              color: "#475569",
              font: {
                size: 13,
                weight: "600"
              }
            }
          },
          y: {
            beginAtZero: true,
            grace: "20%",
            suggestedMax: Math.max(...values, 1) + 1,
            ticks: {
              stepSize: 1,
              precision: 0,
              color: "#475569",
              font: {
                size: 12
              }
            },
            grid: {
              color: "#e2e8f0",
              drawBorder: false
            }
          }
        }
      }
    });

  } catch (error) {
    console.log("Application chart error:", error);
  }
}

/* ================= DEPARTMENT CHART ================= */
async function loadDepartmentChart() {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/department-stats`);
    const data = await response.json();

    console.log("Department Stats:", data);

    const labels = data.map(item => item.department);
    const values = data.map(item => Number(item.count));

    const colors = [
      "#2563eb",
      "#60a5fa",
      "#93c5fd",
      "#cbd5e1",
      "#1d4ed8",
      "#3b82f6",
      "#7dd3fc",
      "#94a3b8",
      "#38bdf8",
      "#818cf8"
    ];

    const ctx = document.getElementById("departmentsChart").getContext("2d");

    if (departmentsChartInstance) {
      departmentsChartInstance.destroy();
    }

    departmentsChartInstance = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 14,
              boxHeight: 14,
              padding: 14,
              color: "#475569",
              font: {
                size: 12,
                weight: "600"
              }
            }
          },
          tooltip: {
            backgroundColor: "#0f172a",
            titleColor: "#ffffff",
            bodyColor: "#ffffff"
          }
        }
      }
    });

  } catch (error) {
    console.log("Department chart error:", error);
  }
}
/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", () => {
    loadTotalJobs();
    loadUserDashboardSummary();
    loadLatestJobs();
    loadApplicationChart();     // ✅ NEW
    loadDepartmentChart();      // ✅ NEW
});