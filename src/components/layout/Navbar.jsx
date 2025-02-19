import axios from "axios";
import {
  Activity,
  BarChart2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
// import { useAuth } from "../../components/authentication/AuthContext";

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();
  // const { user, clearUser } = useAuth();
  const [user, setUser] = useState(null);
  const [facePhotoSrc, setFacePhotoSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [roleManagement, setRoleManagement] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        if (!token) {
          setLoading(false);
          return;
        }

        setUser(userData);
        const response = await axios.get(`${API_BASE_URL}/api/user-profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // let facePhotoUrl = null;
        // if (response.data.face_photo) {
        //   if (response.data.face_photo.startsWith('data:image')) {
        //     facePhotoUrl = response.data.face_photo;
        //   } else {
        //     facePhotoUrl = `http://localhost:5001${response.data.face_photo}`;
        //   }
        // }

        const updatedUser = {
          ...userData,
          ...response.data,
          name: response.data.name || userData.name || userData.eng_name,
          eng_name: userData.eng_name,
          face_photo: response.data.face_photo,
          dept_name: response.data.dept_name || '',
          sec_name: response.data.sec_name || '',
          roles: response.data.roles || [],
          subRoles: response.data.sub_roles || [],
        };

        setUser(updatedUser);
        setFacePhotoSrc(response.data.face_photo);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        setUser(userData);
      } finally {
        setLoading(false);
      }
    };
    const fetchRoleManagement = async () => {
      try {
        const response = await axios.get( `${API_BASE_URL}/api/role-management`);
        setRoleManagement(response.data);
      } catch (error) {
        console.error('Error fetching role management:', error);
      }
    };

    fetchUserProfile();
    fetchRoleManagement();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    }
  }, [user]);


  const fetchUserRoles = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user-roles/${user.emp_id}`
      );
      setUserRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  // const fetchRoleManagement = async () => {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/api/role-management`);
  //     setRoleManagement(response.data);
  //   } catch (error) {
  //     console.error("Error fetching role management:", error);
  //   }
  // };

  const isSuperAdmin = userRoles.includes("Super Admin");
  const isAdmin = userRoles.includes("Admin");
  const isAllowedSuperAdmin = ["YM6702", "YM7903"].includes(user?.emp_id);

  // New hasAccess function that checks requiredRoles array
  const hasAccess = (requiredRoles) => {
    if (!user || !roleManagement) return false;
    // Super Admins and Admins have full access
    if (isSuperAdmin || isAdmin) return true;
    // Check if at least one of the required roles is present in the roleManagement data for this user
    return requiredRoles.some((reqRole) =>
      roleManagement.some(
        (roleObj) =>
          roleObj.role === reqRole &&
          roleObj.users.some((u) => u.emp_id === user.emp_id)
      )
    );
  };

  const handleSignOut = () => {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    // clearUser(); // Clear the global user state
    onLogout(); // Update App.jsx state
    navigate("/", { replace: true });
  };

  // Navigation items now include requiredRoles for each link.
  const navItems = [
    {
      title: "Cutting",
      icon: <ClipboardList className="h-5 w-5 mr-2" />,
      items: [
        {
          path: "/cutting",
          title: "Cutting",
          requiredRoles: ["Super Admin", "Admin", "Cutting"],
        },
        {
          path: "/scc",
          title: "SCC",
          requiredRoles: ["Super Admin", "Admin", "SCC"],
        },
      ],
    },
    {
      title: "Orders",
      icon: <Package className="h-5 w-5 mr-2" />,
      items: [
        {
          path: "/bundle-registration",
          title: "Bundle Registration",
          requiredRoles: ["Super Admin", "Admin", "Bundle Registration"],
        },
        {
          path: "/washing",
          title: "Washing",
          requiredRoles: ["Super Admin", "Admin", "Washing"],
        },
        {
          path: "/opa",
          title: "OPA",
          requiredRoles: ["Super Admin", "Admin", "OPA"],
        },
        {
          path: "/ironing",
          title: "Ironing",
          requiredRoles: ["Super Admin", "Admin", "Ironing"],
        },
        {
          path: "/packing",
          title: "Packing",
          requiredRoles: ["Super Admin", "Admin", "Packing"],
        },
      ],
    },
    {
      title: "QC",
      icon: <Activity className="h-5 w-5 mr-2" />,
      items: [
        {
          path: "/details",
          title: "QC1 Inspection",
          requiredRoles: ["Super Admin", "Admin", "QC1"],
        },
        {
          path: "/qc2-inspection",
          title: "QC2 Inspection",
          requiredRoles: ["Super Admin", "Admin", "QC2"],
        },
      ],
    },
    {
      title: "QA",
      icon: <BarChart2 className="h-5 w-5 mr-2" />,
      items: [
        {
          path: "/audit",
          title: "QA Audit",
          requiredRoles: ["Super Admin", "Admin", "QA"],
        },
      ],
    },
    {
      title: "Reports",
      icon: <FileText className="h-5 w-5 mr-2" />,
      items: [
        {
          path: "/download-data",
          title: "Download Data",
          requiredRoles: ["Super Admin", "Admin", "Download Data"],
        },
        {
          path: "/dashboard",
          title: "Live Dashboard",
          requiredRoles: ["Super Admin", "Admin", "Live Dashboard"],
        },
      ],
    },
  ];

  const showRoleManagement = isSuperAdmin || isAdmin;

  const toggleDropdown = (sectionTitle) => {
    setIsMenuOpen((prevState) =>
      prevState === sectionTitle ? null : sectionTitle
    );
  };

  const closeAllDropdowns = () => {
    setIsMenuOpen(null);
    setIsProfileOpen(false);
    setExpandedSection(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSectionClick = (sectionTitle) => {
    setExpandedSection((prevState) =>
      prevState === sectionTitle ? null : sectionTitle
    );
  };

  const handleSubLinkClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setExpandedSection(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen || isProfileOpen) {
        const isDropdownClicked = event.target.closest(".relative.group");
        const isProfileClicked = event.target.closest(".relative");
        if (!isDropdownClicked && !isProfileClicked) {
          closeAllDropdowns();
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMenuOpen, isProfileOpen]);

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/home" className="text-2xl font-bold text-blue-600">
              YQMS
            </Link>
          </div>

          <div className="hidden sm:flex sm:space-x-8">
            {navItems.map((section) => (
              <div key={section.title} className="relative group">
                <button
                  className="inline-flex items-center px-1 pt-1 text-m font-medium text-gray-900"
                  onClick={() => toggleDropdown(section.title)}
                >
                  {section.icon}
                  {section.title}
                  <ChevronDown className="ml-1 h-4 w-4" />
                </button>
                <div
                  className={`absolute left-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 ${
                    isMenuOpen === section.title
                      ? "opacity-100 visible"
                      : "opacity-0 invisible"
                  } transition-all duration-200`}
                >
                  <div className="py-1">
                    {section.items.map((item) => {
                      const accessible = hasAccess(item.requiredRoles);
                      return accessible ? (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={closeAllDropdowns}
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span
                          key={item.path}
                          className="block px-4 py-2 text-sm text-gray-400 cursor-not-allowed"
                        >
                          {item.title}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}

            {isAllowedSuperAdmin && (
              <Link
                to="/settings"
                className="inline-flex items-center px-1 pt-1 text-m font-medium text-gray-900"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Link>
            )}

            {showRoleManagement && (
              <>
                <Link
                  to="/role-management"
                  className="inline-flex items-center px-1 pt-1 text-m font-medium text-gray-900"
                >
                  <LayoutDashboard className="h-5 w-5 mr-2" />
                  Roles
                </Link>
                <Link
                  to="/user-list"
                  className="inline-flex items-center px-1 pt-1 text-m font-medium text-gray-900"
                >
                  <User className="h-5 w-5 mr-2" />
                  Users
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center">
            {user && (
              <div className="relative">
                <div
                  className="flex items-center space-x-4 cursor-pointer"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <span className="text-m font-medium text-gray-900">
                    {user.name}
                  </span>
                  <div className="relative">
                    <img
                      src={user.face_photo || "/default-avatar.png"}
                      alt={user.name}
                      className="h-10 w-10 rounded-full"
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
                        onClick={closeAllDropdowns}
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          closeAllDropdowns();
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

            <div className="sm:hidden">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-900 hover:text-gray-600 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((section) => (
              <div key={section.title}>
                <div
                  className="flex items-center justify-between px-4 py-2 text-base font-medium text-gray-700"
                  onClick={() => handleSectionClick(section.title)}
                >
                  {section.icon}
                  {section.title}
                  <ChevronRight
                    className={`h-4 w-4 transition-transform ${
                      expandedSection === section.title ? "rotate-90" : ""
                    }`}
                  />
                </div>
                {expandedSection === section.title && (
                  <div className="pl-4">
                    {section.items.map((item) => {
                      const accessible = hasAccess(item.requiredRoles);
                      return (
                        <div
                          key={item.path}
                          className={`block pl-4 pr-4 py-2 text-base font-medium ${
                            accessible
                              ? "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                          onClick={() =>
                            accessible && handleSubLinkClick(item.path)
                          }
                        >
                          {item.title}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {isAllowedSuperAdmin && (
              <div
                className="block pl-4 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                onClick={() => handleSubLinkClick("/settings")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </div>
            )}

            {showRoleManagement && (
              <>
                <div
                  className="block pl-4 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  onClick={() => handleSubLinkClick("/role-management")}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Role Management
                </div>
                <div
                  className="block pl-4 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  onClick={() => handleSubLinkClick("/user-list")}
                >
                  <User className="h-4 w-4 mr-2" />
                  User Management
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}