import axios from "axios";
import { X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/authentication/AuthContext";
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../config";

export default function RoleManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("current");
  const [roles, setRoles] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedJobTitles, setSelectedJobTitles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userRoles, setUserRoles] = useState([]);

  useEffect(() => {
    fetchRoles();
    fetchJobTitles();
    if (user?.emp_id) {
      fetchUserRoles();
    }
  }, [user?.emp_id]);

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

  const isSuperAdmin = userRoles.includes("Super Admin");

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/role-management`);
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles");
    }
  };

  const fetchJobTitles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-titles`);
      setJobTitles(response.data);
    } catch (error) {
      setError("Failed to fetch job titles");
    }
  };

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    const existingRole = roles.find((r) => r.role === role);
    if (existingRole) {
      setSelectedJobTitles(existingRole.jobTitles);
      // Fetch users for existing job titles
      const users = [];
      for (const title of existingRole.jobTitles) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/users-by-job-title?jobTitle=${title}`
          );
          users.push(
            ...response.data.filter((user) => user.working_status === "Working")
          );
        } catch (error) {
          console.error("Error fetching users for job title:", title);
        }
      }
      setMatchingUsers(users);
      setIsEditing(true);
    } else {
      setSelectedJobTitles([]);
      setMatchingUsers([]);
      setIsEditing(false);
    }
  };

  const handleJobTitleSelect = async (title) => {
    if (!selectedJobTitles.includes(title)) {
      const newJobTitles = [...selectedJobTitles, title];
      setSelectedJobTitles(newJobTitles);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users-by-job-title?jobTitle=${title}`
        );
        const workingUsers = response.data.filter(
          (user) => user.working_status === "Working"
        );
        setMatchingUsers((prev) => {
          const existingEmpIds = new Set(prev.map((u) => u.emp_id));
          const newUsers = workingUsers.filter(
            (u) => !existingEmpIds.has(u.emp_id)
          );
          return [...prev, ...newUsers];
        });
      } catch (error) {
        setError("Failed to fetch users");
      }
    }
    setSearchQuery("");
  };

  const handleJobTitleRemove = (title) => {
    setSelectedJobTitles((prev) => prev.filter((t) => t !== title));
    setMatchingUsers((prev) => prev.filter((user) => user.job_title !== title));
  };

  const handleSubmit = async () => {
    if (!selectedRole || selectedJobTitles.length === 0) {
      setError("Please select both role and job titles");
      return;
    }

    // Check if user is trying to modify Admin role without being Super Admin
    if (selectedRole === "Admin" && !isSuperAdmin) {
      setError("Only Super Admin can modify Admin role");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/role-management`, {
        role: selectedRole,
        jobTitles: selectedJobTitles
      });

      setSuccessMessage(
        isEditing ? "Role updated successfully!" : "Role added successfully!"
      );
      fetchRoles();
      if (!isEditing) {
        setSelectedRole("");
        setSelectedJobTitles([]);
        setMatchingUsers([]);
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save role");
    }
  };

  const availableRoles = [
    ...(isSuperAdmin ? ["Admin"] : []),
    "Cutting",
    "SCC",
    "Bundle Registration",
    "Washing",
    "OPA",
    "Ironing",
    "Packing",
    "QC1",
    "QC2",
    "QA",
    "Download Data",
    "Live Dashboard"
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Role Management</h1>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("current")}
              className={`${
                activeTab === "current"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Current Roles
            </button>
            <button
              onClick={() => setActiveTab("add")}
              className={`${
                activeTab === "add"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Add/Update Role
            </button>
          </nav>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      {activeTab === "current" ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Job Titles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Users
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.role}>
                    <td className="px-6 py-4 whitespace-nowrap">{role.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {role.jobTitles.map((title) => (
                          <span
                            key={title}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                          >
                            {title}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-4">
                        {role.users.map((user) => (
                          <UserCard key={user.emp_id} user={user} />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedRole}
                onChange={(e) => handleRoleSelect(e.target.value)}
              >
                <option value="">Select Role</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Job Titles
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  placeholder="Search job titles"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <div className="absolute z-10 mt-1 w-full max-w-lg bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {jobTitles
                      .filter((title) =>
                        title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((title) => (
                        <div
                          key={title}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleJobTitleSelect(title)}
                        >
                          {title}
                        </div>
                      ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedJobTitles.map((title) => (
                    <span
                      key={title}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                    >
                      {title}
                      <X
                        className="ml-1 w-4 h-4 cursor-pointer"
                        onClick={() => handleJobTitleRemove(title)}
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Users
              </label>
              <div className="mt-1 border rounded-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                <div className="flex flex-wrap gap-4">
                  {matchingUsers.map((user) => (
                    <UserCard key={user.emp_id} user={user} />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              {isEditing ? "Update" : "Add"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const UserCard = ({ user }) => (
  <div className="flex-shrink-0 w-24 text-center">
    <img
      src={user.face_photo || "/default-avatar.png"}
      alt={user.name}
      className="w-12 h-12 mx-auto rounded-full"
    />
    <div className="text-xs mt-1">{user.emp_id}</div>
    <div className="text-xs truncate">{user.name}</div>
  </div>
);
