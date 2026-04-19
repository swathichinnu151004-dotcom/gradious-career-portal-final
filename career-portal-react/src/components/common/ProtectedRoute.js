import { Navigate, useLocation } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    const returnTo = encodeURIComponent(
      `${location.pathname}${location.search || ""}`
    );
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return children;
}

export default ProtectedRoute;