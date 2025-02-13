// import axios from "axios";
// import React, { createContext, useContext, useEffect, useState } from "react";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         const token =
//           localStorage.getItem("accessToken") ||
//           sessionStorage.getItem("accessToken");
//         if (!token) {
//           setLoading(false);
//           return;
//         }

//         const response = await axios.post(
//           "http://localhost:5001/api/get-user-data",
//           { token }
//         );

//         const userData = {
//           ...response.data,
//           emp_id: response.data.emp_id,
//           eng_name: response.data.eng_name,
//           kh_name: response.data.kh_name,
//           job_title: response.data.job_title,
//           dept_name: response.data.dept_name,
//           sect_name: response.data.sect_name,
//           roles: response.data.roles || [],
//           sub_roles: response.data.sub_roles || [],
//         };

//         setUser(userData);
//       } catch (error) {
//         console.error("Error fetching user data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, []);

//   return (
//     <AuthContext.Provider value={{ user, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => useContext(AuthContext);

// AuthContext.jsx
import axios from "axios";
import React, { createContext, useContext, useEffect, useState } from "react";

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
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await axios.post(
          "http://localhost:5001/api/get-user-data",
          { token }
        );
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
        console.error("Error fetching user data:", error);
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

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
