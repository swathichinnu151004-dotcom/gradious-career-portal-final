import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles/reactToastifyOverride.css";

import LoginPage from "./pages/auth/LoginPage";
import Home from "./pages/home/Home";
import Contact from "./pages/home/Contact";
import AboutUs from "./pages/home/AboutUs";
import PrivacyPolicy from "./pages/home/PrivacyPolicy";
import TermsConditions from "./pages/home/TermsConditions";
import Register from "./pages/auth/Register";
import RecruiterSignup from "./pages/auth/RecruiterSignup";

import ProtectedRoute from "./components/common/ProtectedRoute";

import ViewJobs from "./pages/user/ViewJobs";
import MyApplications from "./pages/user/MyApplications";
import UserProfile from "./pages/user/UserProfile";
import AdminProfile from "./pages/admin/AdminProfile";

import ManageUsers from "./pages/admin/ManageUsers";
import ManageRecruiters from "./pages/admin/ManageRecruiters";
import ManageJobsAdmin from "./pages/admin/ManageJobs";
import ViewApplicationsAdmin from "./pages/admin/ViewApplications";
import InviteRecruiter from "./pages/admin/InviteRecruiter";

import AdminDashboard from "./pages/admin/AdminDashboard";
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard";
import UserDashboard from "./pages/user/UserDashboard";

import ManageJobsRecruiter from "./pages/recruiter/ManageJobs";
import ViewApplicationsRecruiter from "./pages/recruiter/ViewApplications";

import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import JobDetails from "./pages/common/JobDetails";
import PostJob from "./pages/recruiter/PostJob";
import RecruiterProfile from "./pages/recruiter/RecruiterProfile";

/** Legacy URL from home / bookmarks → canonical Jobs route (keeps query string). */
function RedirectViewJobsToJobs() {
  const { search } = useLocation();
  return <Navigate to={`/user/jobs${search}`} replace />;
}

function App() {
  const appTree = (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsConditions />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/job-details" element={<JobDetails />} />
        <Route path="/recruiter-signup" element={<RecruiterSignup />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
        
<Route path="/recruiter/profile" element={<RecruiterProfile />} />
        
<Route path="/recruiter/post-job" element={<PostJob />} />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/recruiters"
          element={
            <ProtectedRoute>
              <ManageRecruiters />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/jobs"
          element={
            <ProtectedRoute>
              <ManageJobsAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute>
              <ViewApplicationsAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/invite-recruiter"
          element={
            <ProtectedRoute>
              <InviteRecruiter />
            </ProtectedRoute>
          }
        />

        {/* Recruiter Routes */}
        <Route
          path="/recruiter/dashboard"
          element={
            <ProtectedRoute>
              <RecruiterDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedRoute>
              <ManageJobsRecruiter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter/applications"
          element={
            <ProtectedRoute>
              <ViewApplicationsRecruiter />
            </ProtectedRoute>
          }
        />

        {/* User Routes */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/view-jobs"
          element={
            <ProtectedRoute>
              <RedirectViewJobsToJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/jobs"
          element={
            <ProtectedRoute>
              <ViewJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="colored"
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />
    </BrowserRouter>
  );

  return appTree;
}

export default App;