import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import bcrypt from 'bcryptjs'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
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
          emp_id: response.data.emp_id,
          eng_name: response.data.eng_name,
          kh_name: response.data.kh_name,
          job_title: response.data.job_title,
          dept_name: response.data.dept_name,
          sect_name: response.data.sect_name,
          roles: response.data.roles || [],
          sub_roles: response.data.sub_roles || [],
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!user) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const hashPassword = async (password) => {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  };

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
    <AuthContext.Provider value={{ user, setUser, loading, hashPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
