// src/components/inspection/yqms/YQMSData.jsx
import React, { useState } from "react";
import { ChevronDown, ChevronUp, PlusCircle, User, X } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EmployeeSearch from "./EmployeeSearch";

const YQMSData = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [aim, setAim] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [completionDate, setCompletionDate] = useState(new Date());

  // State for team members
  const [projectLeaders, setProjectLeaders] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [subDevelopers, setSubDevelopers] = useState([]);
  const [supportPeople, setSupportPeople] = useState([]);

  const MAX_AIM_CHARS = 500;

  const addEmployee = (setter, employee) => {
    setter((prev) => [
      ...prev.filter((p) => p.emp_id !== employee.emp_id),
      employee
    ]);
  };

  const removeEmployee = (setter, empId) => {
    setter((prev) => prev.filter((p) => p.emp_id !== empId));
  };

  const EmployeeCard = ({ employee, onRemove }) => (
    <div className="flex items-center bg-gray-100 p-2 rounded-lg shadow-sm relative">
      <img
        src={
          employee.face_photo || `https://i.pravatar.cc/40?u=${employee.emp_id}`
        }
        alt={employee.eng_name}
        className="w-10 h-10 rounded-full object-cover mr-3"
      />
      <div>
        <p className="font-semibold text-sm text-gray-800">
          {employee.eng_name}
        </p>
        <p className="text-xs text-gray-500">
          {employee.emp_id} - {employee.job_title}
        </p>
      </div>
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 text-gray-400 hover:text-red-500"
      >
        <X size={16} />
      </button>
    </div>
  );

  const TeamRow = ({ title, children }) => (
    <tr className="border-b border-gray-200">
      <td className="py-4 px-6 text-sm font-semibold text-gray-700 align-top w-1/4">
        {title}
      </td>
      <td className="py-4 px-6 align-top">{children}</td>
    </tr>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setShowAddForm(!showAddForm)}
      >
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <PlusCircle className="w-6 h-6 mr-3 text-blue-600" />
          Add a Project
        </h2>
        {showAddForm ? <ChevronUp /> : <ChevronDown />}
      </div>

      {showAddForm && (
        <div className="mt-6 border-t pt-6 transition-all duration-500">
          <div className="space-y-6">
            {/* Project Name, Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
                  placeholder="e.g., YQMS V2.0 Development"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <DatePicker
                  selected={startDate}
                  onChange={(date) => setStartDate(date)}
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Planning Completion Date
                </label>
                <DatePicker
                  selected={completionDate}
                  onChange={(date) => setCompletionDate(date)}
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
                />
              </div>
            </div>

            {/* Aim Textbox */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aim
              </label>
              <textarea
                value={aim}
                onChange={(e) => setAim(e.target.value)}
                maxLength={MAX_AIM_CHARS}
                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
                rows="4"
                placeholder="Describe the main goal and purpose of this project..."
              ></textarea>
              <p className="text-right text-xs text-gray-500 mt-1">
                {aim.length} / {MAX_AIM_CHARS}
              </p>
            </div>

            {/* Project Team Table */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center">
                <User className="w-5 h-5 mr-2" /> Project Team
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full">
                  <tbody className="divide-y divide-gray-200">
                    <TeamRow title="YW Management">
                      <p className="text-sm text-gray-600 italic">
                        HK Shareholders, CEO, GM ...
                      </p>
                    </TeamRow>

                    <TeamRow title="Project Leaders">
                      <div className="space-y-3">
                        <EmployeeSearch
                          onSelectEmployee={(emp) =>
                            addEmployee(setProjectLeaders, emp)
                          }
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {projectLeaders.map((emp) => (
                            <EmployeeCard
                              key={emp.emp_id}
                              employee={emp}
                              onRemove={() =>
                                removeEmployee(setProjectLeaders, emp.emp_id)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </TeamRow>

                    <TeamRow title="Developers">
                      <div className="space-y-3">
                        <EmployeeSearch
                          onSelectEmployee={(emp) =>
                            addEmployee(setDevelopers, emp)
                          }
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {developers.map((emp) => (
                            <EmployeeCard
                              key={emp.emp_id}
                              employee={emp}
                              onRemove={() =>
                                removeEmployee(setDevelopers, emp.emp_id)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </TeamRow>

                    <TeamRow title="Sub Developers">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <EmployeeSearch
                            onSelectEmployee={(emp) =>
                              addEmployee(setSubDevelopers, emp)
                            }
                          />
                          <button
                            onClick={() =>
                              addEmployee(setSubDevelopers, {
                                emp_id: "N/A",
                                eng_name: "N/A",
                                job_title: "Not Applicable",
                                face_photo: null
                              })
                            }
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
                          >
                            N/A
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {subDevelopers.map((emp) => (
                            <EmployeeCard
                              key={emp.emp_id}
                              employee={emp}
                              onRemove={() =>
                                removeEmployee(setSubDevelopers, emp.emp_id)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </TeamRow>

                    <TeamRow title="Support People">
                      <div className="space-y-3">
                        <EmployeeSearch
                          onSelectEmployee={(emp) =>
                            addEmployee(setSupportPeople, emp)
                          }
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {supportPeople.map((emp) => (
                            <EmployeeCard
                              key={emp.emp_id}
                              employee={emp}
                              onRemove={() =>
                                removeEmployee(setSupportPeople, emp.emp_id)
                              }
                            />
                          ))}
                        </div>
                      </div>
                    </TeamRow>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YQMSData;
