import API from "./api";

export const getAllJobs = () => {
  return API.get("/jobs/all-jobs");
};
export const getMyApplications = () => {
  return API.get("/jobs/my-applications");
};