import { useMemo } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  chartFontFamily,
  niceAxisMax,
  tooltipDefaults,
} from "../../utils/chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function StatusChart({ summary }) {
  const pending = Math.max(
    (summary.appliedJobs || 0) -
      (summary.shortlisted || 0) -
      (summary.rejected || 0),
    0
  );

  const shortlisted = summary.shortlisted || 0;
  const rejected = summary.rejected || 0;
  const yMax = useMemo(
    () => niceAxisMax([pending, shortlisted, rejected], 4),
    [pending, shortlisted, rejected]
  );

  const data = {
    labels: ["Pending", "Shortlisted", "Rejected"],
    datasets: [
      {
        label: "Applications",
        data: [pending, shortlisted, rejected],
        backgroundColor: [
          "rgba(245, 158, 11, 0.88)",
          "rgba(34, 197, 94, 0.88)",
          "rgba(239, 68, 68, 0.88)",
        ],
        borderColor: "#ffffff",
        borderWidth: 1,
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 52,
      },
    ],
  };

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          ...tooltipDefaults,
          callbacks: {
            label: (ctx) => {
              const v = ctx.parsed?.y;
              return ` ${v?.toLocaleString?.() ?? v} applications`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: "#64748b",
            font: {
              size: 12,
              weight: "600",
              family: chartFontFamily,
            },
          },
        },
        y: {
          beginAtZero: true,
          max: yMax,
          ticks: {
            precision: 0,
            maxTicksLimit: 8,
            color: "#94a3b8",
            font: {
              size: 11,
              family: chartFontFamily,
            },
          },
          grid: {
            color: "rgba(148, 163, 184, 0.2)",
            drawBorder: false,
          },
        },
      },
    }),
    [yMax]
  );

  return (
    <div className="chart-canvas-wrap bar-chart-large">
      <Bar data={data} options={options} />
    </div>
  );
}

export default StatusChart;