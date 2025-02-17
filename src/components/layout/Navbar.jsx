import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from '@headlessui/react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import axios from 'axios';
import LanguageSwitcher from './LangSwitch';
// import { useAuth } from "./authentication/AuthContext";

function Navbar({ onLogout }) {
  const [user, setUser] = useState(null);
  // const { user } = useAuth();
  const [facePhotoSrc, setFacePhotoSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        const response = await axios.get('http://localhost:5001/api/user-profile', {
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
        const userData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
        setUser(userData);
      } finally {
        setLoading(false);
      }
    };
    const fetchRoleManagement = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/role-management');
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
        `http://localhost:5001/api/user-roles/${user.emp_id}`
      );
      setUserRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  // const fetchRoleManagement = async () => {
  //   try {
  //     const response = await axios.get(
  //       "http://localhost:5001/api/role-management"
  //     );
  //     setRoleManagement(response.data);
  //   } catch (error) {
  //     console.error("Error fetching role management:", error);
  //   }
  // };

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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('user');
    onLogout();
    navigate('/login');
  };

  // const roleBasedNavLinks = {
  //   admin_user: [
  //     { path: '/home', label: 'Home' },
  //     { path: '/details', label: 'Details' },
  //     { path: '/inspection', label: 'Inspection' },
  //     { path: '/return', label: 'Return' },
  //     { path: '/logs', label: 'Logs' },
  //     { path: '/defect-images', label: 'Defect Images' },
  //     { path: '/analytics', label: 'Analytics' },
  //     { path: '/userList', label: 'User Management' },
  //   ],
  //   ironingWorker: [
  //     { path: '/home', label: 'Home' },
  //     { path: '/details', label: 'Details' },
  //     { path: '/inspection', label: 'Inspection' },
  //   ],
  //   sewingSupervisor: [
  //     { path: '/home', label: 'Home' },
  //     { path: '/details', label: 'Details' },
  //     { path: '/inspection', label: 'Inspection' },
  //     { path: '/logs', label: 'Logs' },
  //   ],
  //   separator: [
  //     { path: '/home', label: 'Home' },
  //     { path: '/details', label: 'Details' },
  //   ],
  //   washingWorker: [
  //     { path: '/home', label: 'Home' },
  //     { path: '/details', label: 'Details' },
  //     { path: '/inspection', label: 'Inspection' },
  //   ],
  //   finishingChief: [
  //     { path: '/home', label: 'Home' },
  //     { path: '/details', label: 'Details' },
  //     { path: '/inspection', label: 'Inspection' },
  //     { path: '/return', label: 'Return' },
  //   ],
  //   qaManager: [
  //     { path: '/home', label: 'Home' },
  //     { path: '/details', label: 'Details' },
  //     { path: '/inspection', label: 'Inspection' },
  //     { path: '/return', label: 'Return' },
  //     { path: '/logs', label: 'Logs' },
  //     { path: '/defect-images', label: 'Defect Images' },
  //     { path: '/analytics', label: 'Analytics' },
  //   ],
  //   qaSupervisor: [
  //     { path: '/home', label: 'Home' },
  //     { path: '/details', label: 'Details' },
  //     { path: '/inspection', label: 'Inspection' },
  //     { path: '/return', label: 'Return' },
  //     { path: '/logs', label: 'Logs' },
  //   ],
  // };

  // const getNavLinksForUser = (roles, sub_roles) => {
  //   const links = [];
  //   const allRoles = [...roles, ...sub_roles];
  //   allRoles.forEach((role) => {
  //     if (roleBasedNavLinks[role]) {
  //       links.push(...roleBasedNavLinks[role]);
  //     }
  //   });
  //   return [...new Map(links.map((link) => [link.path, link])).values()];
  // };

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

  if (loading) {
    return <div>Loading...</div>;
  }

  // const navLinks = user ? getNavLinksForUser(user.roles, user.sub_roles) : [];

const showRoleManagement = isSuperAdmin || isAdmin;

  return (
    // <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
    //   <div className="max-w-8xl mx-auto px-4">
    //     <div className="flex justify-between h-16">
    //       <div className="flex space-x-8">
    //         {navLinks.map((link) => (
    //           <Link
    //             key={link.path}
    //             to={link.path}
    //             className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
    //               location.pathname === link.path
    //                 ? 'border-indigo-600 text-indigo-600'
    //                 : 'border-transparent text-gray-900 hover:text-indigo-600 hover:border-indigo-300'
    //             }`}
    //           >
    //             {link.label}
    //           </Link>
    //         ))}
    //       </div>
    //       <div className="flex items-center space-x-3 mr-3">
    //         <LanguageSwitcher />
    //         </div>
    //       <div className="flex items-center">
    //         {user && (
    //           <div className="flex items-center space-x-3 mr-3">
    //             <span className="text-sm font-medium text-gray-700">
    //               {user.name || user.eng_name}
    //             </span>
    //           </div>
    //         )}
    //         <Menu as="div" className="relative ml-3">
    //           <Menu.Button className="flex items-center max-w-xs rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
    //             <span className="sr-only">Open user menu</span>
    //             <div className="flex items-center">
    //               {facePhotoSrc ? (
    //                 <img
    //                   className="h-8 w-8 rounded-full object-cover"
    //                   src={facePhotoSrc}
    //                   alt={user ? user.name || user.eng_name : 'User'}
    //                   onError={() => {
    //                     setFacePhotoSrc('/IMG/default-profile.png');
    //                   }}
    //                 />
    //               ) : (
    //                 <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
    //                   <User className="h-5 w-5 text-gray-500" />
    //                 </div>
    //               )}
    //             </div>
    //           </Menu.Button>
    //           <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
    //             <Menu.Item>
    //               {({ active }) => (
    //                 <Link
    //                   to="/profile"
    //                   className={`${
    //                     active ? 'bg-gray-100' : ''
    //                   } block px-4 py-2 text-sm text-gray-700`}
    //                 >
    //                   Your Profile
    //                 </Link>
    //               )}
    //             </Menu.Item>
    //             <Menu.Item>
    //               {({ active }) => (
    //                 <button
    //                   onClick={handleLogout}
    //                   className={`${
    //                     active ? 'bg-gray-100' : ''
    //                   } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
    //                 >
    //                   <LogOut className="mr-2 h-4 w-4" />
    //                   Sign out
    //                 </button>
    //               )}
    //             </Menu.Item>
    //           </Menu.Items>
    //         </Menu>
    //       </div>
    //     </div>
    //   </div>
    // </nav>

    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
  <div className="max-w-8xl mx-auto px-4">
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
      <div className="flex items-center space-x-3 mr-3">
             <LanguageSwitcher />
        </div>
      <div className="flex items-center border pr-2 pl-2">
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
                      handleLogout();
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

export default Navbar;