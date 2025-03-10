import React, { useState } from "react";
import { FaInfoCircle } from "react-icons/fa"; // Using react-icons for the 'i' icon
import { allDefects } from "../../constants/QC Inspection/defects";
import { useTranslation } from "react-i18next";

const DefectNames = () => {
  const {t}= useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (imagePath) => {
    setSelectedImage(imagePath);
  };

  const handleClosePreview = () => {
    setSelectedImage(null);
  };

  return (
    <div className="h-full w-full p-4 bg-white rounded-lg shadow-md overflow-hidden">
      <h2 className="text-lg font-bold text-gray-800 mb-4">{t("defIm.defect_name")}</h2>
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-150px)]">
        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 table-auto">
          <thead className="bg-sky-100 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 whitespace-nowrap w-16">
                {t("defName.defect_code")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 whitespace-nowrap w-48">
              {t("defIm.defect_images")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 min-w-[150px]">
              {t("set.english_name")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 min-w-[150px]">
              {t("set.khmer_name")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 min-w-[150px]">
              {t("defName.chinese_name")}
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border border-gray-200 min-w-[150px]">
              {t("defName.printing_name")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allDefects.map((defect, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top">
                  {defect.code}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top relative">
                  <div className="relative">
                    <img
                      src={defect.image}
                      alt={defect.english}
                      className="h-24 w-24 object-cover rounded"
                      onError={(e) => {
                        e.target.src = "assets/Img/default.jpg"; // Fallback image
                      }}
                    />
                    <button
                      onClick={() => handleImageClick(defect.image)}
                      className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1 hover:bg-blue-600 focus:outline-none"
                      title="View Image"
                    >
                      <FaInfoCircle size={16} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top whitespace-normal break-words">
                  {defect.english}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top whitespace-normal break-words">
                  {defect.khmer}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top whitespace-normal break-words">
                  {defect.chinese}
                </td>
                <td className="px-4 py-2 text-sm text-gray-700 border border-gray-200 align-top whitespace-normal break-words">
                  {defect.shortEng}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-[90vw] max-h-[90vh] relative overflow-hidden">
            <img
              src={selectedImage}
              alt="Defect Preview"
              className="max-w-full max-h-[80vh] object-contain"
              onError={(e) => {
                e.target.src = "assets/Img/default.jpg"; // Fallback image
              }}
            />
            <button
              onClick={handleClosePreview}
              className="absolute top-2 right-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 focus:outline-none"
            >
             {t("previewMode.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DefectNames;
