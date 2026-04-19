import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  LayoutDashboard,
  Briefcase,
  FileText,
  UserCircle,
  Users,
  UserPlus,
  ClipboardPlus,
} from "lucide-react";
import "./layout.css";
import NotificationDropdown from "./NotificationDropdown";

function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const role = localStorage.getItem("role") || "user";
  const name =
    localStorage.getItem("name") ||
    (role === "admin"
      ? "Admin"
      : role === "recruiter"
      ? "Recruiter"
      : "User");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    navigate("/login");
  };

  const roleConfig = {
    admin: {
      brand: "Gradious Admin",
      profileSubtitle: "Administrator",
      avatar: "👨‍💼",
      menu: [
        {
          label: "Dashboard",
          path: "/admin/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          label: "Users",
          path: "/admin/users",
          icon: <Users size={20} />,
        },
        {
          label: "Recruiters",
          path: "/admin/recruiters",
          icon: <UserPlus size={20} />,
        },
        {
          label: "Invite Recruiter",
          path: "/admin/invite-recruiter",
          icon: <UserPlus size={20} />,
        },
        {
          label: "Jobs",
          path: "/admin/jobs",
          icon: <Briefcase size={20} />,
        },
        {
          label: "Applications",
          path: "/admin/applications",
          icon: <FileText size={20} />,
        },
        {
          label: "Profile",
          path: "/admin/profile",
          icon: <UserCircle size={20} />,
        },
      ],
    },

    recruiter: {
      brand: "Gradious Recruiter",
      profileSubtitle: "Recruiter",
      avatar: "🧑‍💼",
      menu: [
        {
          label: "Dashboard",
          path: "/recruiter/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          label: "Post Job",
          path: "/recruiter/post-job",
          icon: <ClipboardPlus size={20} />,
        },
        {
          label: "Manage Jobs",
          path: "/recruiter/jobs",
          icon: <Briefcase size={20} />,
        },
        {
          label: "Applications",
          path: "/recruiter/applications",
          icon: <FileText size={20} />,
        },
        {
          label: "Profile",
          path: "/recruiter/profile",
          icon: <UserCircle size={20} />,
        },
      ],
    },

    user: {
      brand: "Gradious User",
      profileSubtitle: "Job Seeker",
      avatar: "👤",
      menu: [
        {
          label: "Dashboard",
          path: "/user/dashboard",
          icon: <LayoutDashboard size={20} />,
        },
        {
          label: "Jobs",
          path: "/user/jobs",
          icon: <Briefcase size={20} />,
        },
        {
          label: "My Applications",
          path: "/user/applications",
          icon: <FileText size={20} />,
        },
        {
          label: "Profile",
          path: "/user/profile",
          icon: <UserCircle size={20} />,
        },
      ],
    },
  };

  const currentRole = roleConfig[role] || roleConfig.user;

  const getHeaderContent = () => {
    if (role === "admin") {
      if (location.pathname === "/admin/dashboard") {
        return {
          title: "Dashboard",
          subtitle: "Manage users, recruiters, jobs and applications",
        };
      }
      if (location.pathname === "/admin/users") {
        return {
          title: "Manage Users",
          subtitle: "View and manage all registered users",
        };
      }
      if (location.pathname === "/admin/recruiters") {
        return {
          title: "Manage Recruiters",
          subtitle: "View and manage recruiter accounts",
        };
      }
      if (location.pathname === "/admin/invite-recruiter") {
        return {
          title: "Invite Recruiter",
          subtitle: "Send recruiter invitations",
        };
      }
      if (location.pathname === "/admin/jobs") {
        return {
          title: "Manage Jobs",
          subtitle: "Monitor and manage all posted jobs",
        };
      }
      if (location.pathname === "/admin/applications") {
        return {
          title: "Applications",
          subtitle: "Review all job applications",
        };
      }
      if (location.pathname === "/admin/profile") {
        return {
          title: "Profile",
          subtitle: "Manage your profile details",
        };
      }
    }

    if (role === "recruiter") {
      if (location.pathname === "/recruiter/dashboard") {
        return {
          title: "Dashboard",
          subtitle: "Overview of jobs and candidate applications",
        };
      }
      if (location.pathname === "/recruiter/post-job") {
        return {
          title: "Post Job",
          subtitle: "Create and publish new job openings",
        };
      }
      if (location.pathname === "/recruiter/jobs") {
        return {
          title: "Manage Jobs",
          subtitle: "View, update and manage your job postings",
        };
      }
      if (location.pathname === "/recruiter/applications") {
        return {
          title: "Applications",
          subtitle: "Review and manage candidate applications",
        };
      }
      if (location.pathname === "/recruiter/profile") {
        return {
          title: "Profile",
          subtitle: "View and manage your recruiter information",
        };
      }
    }

    if (role === "user") {
      if (location.pathname === "/user/dashboard") {
        return {
          title: "Dashboard",
          subtitle: "Track jobs and application progress",
        };
      }
      if (
        location.pathname === "/user/jobs" ||
        location.pathname === "/user/view-jobs"
      ) {
        return {
          title: "Jobs",
          subtitle: "Browse and apply for available jobs",
        };
      }
      if (location.pathname === "/user/applications") {
        return {
          title: "My Applications",
          subtitle: "Check your application status",
        };
      }
      if (location.pathname === "/user/profile") {
        return {
          title: "Profile",
          subtitle: "View your details",
        };
      }
    }

    return {
      title: "Dashboard",
      subtitle: "Career portal management",
    };
  };

  const header = getHeaderContent();

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar" data-dashboard-role={role}>
        <div className="dashboard-sidebar-top">
          <div className="dashboard-sidebar-brand">
            <img
              src="/images/logo.png"
              alt="Gradious Logo"
              className="dashboard-logo"
            />
            <span className="dashboard-brand-text">{currentRole.brand}</span>
          </div>

          <nav className="dashboard-sidebar-nav">
            {currentRole.menu.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? "dashboard-nav-item active"
                    : "dashboard-nav-item"
                }
              >
                <span className="dashboard-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        <button
          type="button"
          className="dashboard-logout-button"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </aside>

      <main className="dashboard-main-area">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <h1>{header.title}</h1>
            <p>{header.subtitle}</p>
          </div>

          <div className="dashboard-topbar-right">
            <NotificationDropdown />

            <div className="dashboard-profile-box">
              <div className="dashboard-profile-avatar">
                {currentRole.avatar}
              </div>
              <div>
                <h4>{name}</h4>
                <p>{currentRole.profileSubtitle}</p>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content-area">{children}</div>
      </main>
    </div>
  );
}

export default Layout;