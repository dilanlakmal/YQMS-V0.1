import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  Search,
  Plus,
  Trash2,
  BellRing,
  Loader2,
  X,
  Briefcase
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Helper for Image URLs
const getPhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL.slice(0, -1)
    : PUBLIC_ASSET_URL;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

const FincheckNotificationGroup = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Staging (Selected but not saved yet)
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-notification-group/list`
      );
      if (res.data.success) setMembers(res.data.data);
    } catch (error) {
      console.error("Error fetching group", error);
    } finally {
      setLoading(false);
    }
  };

  // --- Search Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm && searchTerm.length >= 2) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${searchTerm}`
          );
          setSearchResults(res.data || []);
          setShowDropdown(true);
        } catch (error) {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // --- Handlers ---
  const handleSelectUser = (user) => {
    // Check if already in staging or already in DB list
    const isStaged = selectedUsers.some((u) => u.emp_id === user.emp_id);
    const isInDb = members.some((m) => m.empId === user.emp_id);

    if (isStaged || isInDb) {
      alert("User is already in the list or selected.");
      return;
    }

    setSelectedUsers((prev) => [...prev, user]);
    setSearchTerm("");
    setShowDropdown(false);
  };

  const handleRemoveFromStaging = (empId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.emp_id !== empId));
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) return;

    setSaving(true);
    try {
      // Map to backend structure
      const payload = selectedUsers.map((u) => ({
        empId: u.emp_id,
        empName: u.eng_name,
        jobTitle: u.job_title || "Staff",
        facePhoto: u.face_photo
      }));

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-notification-group/add`,
        { members: payload }
      );

      if (res.data.success) {
        fetchMembers();
        setSelectedUsers([]); // Clear staging
      }
    } catch (error) {
      alert("Failed to assign members.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this user from notification group?")) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/api/fincheck-notification-group/delete/${id}`
      );
      fetchMembers();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* --- ADD MEMBERS CARD --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
          <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Add Members to Notification Group
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Search Input */}
          <div className="relative z-20">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Search Employee
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by ID or Name..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                {searchResults.map((u) => (
                  <button
                    key={u.emp_id}
                    onClick={() => handleSelectUser(u)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {u.face_photo ? (
                        <img
                          src={getPhotoUrl(u.face_photo)}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      ) : (
                        <User className="w-4 h-4 m-2 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                        {u.emp_id}
                      </p>
                      <p className="text-xs text-gray-500">{u.eng_name}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Staging Area (Selected Users) */}
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Selected Users to Add
              </label>
              {selectedUsers.length > 0 && (
                <button
                  onClick={handleAssign}
                  disabled={saving}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                  Assign ({selectedUsers.length})
                </button>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex-1 min-h-[100px] overflow-y-auto">
              {selectedUsers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <User className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">No users selected</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((u) => (
                    <div
                      key={u.emp_id}
                      className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-lg shadow-sm"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {u.face_photo ? (
                          <img
                            src={getPhotoUrl(u.face_photo)}
                            className="w-full h-full object-cover"
                            alt=""
                          />
                        ) : (
                          <User className="w-3 h-3 m-1.5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 max-w-[120px]">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                          {u.eng_name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {u.emp_id}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveFromStaging(u.emp_id)}
                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- LIST TABLE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white">
            Current Notification Group
          </h3>
          <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-bold border border-indigo-200 dark:border-indigo-800">
            {members.length} Members
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase font-bold text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3">User Info</th>
                <th className="px-6 py-3">Job Title</th>
                <th className="px-6 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No members in the group yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                          {m.facePhoto ? (
                            <img
                              src={getPhotoUrl(m.facePhoto)}
                              alt={m.empName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">
                            {m.empName}
                          </p>
                          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                            {m.empId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Briefcase className="w-4 h-4 opacity-50" />
                        <span className="font-medium text-xs">
                          {m.jobTitle || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(m._id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors group"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FincheckNotificationGroup;
