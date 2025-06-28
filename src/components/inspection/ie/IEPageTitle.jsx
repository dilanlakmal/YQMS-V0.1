// import React from "react";
// import { useAuth } from "../../authentication/AuthContext";
// import { User } from "lucide-react";
// import { useIETheme } from "./IEThemeContext"; // Import theme context if you want it to adapt

// const IEPageTitle = ({ pageTitle, activeSection }) => {
//   const { user } = useAuth();
//   const { theme } = useIETheme(); // Use the theme

//   return (
//     <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md mb-6 p-4 transition-colors duration-300">
//       <div className="flex items-center justify-between">
//         <div className="flex items-center space-x-4 flex-grow">
//           <img
//             src="/assets/Home/yorkmars.jpg"
//             alt="Yorkmars Logo"
//             className="h-16 w-auto self-start"
//           />
//           <div className="flex-grow">
//             <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
//               <span>Yorkmars (Cambodia) Garment MFG Co., LTD | </span>
//               <span>យូកម៉ាស (ខេមបូឌា) ហ្គាមេន អឹមអេហ្វជី ខូអិលធីឌី |</span>
//               <span> 溢泰 (柬埔寨) 製衣廠有限公司</span>
//             </h1>
//             <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//               #0287, PLOV LUM, PHUM TRAPRAING CHHREY, SANGKAT KAKAB, KHAN
//               PORSENCHHEY | Tel: (855) 23 866 416/417, Fax:(855) 866 418.
//             </p>
//           </div>
//         </div>

//         <div className="flex flex-shrink-0 flex-col items-center justify-center border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 p-2 w-40">
//           {user?.face_photo ? (
//             <img
//               src={user.face_photo}
//               alt={user.eng_name}
//               className="h-8 w-8 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-600"
//             />
//           ) : (
//             <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-md">
//               <User className="h-5 w-5 text-gray-500" />
//             </div>
//           )}
//           <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2 text-center">
//             {user?.emp_id}
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center break-words">
//             {user?.job_title || "N/A"}
//           </p>
//         </div>
//       </div>
//       {pageTitle && (
//         <div className="border-t border-gray-200 dark:border-slate-700 mt-3 pt-3">
//           <h2 className="text-center text-xl font-semibold text-indigo-700 dark:text-indigo-400">
//             {pageTitle}
//           </h2>
//         </div>
//       )}
//     </div>
//   );
// };

// export default IEPageTitle;

import React from "react";
import { useAuth } from "../../authentication/AuthContext";
import { User } from "lucide-react";
import { useIETheme } from "./IEThemeContext";

const IEPageTitle = ({ pageTitle }) => {
  const { user } = useAuth();
  // theme from useIETheme is not strictly needed here unless you add more theme-specific logic

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md mb-6 p-4 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-grow">
          <img
            src="/assets/Home/yorkmars.jpg"
            alt="Yorkmars Logo"
            className="h-16 w-auto self-start"
          />
          <div className="flex-grow">
            <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 tracking-tight">
              {/* Company Names */}
              <span>Yorkmars (Cambodia) Garment MFG Co., LTD | </span>
              <span>យូកម៉ាស (ខេមបូឌា) ហ្គាមេន អឹមអេហ្វជី ខូអិលធីឌី |</span>
              <span> 溢泰 (柬埔寨) 製衣廠有限公司</span>

              {/* --- THE FIX: Conditionally render the pageTitle here --- */}
              {pageTitle && (
                <>
                  <span className="font-light text-gray-400 dark:text-gray-500 mx-2">
                    |
                  </span>
                  <span className="text-gray-700 dark:text-gray-400">
                    ID: {user?.emp_id}
                  </span>
                  <span className="font-light text-gray-400 dark:text-gray-500 mx-2">
                    |
                  </span>
                  <span className="text-indigo-700 dark:text-indigo-400">
                    {pageTitle}
                  </span>
                </>
              )}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              #0287, PLOV LUM, PHUM TRAPRAING CHHREY, SANGKAT KAKAB, KHAN
              PORSENCHHEY | Tel: (855) 23 866 416/417, Fax:(855) 866 418.
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col items-center justify-center border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 p-2 w-40">
          <img
            src="/assets/Home/ie.png"
            alt="IE"
            className="h-8 w-8 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-600"
          />

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center break-words">
            {user?.name || "N/A"}
          </p>
        </div>

        <div className="flex flex-shrink-0 flex-col items-center justify-center border-l border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 p-2 w-40">
          {user?.face_photo ? (
            <img
              src={user.face_photo}
              alt={user.eng_name}
              className="h-8 w-8 rounded-full object-cover shadow-md border-2 border-white dark:border-slate-600"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white dark:border-slate-600 shadow-md">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center break-words">
            {user?.job_title || "N/A"}
          </p>
        </div>
      </div>

      {/* The separate page title section at the bottom has been removed */}
    </div>
  );
};

export default IEPageTitle;
