// import axios from "axios";
// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";

// function Profile() {
//   const [profile, setProfile] = useState({
//     emp_id: "",
//     name: "",
//     dept_name: "",
//     sect_name: "",
//     image: "", // This will be a URL (from face_photo or custom image)
//   });
//   const [message, setMessage] = useState("");
//   const navigate = useNavigate();

//   // Fetch user data from API on mount
//   useEffect(() => {
//     const fetchUserData = async () => {
//       try {
//         const token =
//           localStorage.getItem("accessToken") ||
//           sessionStorage.getItem("accessToken");
//         if (!token) throw new Error("No token found");

//         const response = await axios.get(
//           "http://localhost:5001/api/user-profile",
//           {
//             headers: { Authorization: `Bearer ${token}` },
//           }
//         );
//         const userData = response.data;
//         setProfile({
//           emp_id: userData.emp_id || "",
//           name: userData.name || "",
//           dept_name: userData.dept_name || "",
//           sect_name: userData.sect_name || "",
//           image: userData.profile || "", // This should be an absolute URL (face_photo if no custom image)
//         });
//       } catch (error) {
//         console.error("Error fetching user data:", error);
//       }
//     };

//     fetchUserData();
//   }, []);

//   // Handle file change
//   const handleImageChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setProfile((prev) => ({ ...prev, image: file }));
//     }
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const token =
//         localStorage.getItem("accessToken") ||
//         sessionStorage.getItem("accessToken");
//       if (!token) throw new Error("No token found");

//       const formData = new FormData();
//       formData.append("emp_id", profile.emp_id);
//       formData.append("name", profile.name);
//       formData.append("dept_name", profile.dept_name);
//       formData.append("sect_name", profile.sect_name);
//       // Append new file if user has chosen one
//       if (profile.image && profile.image instanceof File) {
//         formData.append("profile", profile.image);
//       }

//       await axios.put("http://localhost:5001/api/user-profile", formData, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       setMessage("Profile updated successfully!");
//       setTimeout(() => {
//         navigate("/home");
//       }, 2000);
//     } catch (error) {
//       console.error("Error updating profile:", error);
//       setMessage("Failed to update profile.");
//     }
//   };

//   // Helper to determine the proper image URL to show.
//   // If profile.image is a string, we assume it’s a valid URL.
//   // If no image is available, we return the fallback.
//   const getProfileImageSrc = () => {
//     if (!profile.image) return "/IMG/default-profile.png";
//     if (typeof profile.image === "string") return profile.image;
//     // For a File object, create an object URL.
//     return URL.createObjectURL(profile.image);
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
//       <div className="max-w-2xl mx-auto p-6">
//         <h1 className="text-3xl text-center font-bold text-gray-900 mb-8">
//           User Profile
//         </h1>
//         {message && (
//           <div className="text-center mb-4 text-green-500">{message}</div>
//         )}
//         <form
//           onSubmit={handleSubmit}
//           className="bg-white p-6 rounded-lg shadow-md space-y-6"
//         >
//           {/* Image Upload Section */}
//           <div className="flex justify-center mb-6">
//             <div className="relative">
//               <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
//                 <div
//                   className="w-full h-full"
//                   style={{
//                     backgroundImage: `url(${getProfileImageSrc()})`,
//                     backgroundSize: "cover",
//                     backgroundPosition: "center",
//                   }}
//                 ></div>
//               </div>
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={handleImageChange}
//                 className="absolute inset-0 opacity-0 cursor-pointer"
//               />
//               <div className="mt-2 text-sm text-center text-gray-600">
//                 Click to change photo
//               </div>
//             </div>
//           </div>
//           {/* Form Fields */}
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
//             <div>
//               <label className="block text-xl font-medium text-gray-700">
//                 Employee ID
//               </label>
//               <input
//                 type="text"
//                 value={profile.emp_id}
//                 onChange={(e) =>
//                   setProfile((prev) => ({ ...prev, emp_id: e.target.value }))
//                 }
//                 className="mt-4 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//               />
//             </div>
//             <div>
//               <label className="block text-xl font-medium text-gray-700">
//                 Name
//               </label>
//               <input
//                 type="text"
//                 value={profile.name}
//                 onChange={(e) =>
//                   setProfile((prev) => ({ ...prev, name: e.target.value }))
//                 }
//                 className="mt-4 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//               />
//             </div>
//             <div>
//               <label className="block text-xl font-medium text-gray-700">
//                 Department
//               </label>
//               <input
//                 type="text"
//                 value={profile.dept_name}
//                 onChange={(e) =>
//                   setProfile((prev) => ({ ...prev, dept_name: e.target.value }))
//                 }
//                 className="mt-4 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//               />
//             </div>
//             <div>
//               <label className="block text-xl font-medium text-gray-700">
//                 Section Name
//               </label>
//               <input
//                 type="text"
//                 value={profile.sect_name}
//                 onChange={(e) =>
//                   setProfile((prev) => ({ ...prev, sect_name: e.target.value }))
//                 }
//                 className="mt-4 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//               />
//             </div>
//           </div>
//           {/* Save Button */}
//           <div className="flex justify-center">
//             <button
//               type="submit"
//               className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               Save Changes
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default Profile;

// Profile.jsx
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState({
    emp_id: "",
    name: "",
    dept_name: "",
    sect_name: "",
    working_status: "",
    phone_number: "",
    eng_name: "",
    kh_name: "",
    job_title: "",
    email: "",
    profile: "", // This will be a URL string or a File object
    face_photo: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        if (!token) throw new Error("No token found");

        const response = await axios.get(
          "http://localhost:5001/api/user-profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        // Ensure face_photo is properly set from the response
        setProfile({
          ...response.data,
          face_photo: response.data.face_photo || "/IMG/default-profile.png",
        });

        //setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  // Handle file input change
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({ ...prev, profile: file }));
    }
  };

  // Handle phone number change (only editable field)
  const handlePhoneChange = (e) => {
    setProfile((prev) => ({ ...prev, phone_number: e.target.value }));
  };

  //   // Handle changes for text inputs
  //   const handleInputChange = (e) => {
  //     const { name, value } = e.target;
  //     setProfile((prev) => ({ ...prev, [name]: value }));
  //   };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");
      if (!token) throw new Error("No token found");

      const formData = new FormData();
      formData.append("emp_id", profile.emp_id);
      formData.append("name", profile.name);
      formData.append("dept_name", profile.dept_name);
      formData.append("sect_name", profile.sect_name);
      formData.append("phone_number", profile.phone_number);
      formData.append("eng_name", profile.eng_name);
      formData.append("kh_name", profile.kh_name);
      formData.append("job_title", profile.job_title);
      formData.append("email", profile.email);
      if (profile.profile && profile.profile instanceof File) {
        formData.append("profile", profile.profile);
      }

      await axios.put("http://localhost:5001/api/user-profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Profile updated successfully!");
      setTimeout(() => {
        navigate("/home");
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile.");
    }
  };

  // Determine which image URL to show.
  // If profile.profile is a File, generate a temporary URL.
  // Otherwise, use the URL from the server. If none exists, fallback.

  const getProfileImageSrc = () => {
    if (profile.profile instanceof File) {
      return URL.createObjectURL(profile.profile);
    }
    if (profile.profile) {
      return profile.profile;
    }
    return profile.face_photo || "/IMG/default-profile.png";
  };

  //   const getProfileImageSrc = () => {
  //     if (!profile.profile)
  //       return profile.face_photo || "/IMG/default-profile.png";
  //     if (typeof profile.profile === "string") return profile.profile;
  //     return URL.createObjectURL(profile.profile);
  //   };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-10 px-5">
      <div className="max-w-3xl mx-auto bg-gray-600 p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-100 mb-6">
          User Profile
        </h1>
        {message && (
          <div className="text-center mb-4 text-green-500">{message}</div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Top Section: Profile Photo and Basic User Info */}
          <div className="mb-6 bg-blue-50 p-4 rounded-lg flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                <img
                  src={getProfileImageSrc()}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <div className="flex-grow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Employee ID
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{profile.emp_id}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Working Status
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.working_status}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.dept_name}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Section
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {profile.sect_name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-100">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={profile.name}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-100">
                Phone Number
              </label>
              <input
                type="text"
                name="phone_number"
                value={profile.phone_number}
                onChange={handlePhoneChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-100">
                English Name
              </label>
              <input
                type="text"
                name="eng_name"
                value={profile.eng_name}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-100">
                Khmer Name
              </label>
              <input
                type="text"
                name="kh_name"
                value={profile.kh_name}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-100">
                Job Title
              </label>
              <input
                type="text"
                name="job_title"
                value={profile.job_title}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-100">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                readOnly
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;
