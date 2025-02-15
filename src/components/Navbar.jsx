import axios from "axios";
import { ChevronDown, LogOut, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authentication/AuthContext";

export default function Navbar(onLogout) {
  const navigate = useNavigate();
  const { user, clearUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [roleManagement, setRoleManagement] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    fetchRoleManagement();
    if (user) {
      fetchUserRoles();
    }
  }, [user]);

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/user-roles/${user.emp_id}`
      );
      setUserRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const fetchRoleManagement = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/role-management"
      );
      setRoleManagement(response.data);
    } catch (error) {
      console.error("Error fetching role management:", error);
    }
  };

  const isSuperAdmin = userRoles.includes("Super Admin");
  const isAdmin = userRoles.includes("Admin");
  const isAllowedSuperAdmin = ["YM6702", "YM7903"].includes(user?.emp_id);

  const hasAccess = (path) => {
    if (!user || !roleManagement) return false;
    if (isSuperAdmin || isAdmin) return true;

    return roleManagement.some(
      (role) =>
        role.users.some((u) => u.emp_id === user.emp_id) &&
        role.role.toLowerCase().replace(" ", "_") === path.replace("/", "")
    );
  };

  const handleSignOut = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    clearUser(); // Clear the global user state
    onLogout(); // Update App.jsx state
    navigate("/", { replace: true });
  };

  const navItems = [
    {
      title: "Order Data",
      items: [
        { path: "/bundle-registration", title: "Bundle Registration" },
        { path: "/washing", title: "Washing" },
        { path: "/dyeing", title: "Dyeing" },
        { path: "/ironing", title: "Ironing" },
        { path: "/packing", title: "Packing" },
      ],
    },
    {
      title: "Quality Inspection",
      items: [
        { path: "/details", title: "QC1 Inspection" },
        { path: "/qc2-inspection", title: "QC2 Inspection" },
      ],
    },
    {
      title: "QA Audit",
      items: [{ path: "/audit", title: "QA Audit" }],
    },
    {
      title: "Data Analytics",
      items: [
        { path: "/download-data", title: "Download Data" },
        { path: "/dashboard", title: "Live Dashboard" },
      ],
    },
  ];

  const showRoleManagement = isSuperAdmin || isAdmin;

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/home" className="text-xl font-bold text-blue-600">
                YQMS
              </Link>
            </div>

            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((section) => (
                <div key={section.title} className="relative group">
                  <button className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900">
                    {section.title}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                  <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="py-1">
                      {section.items.map(
                        (item) =>
                          hasAccess(item.path) && (
                            <Link
                              key={item.path}
                              to={item.path}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {item.title}
                            </Link>
                          )
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isAllowedSuperAdmin && (
                <Link
                  to="/settings"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                >
                  Settings
                </Link>
              )}

              {showRoleManagement && (
                <>
                  <Link
                    to="/role-management"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    Role Management
                  </Link>
                  <Link
                    to="/userList"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
                  >
                    User Management
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center">
            {user && (
              <div className="relative">
                <div
                  className="flex items-center space-x-4 cursor-pointer"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {user.name}
                  </span>
                  <div className="relative">
                    <img
                      src={user.face_photo || "/default-avatar.png"}
                      alt={user.name}
                      className="h-8 w-8 rounded-full"
                    />
                    <ChevronDown className="h-4 w-4 absolute -bottom-1 -right-1 text-gray-500" />
                  </div>
                </div>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsProfileOpen(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isMenuOpen ? "block" : "hidden"}`}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((section) => (
            <div key={section.title}>
              <div className="px-4 py-2 text-base font-medium text-gray-700">
                {section.title}
              </div>
              {section.items.map(
                (item) =>
                  hasAccess(item.path) && (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block pl-8 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    >
                      {item.title}
                    </Link>
                  )
              )}
            </div>
          ))}

          {isAllowedSuperAdmin && (
            <Link
              to="/settings"
              className="block pl-4 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            >
              Settings
            </Link>
          )}

          {showRoleManagement && (
            <Link
              to="/role-management"
              className="block pl-4 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            >
              Role Management
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
