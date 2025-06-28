import React from "react";
import { X } from "lucide-react";
import { useIETheme } from "./IEThemeContext";

const IEWorkerFacePhoto = ({ user, onClose }) => {
  const { theme } = useIETheme();

  if (!user) return null;

  const photoUrl = user.face_photo;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {user.eng_name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.emp_id}
          </p>
          <div className="mt-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={`${user.eng_name}'s photo`}
                className="w-64 h-64 object-cover mx-auto rounded-lg"
              />
            ) : (
              <div className="w-64 h-64 bg-gray-200 dark:bg-slate-700 flex items-center justify-center mx-auto rounded-lg">
                <span className="text-gray-500">No Photo</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IEWorkerFacePhoto;
