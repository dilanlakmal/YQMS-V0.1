import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [search, users]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again later.');
    }
  };

  const filterUsers = () => {
    const filtered = users.filter(user =>
      (user.name && user.name.toLowerCase().includes(search.toLowerCase())) ||
      (user.eng_name && user.eng_name.toLowerCase().includes(search.toLowerCase())) ||
      (user.kh_name && user.kh_name.toLowerCase().includes(search.toLowerCase())) ||
      (user.dept_name && user.dept_name.toLowerCase().includes(search.toLowerCase())) ||
      (user.sect_name && user.sect_name.toLowerCase().includes(search.toLowerCase()))
    );
    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to the first page on search
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5001/users/${id}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user. Please try again later.');
    }
  };

  const handleAddUser = () => {
    // Redirect to add user page or open a modal
  };

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPageNumbersToShow = 10;
    const halfPageNumbersToShow = Math.floor(maxPageNumbersToShow / 2);

    let startPage = Math.max(1, currentPage - halfPageNumbersToShow);
    let endPage = Math.min(totalPages, currentPage + halfPageNumbersToShow);

    if (currentPage <= halfPageNumbersToShow) {
      endPage = Math.min(totalPages, maxPageNumbersToShow);
    }

    if (currentPage + halfPageNumbersToShow >= totalPages) {
      startPage = Math.max(1, totalPages - maxPageNumbersToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <form onSubmit={(e) => e.preventDefault()} className="flex w-full">
        <div className="relative w-2/4">
            <input
              type="text"
              placeholder="Search here..."
              value={search}
              onChange={handleSearch}
              className="w-full p-2 pl-10 border border-gray-300 rounded-lg"
            />
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 20"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                />
              </svg>
            </div>
          </div>
          {/* <button
            type="submit"
            className="p-2 w-24 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ml-2"
          >
            Search
          </button> */}
        </form>
        <button
          onClick={handleAddUser}
          className="ml-4 p-2 w-40 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          + Add User
        </button>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Name</th>
              <th className="px-4 py-2 border-b">Full Name</th>
              <th className="px-4 py-2 border-b">Department</th>
              <th className="px-4 py-2 border-b">Created At</th>
              <th className="px-4 py-2 border-b">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user._id} className="hover:bg-gray-100">
                <td className="px-4 py-2 border-b">{user.name} <br /> {user.emp_id}</td>
                <td className="px-4 py-2 border-b">{user.eng_name}<br /> {user.kh_name}</td>
                <td className="px-4 py-2 border-b">{user.dept_name} <br /> {user.sect_name}</td>
                <td className="px-4 py-2 border-b">{new Date(user.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2 border-b">
                  <button
                    onClick={() => handleEdit(user)}
                    className="px-4 py-2 mr-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} results
        </div>
        <nav>
          <ul className="flex list-none">
            <li className="mx-1">
              <button
                onClick={prevPage}
                className={`px-3 py-1 rounded-lg ${currentPage === 1 ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            {getPageNumbers().map(pageNumber => (
              <li key={pageNumber} className="mx-1">
                <button
                  onClick={() => paginate(pageNumber)}
                  className={`px-3 py-1 rounded-lg ${currentPage === pageNumber ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  {pageNumber}
                </button>
              </li>
            ))}
            {totalPages > 10 && currentPage + 5 < totalPages && (
              <li className="mx-1">
                <span className="px-3 py-1">...</span>
              </li>
            )}
            {totalPages > 10 && currentPage + 5 < totalPages && (
              <li className="mx-1">
                <button
                  onClick={() => paginate(totalPages)}
                  className={`px-3 py-1 rounded-lg ${currentPage === totalPages ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                >
                  {totalPages}
                </button>
              </li>
            )}
            <li className="mx-1">
              <button
                onClick={nextPage}
                className={`px-3 py-1 rounded-lg ${currentPage === totalPages ? 'bg-gray-200' : 'bg-blue-500 text-white'}`}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default UserList;
