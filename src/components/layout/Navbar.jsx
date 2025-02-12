import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu } from '@headlessui/react';
import { User, LogOut } from 'lucide-react';
import axios from 'axios';

function Navbar({ onLogout }) {
  const [user, setUser] = useState(null);
  const [facePhotoSrc, setFacePhotoSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

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

    fetchUserProfile();
  }, []);

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

  const roleBasedNavLinks = {
    admin_user: [
      { path: '/home', label: 'Home' },
      { path: '/details', label: 'Details' },
      { path: '/inspection', label: 'Inspection' },
      { path: '/return', label: 'Return' },
      { path: '/logs', label: 'Logs' },
      { path: '/defect-images', label: 'Defect Images' },
      { path: '/analytics', label: 'Analytics' },
      { path: '/userList', label: 'User Management' },
    ],
    ironingWorker: [
      { path: '/home', label: 'Home' },
      { path: '/details', label: 'Details' },
      { path: '/inspection', label: 'Inspection' },
    ],
    sewingSupervisor: [
      { path: '/home', label: 'Home' },
      { path: '/details', label: 'Details' },
      { path: '/inspection', label: 'Inspection' },
      { path: '/logs', label: 'Logs' },
    ],
    separator: [
      { path: '/home', label: 'Home' },
      { path: '/details', label: 'Details' },
    ],
    washingWorker: [
      { path: '/home', label: 'Home' },
      { path: '/details', label: 'Details' },
      { path: '/inspection', label: 'Inspection' },
    ],
    finishingChief: [
      { path: '/home', label: 'Home' },
      { path: '/details', label: 'Details' },
      { path: '/inspection', label: 'Inspection' },
      { path: '/return', label: 'Return' },
    ],
    qaManager: [
      { path: '/home', label: 'Home' },
      { path: '/details', label: 'Details' },
      { path: '/inspection', label: 'Inspection' },
      { path: '/return', label: 'Return' },
      { path: '/logs', label: 'Logs' },
      { path: '/defect-images', label: 'Defect Images' },
      { path: '/analytics', label: 'Analytics' },
    ],
    qaSupervisor: [
      { path: '/home', label: 'Home' },
      { path: '/details', label: 'Details' },
      { path: '/inspection', label: 'Inspection' },
      { path: '/return', label: 'Return' },
      { path: '/logs', label: 'Logs' },
    ],
  };

  const getNavLinksForUser = (roles, sub_roles) => {
    const links = [];
    const allRoles = [...roles, ...sub_roles];
    allRoles.forEach((role) => {
      if (roleBasedNavLinks[role]) {
        links.push(...roleBasedNavLinks[role]);
      }
    });
    return [...new Map(links.map((link) => [link.path, link])).values()];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const navLinks = user ? getNavLinksForUser(user.roles, user.sub_roles) : [];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-8xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  location.pathname === link.path
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-900 hover:text-indigo-600 hover:border-indigo-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center">
            {user && (
              <div className="flex items-center space-x-3 mr-3">
                <span className="text-sm font-medium text-gray-700">
                  {user.name || user.eng_name}
                </span>
              </div>
            )}
            <Menu as="div" className="relative ml-3">
              <Menu.Button className="flex items-center max-w-xs rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                <div className="flex items-center">
                  {facePhotoSrc ? (
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      src={facePhotoSrc}
                      alt={user ? user.name || user.eng_name : 'User'}
                      onError={() => {
                        setFacePhotoSrc('/IMG/default-profile.png');
                      }}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                </div>
              </Menu.Button>
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile"
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } block px-4 py-2 text-sm text-gray-700`}
                    >
                      Your Profile
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
