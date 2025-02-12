import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.post('http://localhost:5001/api/get-user-data', { token });

        const userData = {
          ...response.data,
          roles: response.data.roles || [],
          sub_roles: response.data.sub_roles || [],
        };

        setUser(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const token = localStorage.getItem('accessToken'); 
  //       if (token) {
  //         const response = await axios.post('/api/get-user-data', { token });
  //         setUser(response.data);
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch user data:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchUserData();
  // }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
