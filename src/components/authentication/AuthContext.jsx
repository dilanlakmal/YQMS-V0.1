import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [sub_roles, setSubRoles] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await axios.get('/api/user'); 
        const rolesResponse = await axios.get('/api/roles'); 
        const subRolesResponse = await axios.get('/api/sub_roles');
        setUser(userResponse.data);
        setRoles(rolesResponse.data);
        setSubRoles(subRolesResponse.data);
      } catch (error) {
        console.error('Error fetching user data and roles:', error);
      }
    };

    fetchUserData();
  }, []);

  const hashPassword = async (password) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  };

  return (
    <AuthContext.Provider value={{ user, roles,sub_roles, hashPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
