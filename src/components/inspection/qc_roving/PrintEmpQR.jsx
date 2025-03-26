import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { QrCode, ChevronLeft, ChevronRight } from "lucide-react";
import QRCode from "react-qr-code"; // Use react-qr-code instead
import Swal from "sweetalert2";

const PrintEmpQR = () => {
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [limit] = useState(10); // Number of users per page
  const [selectedEmpId, setSelectedEmpId] = useState(null);

  // Fetch paginated users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users-paginated`,
          {
            params: { page: currentPage, limit }
          }
        );
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
        setTotalUsers(response.data.total);
      } catch (error) {
        console.error("Error fetching users:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch users."
        });
      }
    };

    fetchUsers();
  }, [currentPage, limit]);

  // Handle QR code preview
  const handleShowQR = (empId) => {
    setSelectedEmpId(empId);
  };

  // Close QR code preview
  const handleCloseQR = () => {
    setSelectedEmpId(null);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Employee QR Code List
        </h1>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Emp ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Eng Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Kh Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Dept Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  Sect Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider">
                  QR Code
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.emp_id}>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.emp_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.eng_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.kh_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.dept_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {user.sect_name || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <button
                        onClick={() => handleShowQR(user.emp_id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <QrCode className="w-6 h-6" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-3 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * limit + 1} to{" "}
            {Math.min(currentPage * limit, totalUsers)} of {totalUsers} users
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* QR Code Preview Modal */}
        {selectedEmpId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 className="text-xl font-semibold mb-4">QR Code Preview</h2>
              <div className="flex flex-col items-center">
                <QRCode value={selectedEmpId} height={150} width={150} />
                <p className="mt-2 text-sm text-gray-600">
                  Emp ID: {selectedEmpId}
                </p>
              </div>
              <button
                onClick={handleCloseQR}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintEmpQR;
