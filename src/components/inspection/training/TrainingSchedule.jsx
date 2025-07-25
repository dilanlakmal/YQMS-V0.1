import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const TrainingSchedule = ({ formData, setFormData }) => {
  const { t } = useTranslation();
  const [trainingHours, setTrainingHours] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      evaluation: { ...prev.evaluation, [name]: checked }
    }));
  };

  // Calculate training duration when start or end time changes
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      // Using a dummy date to parse time correctly
      const startDate = new Date(`1970-01-01T${formData.startTime}:00`);
      const endDate = new Date(`1970-01-01T${formData.endTime}:00`);

      if (endDate > startDate) {
        const diffMs = endDate - startDate;
        const totalMinutes = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        setTrainingHours(`${hours} Hr ${minutes} Min (${totalMinutes} min)`);
      } else {
        setTrainingHours("End time must be after start time");
      }
    } else {
      setTrainingHours("");
    }
  }, [formData.startTime, formData.endTime]);

  const inputClass =
    "mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        Create or Edit Training
      </h2>
      <form className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Column 1 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Training No
            </label>
            <input
              type="text"
              value="23"
              disabled
              className={`${inputClass} bg-gray-100 dark:bg-gray-600`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Training Topic
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trainers
            </label>
            <input
              type="text"
              name="trainers"
              value={formData.trainers}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Training Support
            </label>
            <input
              type="text"
              name="support"
              value={formData.support}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Trainee
            </label>
            <input
              type="text"
              name="trainee"
              value={formData.trainee}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Column 2 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Method of Training
            </label>
            <input
              type="text"
              name="method"
              value={formData.method}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Evaluation Method
            </label>
            <div className="mt-2 flex items-center space-x-4 p-2 border border-gray-300 dark:border-gray-600 rounded-md">
              {["Exam", "Physical", "Viva"].map((method) => (
                <label key={method} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    name={method.toLowerCase()}
                    checked={!!formData.evaluation[method.toLowerCase()]}
                    onChange={handleCheckboxChange}
                    className="rounded border-gray-300 dark:border-gray-500 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                    {method}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Plan Date
            </label>
            <input
              type="date"
              name="planDate"
              value={formData.planDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Expected End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Column 3 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Training Start Time
            </label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Training End Time
            </label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              No. of Training Hours
            </label>
            <input
              type="text"
              value={trainingHours}
              disabled
              className={`${inputClass} bg-gray-100 dark:bg-gray-600`}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default TrainingSchedule;
