import API from "./api";

export const getAdminDashboardSummary = () => {
  return API.get("/admin/dashboard-summary");
};
export const getRecentJobs = () => {
  return API.get("/admin/recent-jobs");
};

export const getRecentUsers = () => {
  return API.get("/admin/recent-users");
};
export const getAllUsers = () => {
  return API.get("/admin/users");
};
export const getAllRecruiters = () => {
  return API.get("/admin/recruiters");
};
export const getAllJobsAdmin = () => {
  return API.get("/admin/jobs");
};
export const getAllApplicationsAdmin = () => {
  return API.get("/admin/applications");
};
export const inviteRecruiter = (data) => {
  return API.post("/admin/invite-recruiter", data);
};
export const getAllJobs = () => API.get("/admin/jobs");
export const getAllApplications = () => API.get("/admin/applications");