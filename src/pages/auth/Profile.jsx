import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [profile, setProfile] = useState({
    emp_id: "",
    name: "",
    dept_name: "",
    sect_name: "",
    image: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token =
          localStorage.getItem("accessToken") ||
          sessionStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No token found in localStorage or sessionStorage");
        }

        const response = await axios.get(
          "http://localhost:5001/api/user-profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userData = response.data;
        // console.log('Fetched user data:', userData);

        setProfile({
          emp_id: userData.emp_id || "",
          name: userData.name || "",
          dept_name: userData.dept_name || "",
          sect_name: userData.sect_name || "",
          image: userData.face_photo || "",
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfile((prev) => ({ ...prev, image: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No token found in localStorage or sessionStorage");
      }


      const formData = new FormData();
      formData.append("emp_id", profile.emp_id);
      formData.append("name", profile.name);
      formData.append("dept_name", profile.dept_name);
      formData.append("sect_name", profile.sect_name);
      if (profile.image && profile.image instanceof File) {
        formData.append("profile", profile.image);
      }

     

      const response = await axios.put(
        "http://localhost:5001/api/user-profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage("Profile updated successfully!");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage("Failed to update profile.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl text-center font-bold text-gray-900 mb-8">
          User Profile
        </h1>
        {message && (
          <div className="text-center mb-4 text-green-500">{message}</div>
        )}
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-6"
        >
          <div className="flex justify-center mb-6">
            <div className="relative place-items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {profile.image ? (
                  typeof profile.image === "string" ? (
                    <img
                      src={profile.image}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/IMG/default-profile.png"; // Fallback to default icon
                      }}
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(profile.image)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {/* <div className="mt-2 text-sm text-center text-gray-600 text-xl">
                Click to change photo
              </div> */}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div>
              <label className="block text-xl text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <input
                type="text"
                value={profile.emp_id}
                readOnly
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, emp_id: e.target.value }))
                }
                className="mt-4 block text-x w-full border border rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xl text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                value={profile.name}
                readOnly
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-4 block text-x w-full border border rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                value={profile.dept_name}
                readOnly
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, dept_name: e.target.value }))
                }
                className="mt-4 block text-x w-full border border rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-700">
                Section Name
              </label>
              <input
                type="text"
                value={profile.sect_name}
                readOnly
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, sect_name: e.target.value }))
                }
                className="mt-4 block text-x w-full border border rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex justify-center">
            {/* <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button> */}
          </div>
        </form>
      </div>
    </div>
  );
}

export default Profile;