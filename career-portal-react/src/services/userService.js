import API from "./api";

export const getUserDashboardSummary = () => {
  return API.get("/user/dashboard-summary");
};