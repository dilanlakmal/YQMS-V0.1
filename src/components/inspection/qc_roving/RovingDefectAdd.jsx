// // src/components/inspection/qc_roving/RovingDefectAdd.jsx
// import React, { useState, useEffect, useCallback } from "react";
// import axios from "axios";
// import { API_BASE_URL } from "../../../../config";
// import { useTranslation } from "react-i18next";
// import Swal from "sweetalert2";
// import { Loader2, PlusCircle, X } from "lucide-react";

// const RovingDefectAdd = ({ onDefectAdded }) => {
//   const { t } = useTranslation();

//   const getInitialState = () => ({
//     code: "",
//     shortEng: "",
//     english: "",
//     khmer: "",
//     chinese: "",
//     image: "", // Saved as empty string per requirement
//     repair: "",
//     categoryEnglish: "",
//     categoryKhmer: "",
//     categoryChinese: "",
//     type: "",
//     isCommon: "Yes"
//   });

//   const [newDefect, setNewDefect] = useState(getInitialState());
//   const [dropdownOptions, setDropdownOptions] = useState({
//     repairs: [],
//     categoriesEnglish: [],
//     categoriesKhmer: [],
//     categoriesChinese: [],
//     types: []
//   });
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState(null);
//   const [showForm, setShowForm] = useState(false);

//   const fetchOptions = useCallback(async () => {
//     try {
//       const response = await axios.get(
//         `${API_BASE_URL}/api/sewing-defects/options`
//       );
//       const data = response.data;
//       setDropdownOptions({
//         repairs: data.repairs || [],
//         categoriesEnglish: data.categoriesEnglish || [],
//         categoriesKhmer: data.categoriesKhmer || [],
//         categoriesChinese: data.categoriesChinese || [],
//         types: data.types || []
//       });
//       setNewDefect((prev) => ({ ...prev, code: data.nextCode }));
//     } catch (err) {
//       console.error("Error fetching dropdown options:", err);
//       setError(
//         t("rovingDefectAdd.errors.fetchOptions", "Failed to load form options.")
//       );
//     }
//   }, [t]);

//   useEffect(() => {
//     if (showForm) {
//       fetchOptions();
//     }
//   }, [showForm, fetchOptions]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setNewDefect((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSaving(true);
//     setError(null);

//     // Basic Validation
//     if (!newDefect.shortEng || !newDefect.english || !newDefect.khmer) {
//       setError(
//         t(
//           "rovingDefectAdd.errors.requiredFields",
//           "Short English, English, and Khmer names are required."
//         )
//       );
//       setIsSaving(false);
//       return;
//     }

//     try {
//       await axios.post(`${API_BASE_URL}/api/sewing-defects`, newDefect);
//       Swal.fire({
//         icon: "success",
//         title: t("rovingDefectAdd.success.title", "Success"),
//         text: t(
//           "rovingDefectAdd.success.message",
//           "New defect added successfully!"
//         )
//       });
//       setShowForm(false); // Hide form on success
//       setNewDefect(getInitialState()); // Reset form
//       if (onDefectAdded) {
//         onDefectAdded(); // Notify parent to refresh data
//       }
//     } catch (err) {
//       console.error("Error adding new defect:", err);
//       const errorMessage =
//         err.response?.data?.message ||
//         t("rovingDefectAdd.errors.saveFailed", "Failed to add new defect.");
//       setError(errorMessage);
//       Swal.fire({
//         icon: "error",
//         title: t("rovingDefectAdd.errors.saveFailedTitle", "Save Failed"),
//         text: errorMessage
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
//       <div
//         className="flex justify-between items-center cursor-pointer"
//         onClick={() => setShowForm(!showForm)}
//       >
//         <h2 className="text-lg font-semibold text-gray-700">
//           {t("rovingDefectAdd.title", "Add New Roving Defect")}
//         </h2>
//         {showForm ? (
//           <X className="text-gray-600" />
//         ) : (
//           <PlusCircle className="text-blue-600" />
//         )}
//       </div>

//       {showForm && (
//         <form onSubmit={handleSubmit} className="mt-4 space-y-4">
//           {error && (
//             <div className="p-3 bg-red-100 text-red-700 rounded-md">
//               {error}
//             </div>
//           )}
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {/* Defect Code */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.code", "Defect Code")}
//               </label>
//               <input
//                 type="text"
//                 name="code"
//                 value={newDefect.code}
//                 readOnly
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100"
//               />
//             </div>

//             {/* Short English */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.shortEng", "Short English Name")}*
//               </label>
//               <input
//                 type="text"
//                 name="shortEng"
//                 value={newDefect.shortEng}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               />
//             </div>

//             {/* English */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.english", "English Name")}*
//               </label>
//               <input
//                 type="text"
//                 name="english"
//                 value={newDefect.english}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               />
//             </div>

//             {/* Khmer */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.khmer", "Khmer Name")}*
//               </label>
//               <input
//                 type="text"
//                 name="khmer"
//                 value={newDefect.khmer}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               />
//             </div>

//             {/* Chinese */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.chinese", "Chinese Name")}
//               </label>
//               <input
//                 type="text"
//                 name="chinese"
//                 value={newDefect.chinese}
//                 onChange={handleChange}
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               />
//             </div>

//             {/* Repair */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.repair", "Repair")}
//               </label>
//               <select
//                 name="repair"
//                 value={newDefect.repair}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               >
//                 <option value="">
//                   {t("rovingDefectAdd.select", "Select...")}
//                 </option>
//                 {dropdownOptions.repairs.map((opt) => (
//                   <option key={opt} value={opt}>
//                     {opt}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Category English */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t(
//                   "rovingDefectAdd.fields.categoryEnglish",
//                   "Category (English)"
//                 )}
//               </label>
//               <select
//                 name="categoryEnglish"
//                 value={newDefect.categoryEnglish}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               >
//                 <option value="">
//                   {t("rovingDefectAdd.select", "Select...")}
//                 </option>
//                 {dropdownOptions.categoriesEnglish.map((opt) => (
//                   <option key={opt} value={opt}>
//                     {opt}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Category Khmer */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.categoryKhmer", "Category (Khmer)")}
//               </label>
//               <select
//                 name="categoryKhmer"
//                 value={newDefect.categoryKhmer}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               >
//                 <option value="">
//                   {t("rovingDefectAdd.select", "Select...")}
//                 </option>
//                 {dropdownOptions.categoriesKhmer.map((opt) => (
//                   <option key={opt} value={opt}>
//                     {opt}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Category Chinese */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t(
//                   "rovingDefectAdd.fields.categoryChinese",
//                   "Category (Chinese)"
//                 )}
//               </label>
//               <select
//                 name="categoryChinese"
//                 value={newDefect.categoryChinese}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               >
//                 <option value="">
//                   {t("rovingDefectAdd.select", "Select...")}
//                 </option>
//                 {dropdownOptions.categoriesChinese.map((opt) => (
//                   <option key={opt} value={opt}>
//                     {opt}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Type */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.type", "Type")}
//               </label>
//               <select
//                 name="type"
//                 value={newDefect.type}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               >
//                 <option value="">
//                   {t("rovingDefectAdd.select", "Select...")}
//                 </option>
//                 {dropdownOptions.types.map((opt) => (
//                   <option key={opt} value={opt}>
//                     {opt}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Is Common */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700">
//                 {t("rovingDefectAdd.fields.isCommon", "Is Common")}
//               </label>
//               <select
//                 name="isCommon"
//                 value={newDefect.isCommon}
//                 onChange={handleChange}
//                 required
//                 className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
//               >
//                 <option value="Yes">Yes</option>
//                 <option value="No">No</option>
//               </select>
//             </div>
//           </div>

//           <div className="flex justify-end pt-4">
//             <button
//               type="submit"
//               disabled={isSaving}
//               className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
//             >
//               {isSaving ? (
//                 <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//               ) : (
//                 <PlusCircle className="w-5 h-5 mr-2" />
//               )}
//               {isSaving
//                 ? t("rovingDefectAdd.saving", "Saving...")
//                 : t("rovingDefectAdd.addButton", "Add Defect")}
//             </button>
//           </div>
//         </form>
//       )}
//     </div>
//   );
// };

// export default RovingDefectAdd;

// src/components/inspection/qc_roving/RovingDefectAdd.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { Loader2, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";

const RovingDefectAdd = ({ onDefectAdded }) => {
  const { t } = useTranslation();

  const getInitialState = () => ({
    code: "",
    shortEng: "",
    english: "",
    khmer: "",
    chinese: "",
    image: "",
    repair: "",
    categoryEnglish: "",
    categoryKhmer: "",
    categoryChinese: "",
    type: "",
    isCommon: "Yes"
  });

  const [newDefect, setNewDefect] = useState(getInitialState());
  const [options, setOptions] = useState({
    repairs: [],
    categories: [],
    types: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchOptions = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/sewing-defects/options`
      );
      setOptions(response.data);
      setNewDefect((prev) => ({ ...prev, code: response.data.nextCode }));
    } catch (err) {
      console.error("Error fetching form options:", err);
      setError(
        t("rovingDefectAdd.errors.fetchOptions", "Failed to load form options.")
      );
    }
  }, [t]);

  useEffect(() => {
    if (showForm) fetchOptions();
  }, [showForm, fetchOptions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewDefect((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const selectedEngCat = e.target.value;
    const catObject = options.categories.find(
      (c) => c.english === selectedEngCat
    );
    if (catObject) {
      setNewDefect((prev) => ({
        ...prev,
        categoryEnglish: catObject.english,
        categoryKhmer: catObject.khmer,
        categoryChinese: catObject.chinese || ""
      }));
    } else {
      setNewDefect((prev) => ({
        ...prev,
        categoryEnglish: "",
        categoryKhmer: "",
        categoryChinese: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/api/sewing-defects`, newDefect);
      Swal.fire({
        icon: "success",
        title: t("rovingDefectAdd.success.title", "Success!"),
        text: t(
          "rovingDefectAdd.success.message",
          "New defect added successfully!"
        ),
        timer: 2000,
        showConfirmButton: false
      });
      setShowForm(false);
      setNewDefect(getInitialState());
      if (onDefectAdded) onDefectAdded();
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        t("rovingDefectAdd.errors.saveFailed", "Failed to add defect.");
      setError(errMsg);
      Swal.fire({
        icon: "error",
        title: t("rovingDefectAdd.errors.saveFailedTitle", "Save Failed"),
        text: errMsg
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-300">
      <div
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setShowForm(!showForm)}
      >
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <PlusCircle className="w-5 h-5 mr-3 text-blue-600" />
          {t("rovingDefectAdd.title", "Add New Roving Defect")}
        </h2>
        {showForm ? (
          <ChevronUp className="text-gray-600" />
        ) : (
          <ChevronDown className="text-gray-500" />
        )}
      </div>
      {showForm && (
        <div className="border-t border-gray-200 p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 text-red-800 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("rovingDefectAdd.fields.code", "Defect Code")}
                </label>
                <input
                  type="text"
                  value={newDefect.code}
                  readOnly
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("rovingDefectAdd.fields.shortEng", "Short English Name")}*
                </label>
                <input
                  type="text"
                  name="shortEng"
                  value={newDefect.shortEng}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("rovingDefectAdd.fields.english", "English Name")}*
                </label>
                <input
                  type="text"
                  name="english"
                  value={newDefect.english}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("rovingDefectAdd.fields.khmer", "Khmer Name")}*
                </label>
                <input
                  type="text"
                  name="khmer"
                  value={newDefect.khmer}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("rovingDefectAdd.fields.chinese", "Chinese Name")}
                </label>
                <input
                  type="text"
                  name="chinese"
                  value={newDefect.chinese}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t(
                      "rovingDefectAdd.fields.categoryEnglish",
                      "Category (English)"
                    )}
                    *
                  </label>
                  <select
                    value={newDefect.categoryEnglish}
                    onChange={handleCategoryChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      {t(
                        "rovingDefectAdd.selectCategory",
                        "Select a category..."
                      )}
                    </option>
                    {options.categories.map((cat, i) => (
                      <option key={i} value={cat.english}>
                        {cat.english}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t(
                      "rovingDefectAdd.fields.categoryKhmer",
                      "Category (Khmer)"
                    )}
                  </label>
                  <input
                    type="text"
                    value={newDefect.categoryKhmer}
                    readOnly
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t(
                      "rovingDefectAdd.fields.categoryChinese",
                      "Category (Chinese)"
                    )}
                  </label>
                  <input
                    type="text"
                    value={newDefect.categoryChinese}
                    readOnly
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("rovingDefectAdd.fields.repair", "Repair")}*
                  </label>
                  <select
                    name="repair"
                    value={newDefect.repair}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      {t("rovingDefectAdd.select", "Select...")}
                    </option>
                    {options.repairs.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("rovingDefectAdd.fields.type", "Type")}*
                  </label>
                  <select
                    name="type"
                    value={newDefect.type}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="" disabled>
                      {t("rovingDefectAdd.select", "Select...")}
                    </option>
                    {options.types.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("rovingDefectAdd.fields.isCommon", "Is Common")}*
                  </label>
                  <select
                    name="isCommon"
                    value={newDefect.isCommon}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <PlusCircle className="w-5 h-5 mr-2" />
                )}
                {isSaving
                  ? t("rovingDefectAdd.saving", "Saving...")
                  : t("rovingDefectAdd.addButton", "Add Defect")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RovingDefectAdd;
