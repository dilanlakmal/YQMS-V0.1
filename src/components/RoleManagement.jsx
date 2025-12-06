import axios from "axios";
import { X, ShieldCheck, Users as UsersIcon, Tag } from "lucide-react";
import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { API_BASE_URL } from "../../config";
import autoTable from "jspdf-autotable";

export default function RoleManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("current");
  const [roles, setRoles] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedJobTitles, setSelectedJobTitles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [filterRole, setFilterRole] = useState(""); // State for role filter in User Roles tab

  const [ieRoleSummary, setIeRoleSummary] = useState([]);
  const [loadingIeRoles, setLoadingIeRoles] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchJobTitles();
    if (user?.emp_id) {
      fetchUserRoles();
    }
  }, [user?.emp_id]);

  const fetchIeRoleSummary = useCallback(async () => {
    setLoadingIeRoles(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ie/role-management/summary`
      );
      setIeRoleSummary(response.data);
    } catch (error) {
      console.error("Error fetching IE role summary:", error);
      setError("Failed to fetch IE process access roles.");
    } finally {
      setLoadingIeRoles(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "ie-roles") {
      fetchIeRoleSummary();
    }
  }, [activeTab, fetchIeRoleSummary]);

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
      setSelectedUsers(existingRole.users.map(u => u.emp_id));
      setIsEditing(true);
    } else {
      setSelectedJobTitles([]);
      setMatchingUsers([]);
      setSelectedUsers([]);
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
    const removedUsers = matchingUsers.filter((user) => user.job_title === title);
    setMatchingUsers((prev) => prev.filter((user) => user.job_title !== title));
    setSelectedUsers((prev) => prev.filter((empId) => !removedUsers.some(u => u.emp_id === empId)));
  };

  const handleUserSelect = (empId) => {
    setSelectedUsers((prev) => 
      prev.includes(empId) 
        ? prev.filter((id) => id !== empId)
        : [...prev, empId]
    );
  };

  const handleSubmit = async () => {
    if (!selectedRole || selectedJobTitles.length === 0) {
      setError("Please select both role and job titles");
      return;
    }

    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }

    if (selectedRole === "Admin" && !isSuperAdmin) {
      setError("Only Super Admin can modify Admin role");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/role-management`, {
        role: selectedRole,
        jobTitles: selectedJobTitles,
        selectedUsers: selectedUsers
      });

      setSuccessMessage(
        isEditing ? "Role updated successfully!" : "Role added successfully!"
      );
      fetchRoles();
      if (!isEditing) {
        setSelectedRole("");
        setSelectedJobTitles([]);
        setMatchingUsers([]);
        setSelectedUsers([]);
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save role");
    }
  };

  // Function to generate and download PDF
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);

    // Set the title based on the selected role
    const pdfTitle = filterRole ? `${filterRole} Users Data` : "All Users Data";
    doc.text(pdfTitle, 14, 22);

    // Prepare table data
    const tableData = [];
    roles.forEach((role) => {
      if (filterRole && role.role !== filterRole) return; // Apply role filter
      role.users
        .sort((a, b) => (a.emp_id || "").localeCompare(b.emp_id || "")) // Sort by emp_id
        .forEach((user) => {
          tableData.push([
            role.role,
            user.name || "N/A",
            user.emp_id || "N/A",
            user.eng_name || "N/A",
            user.job_title || "N/A",
            user.dept_name || "N/A",
            user.sect_name || "N/A"
          ]);
        });
    });

    // Define table columns
    const tableColumns = [
      "Role",
      "User Name",
      "Password (Emp ID)",
      "Eng Name",
      "Job Title",
      "Department",
      "Section"
    ];

    // Generate table using autoTable
    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 }, // Smaller font size for table content
      headStyles: { fillColor: [0, 102, 204], textColor: [255, 255, 255] }, // Blue header with white text
      alternateRowStyles: { fillColor: [240, 240, 240] }, // Light gray for alternate rows
      margin: { top: 30 }
    });

    // Set the file name based on the selected role
    const pdfFileName = filterRole ? `${filterRole} users.pdf` : "Allusers.pdf";
    doc.save(pdfFileName);
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
    "QC Roving",
    "Printing",
    "QC2 Tracking",
    "QC1 Inspection",
    "QC2 Inspection",
    "QA Audit",
    "Final Inspection",
    "Download Data",
    "Live Dashboard",
    "Power BI",
    "QC1 Sunrise",
    "System Administration",
    "QA",
    "Washing Clerk",
    "QA Clerk",
    "ANF QA",
    "QC Washing",
    "QC1 Sub Con",
    "Measurement",
    "Fin Check Measurements",
    "QC Ironing"
  ];

  // Prepare sorted table data for rendering
  const sortedTableData = [];
  roles.forEach((role) => {
    if (filterRole && role.role !== filterRole) return; // Apply role filter
    role.users
      .sort((a, b) => (a.emp_id || "").localeCompare(b.emp_id || "")) // Sort by emp_id
      .forEach((user) => {
        sortedTableData.push({ role: role.role, user });
      });
  });

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
            <button
              onClick={() => setActiveTab("ie-roles")}
              className={`${
                activeTab === "ie-roles"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              IE Process Access
            </button>
            <button
              onClick={() => setActiveTab("user-roles")}
              className={`${
                activeTab === "user-roles"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              User Roles
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
      ) : activeTab === "add" ? (
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
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Users ({selectedUsers.length} selected)
                </label>
                <div className="flex gap-2 mb-2">
                  {matchingUsers.length > 0 && (
                    <button
                      onClick={() => setSelectedUsers(matchingUsers.map(user => user.emp_id))}
                      className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                    >
                      Add All
                    </button>
                  )}
                  {selectedUsers.length > 0 && (
                    <button
                      onClick={() => setSelectedUsers([])}
                      className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-1 border rounded-md p-4 min-h-[200px] max-h-[400px] overflow-y-auto">
                <div className="flex flex-wrap gap-4">
                  {matchingUsers.map((user) => (
                    <SelectableUserCard 
                      key={user.emp_id} 
                      user={user} 
                      isSelected={selectedUsers.includes(user.emp_id)}
                      onSelect={() => handleUserSelect(user.emp_id)}
                    />
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
      ) : activeTab === "ie-roles" ? (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-800">
            IE Process Access Summary
          </h2>
          <p className="text-sm text-gray-600">
            This section is read-only. Access is granted by assigning workers to
            specific Task Numbers in the IE dashboard.
          </p>
          {loadingIeRoles ? (
            <p>Loading...</p>
          ) : (
            ieRoleSummary.map((section) => (
              <div key={section.pageName} className="border-t pt-4">
                <h3 className="text-lg font-bold text-indigo-700 flex items-center mb-3">
                  <ShieldCheck className="w-5 h-5 mr-2" /> {section.pageName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 flex items-center mb-2">
                      <Tag className="w-4 h-4 mr-2" />
                      Required Tasks
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {section.requiredTasks.length > 0 ? (
                        section.requiredTasks.map((task) => (
                          <span
                            key={task}
                            className="bg-blue-100 text-blue-800 text-xs font-mono px-2 py-1 rounded-full"
                          >
                            {task}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500">None</span>
                      )}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center mb-2">
                      <UsersIcon className="w-4 h-4 mr-2" />
                      Users with Access ({section.users.length})
                    </label>
                    <div className="flex flex-wrap gap-4 p-2 border rounded-md min-h-[60px]">
                      {section.users.length > 0 ? (
                        section.users.map((u) => (
                          <UserCard key={u.emp_id} user={u} />
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 self-center">
                          No users have access.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Enhanced "User Roles" Tab
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Role
              </label>
              <select
                className="block w-64 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                {roles.map((role) => (
                  <option key={role.role} value={role.role}>
                    {role.role}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
            >
              Download PDF
            </button>
          </div>

          <div className="overflow-x-auto border rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Password (Emp ID)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Eng Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Section
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTableData.map(({ role, user }, index) => (
                  <tr
                    key={`${role}-${user.emp_id}`}
                    className={`${
                      index % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-gray-100 transition-colors duration-150`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {role}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.emp_id || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.eng_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.job_title || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.dept_name || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.sect_name || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

const SelectableUserCard = ({ user, isSelected, onSelect }) => (
  <div className="flex-shrink-0 w-24 text-center relative">
    <div className="relative">
      <img
        src={user.face_photo || "/default-avatar.png"}
        alt={user.name}
        className={`w-12 h-12 mx-auto rounded-full cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-blue-500 opacity-100' : 'opacity-70 hover:opacity-100'
        }`}
        onClick={onSelect}
      />
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onSelect}
        className="absolute -top-1 -right-1 w-4 h-4 text-blue-600 bg-white border-2 border-gray-300 rounded focus:ring-blue-500"
      />
    </div>
    <div className="text-xs mt-1">{user.emp_id}</div>
    <div className="text-xs truncate">{user.name}</div>
  </div>
);
