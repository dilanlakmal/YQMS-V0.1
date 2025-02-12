import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { useAuth } from '../../components/authentication/AuthContext.jsx';

const MySwal = withReactContent(Swal);

const CreateUserModal = ({
  isOpen,
  onClose,
  roles,
  onSubmit,
  existingUserIds = [], // Use default parameter
}) => {
  const { hashPassword } = useAuth();
  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    email: '',
    roles: [],
    sub_roles: [],
    keywords: '',
    password: '',
  });

  useEffect(() => {
    // You can add any side effects related to existingUserIds here if needed
  }, [existingUserIds]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleRoleChange = (roleValue) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      roles: prevFormData.roles.includes(roleValue)
        ? prevFormData.roles.filter((role) => role !== roleValue)
        : [...prevFormData.roles, roleValue],
    }));
  };

  const handleSubRoleChange = (subRoleValue, mainRoleValue) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      sub_roles: prevFormData.sub_roles.includes(subRoleValue)
        ? prevFormData.sub_roles.filter((subRole) => subRole !== subRoleValue)
        : [...prevFormData.sub_roles, subRoleValue],
    }));

    // Automatically check/uncheck the main role based on sub-roles
    const mainRoleSubRoles = roles.find((role) => role.value === mainRoleValue).sub_roles;
    const allSubRolesSelected = mainRoleSubRoles.every((subRole) =>
      formData.sub_roles.includes(subRole.value)
    );

    if (allSubRolesSelected) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        roles: prevFormData.roles.includes(mainRoleValue)
          ? prevFormData.roles
          : [...prevFormData.roles, mainRoleValue],
      }));
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        roles: prevFormData.roles.filter((role) => role !== mainRoleValue),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Array.isArray(existingUserIds) && existingUserIds.includes(formData.emp_id)) {
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Employee ID already exists. Please use a different ID.',
      }).then(() => {
        // Clear the form data
        setFormData({
          emp_id: '',
          name: '',
          email: '',
          roles: [],
          sub_roles: [],
          keywords: '',
          password: '',
        });
        // Close the modal
        onClose();
      });
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.password);
      const updatedFormData = { ...formData, password: hashedPassword };

      const response = await onSubmit(updatedFormData);

      if (response.status === 400) {
        throw new Error(response.data.message);
      }

      MySwal.fire({
        icon: 'success',
        title: 'Success',
        text: 'User created successfully!',
      }).then(() => {
        // Clear the form data
        setFormData({
          emp_id: '',
          name: '',
          email: '',
          roles: [],
          sub_roles: [],
          keywords: '',
          password: '',
        });
        // Close the modal
        onClose();
      });
    } catch (err) {
      console.error('Error creating user:', err);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || 'Failed to create user. Please try again later.',
      }).then(() => {
        // Clear the form data
        setFormData({
          emp_id: '',
          name: '',
          email: '',
          roles: [],
          sub_roles: [],
          keywords: '',
          password: '',
        });
        // Close the modal
        onClose();
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative p-4 w-full max-w-2xl max-h-full bg-white rounded-lg shadow dark:bg-gray-700 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add User
          </h3>
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
          id="create-form"
          className="p-4 md:px-8 md:pb-8 md:pt-5 text-center"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <div className="grid gap-4 mb-4 grid-cols-2">
            <div className="col-span-2">
              <label htmlFor="emp_id" className="mb-2 text-left block text-sm font-medium text-gray-700 dark:text-gray-300">
                Employee ID
              </label>
              <input
                type="text"
                name="emp_id"
                id="emp_id"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="Enter employee ID"
                required
                value={formData.emp_id}
                onChange={handleChange}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="name" className="mb-2 text-left block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="Enter username"
                required
                value={formData.name}
                onChange={handleChange}
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
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
                        id={role.value}
                        type="checkbox"
                        value={role.value}
                        name="roles[]"
                        checked={formData.roles.includes(role.value)}
                        onChange={() => handleRoleChange(role.value)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                      />
                      <label
                        htmlFor={role.value}
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
                                id={subRole.value}
                                type="checkbox"
                                value={subRole.value}
                                name="sub_roles[]"
                                checked={formData.sub_roles.includes(subRole.value)}
                                onChange={() => handleSubRoleChange(subRole.value, role.value)}
                                className="w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                              />
                              <label
                                htmlFor={subRole.value}
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
                                        id={type.value}
                                        type="checkbox"
                                        value={type.value}
                                        name="types[]"
                                        checked={formData.sub_roles.includes(type.value)}
                                        onChange={() => handleSubRoleChange(type.value, role.value)}
                                        className="w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
                                      />
                                      <label
                                        htmlFor={type.value}
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
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="Enter keywords"
                value={formData.keywords}
                onChange={handleChange}
              />
            </div>
            <div className="col-span-2">
              <label htmlFor="password" className="mb-2 text-left block text-sm font-medium text-gray-700 dark:text-gray-300">
                Default Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="Enter default password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
          </div>
          <button
            type="submit"
            className="mt-0 sm:mt-2 text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            <svg className="me-1 -ms-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd"></path>
            </svg>
            Add User
          </button>
        </form>
      </div>
    </div>
  );
};

CreateUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
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
  existingUserIds: PropTypes.arrayOf(PropTypes.string),
};

export default CreateUserModal;
