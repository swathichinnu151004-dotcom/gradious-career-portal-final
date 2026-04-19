/** Shared Chart.js styling for dashboard charts (admin / user / recruiter). */

export const chartFontFamily =
  "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

export const tooltipDefaults = {
  backgroundColor: "rgba(15, 23, 42, 0.92)",
  titleColor: "#f8fafc",
  bodyColor: "#e2e8f0",
  borderColor: "rgba(148, 163, 184, 0.25)",
  borderWidth: 1,
  padding: 12,
  cornerRadius: 10,
  displayColors: true,
  titleFont: { size: 13, weight: "600", family: chartFontFamily },
  bodyFont: { size: 13, weight: "500", family: chartFontFamily },
};

export function niceAxisMax(values, fallback = 10) {
  const maxVal = Math.max(
    fallback,
    ...values.map((v) => (typeof v === "number" && Number.isFinite(v) ? v : 0))
  );
  const padded = Math.ceil(maxVal * 1.12);
  if (padded <= 10) return 10;
  if (padded <= 20) return 20;
  const magnitude = 10 ** Math.floor(Math.log10(padded));
  return Math.ceil(padded / magnitude) * magnitude;
}
