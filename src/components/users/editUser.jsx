import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import bcrypt from 'bcryptjs';

const EditUserModal = ({ isOpen, onClose, user, roles, onSubmit }) => {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedSubRoles, setSelectedSubRoles] = useState([]);
  const [resetPassword, setResetPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const existingRoles = user.roles.filter(role => roles.some(r => r.value === role));
      const existingSubRoles = user.sub_roles.filter(subRole => 
        roles.some(role => 
          role.sub_roles && role.sub_roles.some(sr => sr.value === subRole)
        )
      );

      setSelectedRoles(existingRoles);
      setSelectedSubRoles(existingSubRoles);
    }
  }, [user, roles]);

  const handleRoleChange = (roleValue) => {
    setSelectedRoles((prevSelectedRoles) =>
      prevSelectedRoles.includes(roleValue)
        ? prevSelectedRoles.filter((role) => role !== roleValue)
        : [...prevSelectedRoles, roleValue]
    );
  };

  const handleSubRoleChange = (subRoleValue, mainRoleValue) => {
    setSelectedSubRoles((prevSelectedSubRoles) =>
      prevSelectedSubRoles.includes(subRoleValue)
        ? prevSelectedSubRoles.filter((subRole) => subRole !== subRoleValue)
        : [...prevSelectedSubRoles, subRoleValue]
    );

    // Automatically check/uncheck the main role based on sub-roles
    const mainRoleSubRoles = roles.find((role) => role.value === mainRoleValue).sub_roles;
    const allSubRolesSelected = mainRoleSubRoles.every((subRole) =>
      selectedSubRoles.includes(subRole.value)
    );

    if (allSubRolesSelected) {
      setSelectedRoles((prevSelectedRoles) =>
        prevSelectedRoles.includes(mainRoleValue)
          ? prevSelectedRoles
          : [...prevSelectedRoles, mainRoleValue]
      );
    } else {
      setSelectedRoles((prevSelectedRoles) =>
        prevSelectedRoles.filter((role) => role !== mainRoleValue)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedUser = {
      ...user,
      name: formData.get('name'),
      email: formData.get('email'),
      roles: [...new Set(selectedRoles)],
      sub_roles: [...new Set(selectedSubRoles.concat(formData.getAll('types[]')))],
      keywords: formData.get('keywords').split(',').map((keyword) => keyword.trim()),
    };

    if (resetPassword) {
      const password = formData.get('password');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updatedUser.password = hashedPassword;
    }
    onSubmit(updatedUser);
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
          <form
            id="update-user-form"
            className="p-4 md:px-8 md:pb-8 md:pt-5 text-center"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div className="grid gap-4 mb-4 grid-cols-1 sm:grid-cols-2">
              <div className="col-span-2">
                <label htmlFor="name" className="mb-2 text-left block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  defaultValue={user.name}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="email" className="mb-2 text-left block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email (optional)
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  defaultValue={user.email}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Enter email"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="role" className="mb-2 text-left block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role
                </label>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-0 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500">
                  {roles.map((role) => (
                    <li key={role.value} className="mb-2">
                      <div className="flex items-center text-left p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                        <input
                          id={`edit_${role.value}`}
                          type="checkbox"
                          value={role.value}
                          name="roles[]"
                          checked={selectedRoles.includes(role.value)}
                          onChange={() => handleRoleChange(role.value)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                        />
                        <label
                          htmlFor={`edit_${role.value}`}
                          className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                        >
                          {role.name}
                        </label>
                      </div>
                      {role.sub_roles && role.sub_roles.length > 0 && (
                        <ul className="ms-4">
                          {role.sub_roles.map((subRole) => (
                            <li key={subRole.value}>
                              <div className="flex items-center text-left p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                <input
                                  id={`edit_${subRole.value}`}
                                  type="checkbox"
                                  value={subRole.value}
                                  name="sub_roles[]"
                                  checked={selectedSubRoles.includes(subRole.value)}
                                  onChange={() => handleSubRoleChange(subRole.value, role.value)}
                                  className="w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                />
                                <label
                                  htmlFor={`edit_${subRole.value}`}
                                  className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                >
                                  {subRole.name.replace('_', ' ')}
                                </label>
                              </div>
                              {subRole.types && subRole.types.length > 0 && (
                                <ul className="ms-4">
                                  {subRole.types.map((type) => (
                                    <li key={type.value}>
                                      <div className="flex items-center text-left p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                                        <input
                                          id={`edit_${type.value}`}
                                          type="checkbox"
                                          value={type.value}
                                          name="types[]"
                                          checked={selectedSubRoles.includes(type.value)}
                                          onChange={() => handleSubRoleChange(type.value, role.value)}
                                          className="w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                        />
                                        <label
                                          htmlFor={`edit_${type.value}`}
                                          className="w-full ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300"
                                        >
                                          {type.name.replace('_', ' ')}
                                        </label>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2">
                <label htmlFor="keywords" className="mb-2 text-left block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Role Keyword
                </label>
                <input
                  type="text"
                  name="keywords"
                  id="keywords"
                  defaultValue={user.keywords ? user.keywords.join(', ') : ''}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="Enter keywords"
                />
              </div>
              <div className="col-span-2">
                <label className="inline-flex w-full mb-2 items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="reset_password"
                    className="sr-only peer"
                    checked={resetPassword}
                    onChange={() => setResetPassword(!resetPassword)}
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">Reset Password</span>
                </label>
                {resetPassword && (
                  <input
                    type="password"
                    name="password"
                    id="password"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                    placeholder="Enter new password"
                  />
                )}
              </div>
            </div>
            <button
              type="submit"
              className="mt-0 sm:mt-2 text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              <svg
                className="me-1 -ms-1 size-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41m-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9" />
                <path
                  fillRule="evenodd"
                  d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5 5 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z"
                />
              </svg>
              Edit
            </button>
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
    name: PropTypes.string.isRequired,
    email: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string).isRequired,
    sub_roles: PropTypes.arrayOf(PropTypes.string),
    keywords: PropTypes.arrayOf(PropTypes.string),
  }),
  roles: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      sub_roles: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
          types: PropTypes.arrayOf(
            PropTypes.shape({
              value: PropTypes.string.isRequired,
              name: PropTypes.string.isRequired,
            })
          ),
        })
      ),
    })
  ).isRequired,
  onSubmit: PropTypes.func.isRequired,
};

export default EditUserModal;
