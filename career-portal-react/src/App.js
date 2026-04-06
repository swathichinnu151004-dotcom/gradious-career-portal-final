import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./components/common/ProtectedRoute";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Common pages
import Home from "./pages/common/Home";
import JobDetails from "./pages/common/JobDetails";

// Recruiter pages
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import ManageJobs from "./pages/recruiter/ManageJobs";
import ViewApplications from "./pages/recruiter/ViewApplications";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";

// User pages
import UserDashboard from "./pages/user/UserDashboard";
import ViewJobs from "./pages/user/ViewJobs";
import MyApplications from "./pages/user/MyApplications";
import UserProfile from "./pages/user/UserProfile";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageRecruiters from "./pages/admin/ManageRecruiters";
import InviteRecruiter from "./pages/admin/InviteRecruiter";
import AdminManageJobs from "./pages/admin/ManageJobs";
import AdminViewApplications from "./pages/admin/ViewApplications";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Common / Public */}
        <Route path="/" element={<Login />} />
        <Route path="/job/:id" element={<JobDetails />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Recruiter */}
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <ManageJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <ViewApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/profile"
          element={
            <ProtectedRoute allowedRole="recruiter">
              <RecruiterProfile />
            </ProtectedRoute>
          }
        />

        {/* User */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/jobs"
          element={
            <ProtectedRoute allowedRole="user">
              <ViewJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/applications"
          element={
            <ProtectedRoute allowedRole="user">
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute allowedRole="user">
              <UserProfile />
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRole="admin">
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recruiters"
          element={
            <ProtectedRoute allowedRole="admin">
              <ManageRecruiters />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminManageJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminViewApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/invite-recruiter"
          element={
            <ProtectedRoute allowedRole="admin">
              <InviteRecruiter />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;