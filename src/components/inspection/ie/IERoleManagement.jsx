// import React, { useState, useEffect, useCallback } from "react";
// import { useTranslation } from "react-i18next";
// import { API_BASE_URL } from "../../../../config";
// import IEPageTitle from "./IEPageTitle";
// import { useIETheme } from "./IEThemeContext";
// import { Loader2, Users, ShieldCheck, Tag } from "lucide-react";
// import IEWorkerFacePhoto from "./IEWorkerFacePhoto";

// const UserDisplay = ({ user, onPhotoClick }) => {
//   return (
//     <div className="flex flex-col items-center text-center w-20 p-1">
//       <button onClick={() => onPhotoClick(user)} className="relative group">
//         <img
//           src={user.face_photo || "/default-avatar.png"}
//           alt={user.emp_id}
//           className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-slate-600"
//         />
//         <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs text-white bg-black rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
//           {user.eng_name || user.emp_id}
//         </span>
//       </button>
//       <span className="text-xs mt-1 text-gray-700 dark:text-gray-300 font-semibold truncate w-full">
//         {user.emp_id}
//       </span>
//       <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full">
//         {user.job_title}
//       </span>
//     </div>
//   );
// };

// const IERoleManagement = () => {
//   const { t } = useTranslation();
//   useIETheme();
//   const [summaryData, setSummaryData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [selectedUserForPhoto, setSelectedUserForPhoto] = useState(null);

//   const fetchSummary = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const response = await fetch(
//         `${API_BASE_URL}/api/ie/role-management/summary`
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch role summary");
//       }
//       const data = await response.json();
//       setSummaryData(data);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchSummary();
//   }, [fetchSummary]);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-6 bg-red-100 text-red-700 rounded-lg">
//         <p>
//           <strong>{t("common.error")}:</strong> {error}
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <IEPageTitle
//         pageTitle={t(
//           "ie.role_management.title",
//           "IE Process Access Management"
//         )}
//       />

//       <div className="space-y-8">
//         {summaryData.map((section) => (
//           <div
//             key={section.pageName}
//             className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6"
//           >
//             <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
//               <ShieldCheck className="w-6 h-6 mr-3 text-indigo-500" />
//               {section.pageName}
//             </h3>

//             <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md border border-gray-200 dark:border-slate-700">
//               <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
//                 <Tag className="w-4 h-4 mr-2" />
//                 {t("ie.role_management.required_tasks", "Required Task Nos")}:
//               </div>
//               <div className="flex flex-wrap gap-2 mt-2">
//                 {section.requiredTasks.length > 0 ? (
//                   section.requiredTasks
//                     .sort((a, b) => a - b)
//                     .map((task) => (
//                       <span
//                         key={task}
//                         className="px-2.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full font-mono"
//                       >
//                         {task}
//                       </span>
//                     ))
//                 ) : (
//                   <span className="text-xs text-gray-500">
//                     {t(
//                       "ie.role_management.no_tasks",
//                       "No tasks defined for this process."
//                     )}
//                   </span>
//                 )}
//               </div>
//             </div>

//             <div>
//               <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
//                 <Users className="w-4 h-4 mr-2" />
//                 {t(
//                   "ie.role_management.users_with_access",
//                   "Users with Access"
//                 )}{" "}
//                 ({section.users.length})
//               </div>
//               <div className="p-3 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg min-h-[80px]">
//                 {section.users.length > 0 ? (
//                   <div className="flex flex-wrap gap-2">
//                     {section.users.map((user) => (
//                       <UserDisplay
//                         key={user.emp_id}
//                         user={user}
//                         onPhotoClick={setSelectedUserForPhoto}
//                       />
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="flex justify-center items-center h-full">
//                     <p className="text-sm text-gray-500">
//                       {t(
//                         "ie.role_management.no_users",
//                         "No users have the required tasks assigned."
//                       )}
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {selectedUserForPhoto && (
//         <IEWorkerFacePhoto
//           user={selectedUserForPhoto}
//           onClose={() => setSelectedUserForPhoto(null)}
//         />
//       )}
//     </div>
//   );
// };

// export default IERoleManagement;

import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../config";
import IEPageTitle from "./IEPageTitle";
import { useIETheme } from "./IEThemeContext";
import { Loader2, Users, ShieldCheck, Tag } from "lucide-react";
import IEWorkerFacePhoto from "./IEWorkerFacePhoto";

// It now accepts a `matchingTasks` prop to display the relevant tasks.
const UserDisplay = ({ user, onPhotoClick, matchingTasks }) => {
  return (
    <div className="flex flex-col items-center text-center w-20 p-1">
      <button onClick={() => onPhotoClick(user)} className="relative group">
        <img
          src={user.face_photo || "/default-avatar.png"}
          alt={user.emp_id}
          className="h-12 w-12 rounded-full object-cover border-2 border-white dark:border-slate-600"
        />
        <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-max px-2 py-1 text-xs text-white bg-black rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
          {user.eng_name || user.emp_id}
        </span>
      </button>
      <span className="text-xs mt-1 text-gray-700 dark:text-gray-300 font-semibold truncate w-full">
        {user.emp_id}
      </span>
      {/* --- THE FIX ---
          This now displays only the tasks that grant access to this specific section. */}
      <div className="mt-1 space-y-0.5">
        {(matchingTasks || []).map((task) => (
          <div
            key={task}
            className="text-xs text-green-600 dark:text-green-400 font-semibold"
          >
            {task}
          </div>
        ))}
      </div>
    </div>
  );
};

const IERoleManagement = () => {
  const { t } = useTranslation();
  useIETheme();
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUserForPhoto, setSelectedUserForPhoto] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/ie/role-management/summary`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch role summary");
      }
      const data = await response.json();
      setSummaryData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-lg">
        <p>
          <strong>{t("common.error")}:</strong> {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <IEPageTitle
        pageTitle={t(
          "ie.role_management.title",
          "IE Process Access Management"
        )}
      />

      <div className="space-y-8">
        {summaryData.map((section) => {
          // --- THE FIX ---
          // Create a Set for fast lookups of required tasks.
          const requiredTasksSet = new Set(section.requiredTasks);

          return (
            <div
              key={section.pageName}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                <ShieldCheck className="w-6 h-6 mr-3 text-indigo-500" />
                {section.pageName}
              </h3>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-md border border-gray-200 dark:border-slate-700">
                <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  <Tag className="w-4 h-4 mr-2" />
                  {t("ie.role_management.required_tasks", "Required Task Nos")}:
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {section.requiredTasks.length > 0 ? (
                    section.requiredTasks
                      .sort((a, b) => a - b)
                      .map((task) => (
                        <span
                          key={task}
                          className="px-2.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 rounded-full font-mono"
                        >
                          {task}
                        </span>
                      ))
                  ) : (
                    <span className="text-xs text-gray-500">
                      {t(
                        "ie.role_management.no_tasks",
                        "No tasks defined for this process."
                      )}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <Users className="w-4 h-4 mr-2" />
                  {t(
                    "ie.role_management.users_with_access",
                    "Users with Access"
                  )}{" "}
                  ({section.users.length})
                </div>
                <div className="p-3 border border-dashed border-gray-300 dark:border-slate-600 rounded-lg min-h-[80px]">
                  {section.users.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {section.users.map((user) => {
                        // --- THE FIX ---
                        // For each user, find which of their tasks match the required ones.
                        const matchingTasks = user.tasks.filter((task) =>
                          requiredTasksSet.has(task)
                        );

                        return (
                          <UserDisplay
                            key={user.emp_id}
                            user={user}
                            onPhotoClick={setSelectedUserForPhoto}
                            matchingTasks={matchingTasks} // Pass the matching tasks as a prop
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-sm text-gray-500">
                        {t(
                          "ie.role_management.no_users",
                          "No users have the required tasks assigned."
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedUserForPhoto && (
        <IEWorkerFacePhoto
          user={selectedUserForPhoto}
          onClose={() => setSelectedUserForPhoto(null)}
        />
      )}
    </div>
  );
};

export default IERoleManagement;
