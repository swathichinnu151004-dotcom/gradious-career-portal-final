import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { chartFontFamily, tooltipDefaults } from "../../utils/chartTheme";

ChartJS.register(ArcElement, Tooltip, Legend);

function DepartmentChart({ jobs = [] }) {
  const deptCount = {};

  jobs.forEach((job) => {
    const dept = job.department || "Other";
    deptCount[dept] = (deptCount[dept] || 0) + 1;
  });

  const labels = Object.keys(deptCount);
  const values = Object.values(deptCount);

  if (labels.length === 0) {
    return (
      <div className="chart-empty-state" role="status">
        <p>No department data yet</p>
        <span>Browse jobs to see how openings are spread by team.</span>
      </div>
    );
  }

  const total = Object.values(deptCount).reduce((a, b) => a + b, 0) || 1;

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: [
          "#4f46e5",
          "#0891b2",
          "#16a34a",
          "#ea580c",
          "#dc2626",
          "#7c3aed",
          "#0284c7",
        ],
        borderColor: "#ffffff",
        borderWidth: 2,
        cutout: "58%",
        hoverOffset: 6,
        spacing: 2,
        radius: "78%",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 6,
        bottom: 6,
        left: 6,
        right: 6,
      },
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          color: "#475569",
          boxWidth: 8,
          boxHeight: 8,
          padding: 12,
          font: {
            size: 12,
            weight: "500",
            family: chartFontFamily,
          },
        },
      },
      tooltip: {
        ...tooltipDefaults,
        callbacks: {
          label: (ctx) => {
            const n = Number(ctx.raw ?? 0);
            const pct = Math.round((n / total) * 100);
            return ` ${n.toLocaleString()} opening${n === 1 ? "" : "s"} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="chart-canvas-wrap doughnut-chart-large">
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default DepartmentChart;