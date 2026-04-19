import API from "./api";

export const getRecruiterDashboardSummary = () => {
  return API.get("/recruiter/dashboard-summary");
};

export const getRecruiterJobs = () => {
  return API.get("/recruiter/jobs");
};
export const getRecruiterApplications = () => {
  return API.get("/recruiter/applications");
};
export const updateApplicationStatus = (id, status) => {
  return API.put(`/recruiter/applications/status/${id}`, { status });
};
export const getRecruiterProfile = () => {
  return API.get("/recruiter/profile");
};