import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import bcrypt from 'bcryptjs';
import axios from "axios";

const EditUserModal = ({ isOpen, onClose, user, onSubmit }) => {
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Currently, only phone_number is editable (true), all others are false.
  const editableFields = {
    name: false,
    phone_number: false,
    eng_name: false,
    kh_name: false,
    job_title: false,
    email: false,
  };

  const availableRoles = [
    "Bundle Registration",
    "Washing",
    "Dyeing",
    "Ironing",
    "Packing",
    "QC1",
    "QC2",
    "QA",
    "Download Data",
    "Live Dashboard",
  ];

  // Array of allowed working statuses that can modify roles.
  const allowWorkingStatus = ["Working"];
  const disableRoles = !allowWorkingStatus.includes(user?.working_status);

  useEffect(() => {
    if (user?.emp_id) {
      fetchUserRoles();
    }
  }, [user]);

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/user-roles/${user.emp_id}`
      );
      setUserRoles(response.data.roles);
      setSelectedRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRoles((prev) => {
      if (prev.includes(role)) {
        return prev.filter((r) => r !== role);
      } else {
        return [...prev, role];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedUser = {
      ...user,
      name: formData.get("name"),
      phone_number: formData.get("phone_number"),
      eng_name: formData.get("eng_name"),
      kh_name: formData.get("kh_name"),
      job_title: formData.get("job_title"),
      email: formData.get("email"),
    };

    try {
      // First update user details
      await onSubmit(updatedUser);

      // Then update roles
      const response = await axios.post(
        "http://localhost:5001/api/update-user-roles",
        {
          emp_id: user.emp_id,
          currentRoles: userRoles,
          newRoles: selectedRoles,
          userData: {
            emp_id: user.emp_id,
            name: updatedUser.name,
            eng_name: updatedUser.eng_name,
            kh_name: updatedUser.kh_name,
            job_title: updatedUser.job_title,
            dept_name: user.dept_name,
            sect_name: user.sect_name,
            phone_number: updatedUser.phone_number,
            working_status: user.working_status,
            face_photo: user.face_photo,
          },
        }
      );

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Successfully updated user roles",
        });
        setTimeout(() => {
          setMessage({ type: "", text: "" });
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update user roles",
      });
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div
      tabIndex="-1"
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50"
      inert={!isOpen ? '' : null}
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700 overflow-y-auto max-h-[90vh]">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Update User</h3>
            <button
              type="button"
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              onClick={onClose}
            >
              <svg
                className="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          {message.text && (
            <div
              className={`p-4 ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <form
            id="update-user-form"
            className="p-4 md:px-8 md:pb-8 md:pt-5"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            {/* User Photo and Basic Info */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <img
                    src={user.face_photo || "/default-avatar.png"}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
                <div className="flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black">
                        Employee ID
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.emp_id}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">
                        Department
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.dept_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">
                        Section
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.sect_name}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black">
                        Working Status
                      </label>
                      <p className="mt-1 text-sm text-gray-900">
                        {user.working_status}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Fields */}
            <div className="grid gap-4 mb-4 grid-cols-2">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-white">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={user.name}
                  readOnly={!editableFields.name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-white">
                  Phone Number
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={user.phone_number}
                  readOnly={!editableFields.phone_number}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-white">
                  English Name
                </label>
                <input
                  type="text"
                  name="eng_name"
                  defaultValue={user.eng_name}
                  readOnly={!editableFields.eng_name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-white">
                  Khmer Name
                </label>
                <input
                  type="text"
                  name="kh_name"
                  defaultValue={user.kh_name}
                  readOnly={!editableFields.kh_name}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-white">
                  Job Title
                </label>
                <input
                  type="text"
                  name="job_title"
                  defaultValue={user.job_title}
                  readOnly={!editableFields.job_title}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-white">
                  Email (optional)
                </label>
                <input
                  type="email"
                  name="email"
                  defaultValue={user.email}
                  readOnly={!editableFields.email}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Role Management Section */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Roles
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {availableRoles.map((role) => (
                    <div key={role} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`role-${role}`}
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleRoleChange(role)}
                        disabled={disableRoles}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`role-${role}`}
                        className="ml-2 text-sm font-medium text-white"
                      >
                        {role}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

EditUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    _id: PropTypes.string,
    emp_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    eng_name: PropTypes.string,
    kh_name: PropTypes.string,
    email: PropTypes.string,
    job_title: PropTypes.string,
    dept_name: PropTypes.string,
    sect_name: PropTypes.string,
    working_status: PropTypes.string,
    face_photo: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
};

export default EditUserModal;
