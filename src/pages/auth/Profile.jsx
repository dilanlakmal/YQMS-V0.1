import { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const [profile, setProfile] = useState({
    name: '',
    department: '',
    sectionName: '',
    image: null,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/user-profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Assuming the token is stored in localStorage
          },
        });
        const userData = response.data;
        setProfile({
          name: userData.name,
          department: userData.dept_name,
          sectionName: userData.sect_name,
          image: userData.profile,
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        'http://localhost:5001/api/user-profile',
        {
          name: profile.name,
          dept_name: profile.department,
          sect_name: profile.sectionName,
          profile: profile.image,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`, // Assuming the token is stored in localStorage
          },
        }
      );
      console.log('Profile updated:', response.data);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-gray-100 py-20 px-20">
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl text-center font-bold text-gray-900 mb-8">User Profile</h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative place-items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200">
                {profile.image ? (
                  <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
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
              <div className="mt-2 text-sm text-center text-gray-600 text-xl">Click to change photo</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div>
              <label className="block text-xl text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1 block text-xl w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-700">Department</label>
              <input
                type="text"
                value={profile.department}
                onChange={(e) => setProfile((prev) => ({ ...prev, department: e.target.value }))}
                className="mt-1 block text-xl w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xl font-medium text-gray-700">Section Name</label>
              <input
                type="text"
                value={profile.sectionName}
                onChange={(e) => setProfile((prev) => ({ ...prev, sectionName: e.target.value }))}
                className="mt-1 block text-xl w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
