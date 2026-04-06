export const getDashboardSummary = async () => {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/user/dashboard-summary", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  return res.json();
};