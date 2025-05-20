// src/components/inspection/cutting/report/ReportCuttingIssues.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../../config"; // Adjust path as needed

const ReportCuttingIssues = ({ cuttingDefects }) => {
  const { t, i18n } = useTranslation();

  if (!cuttingDefects) return null;

  const { issues, additionalComments, additionalImages } = cuttingDefects;

  const getIssueNameDisplay = (issue) => {
    if (i18n.language === "km" && issue.cuttingdefectNameKhmer)
      return issue.cuttingdefectNameKhmer;
    // Add Chinese or other languages if needed
    if (i18n.language === "zh" && issue.cuttingdefectNameChinese)
      return issue.cuttingdefectNameChinese;
    return issue.cuttingdefectName;
  };

  const getImagePath = (relativePath) => {
    // The relativePath from the DB is like '/storage/cutting/filename.jpg'
    // We need to construct the full URL based on API_BASE_URL if it's not already a full path
    // However, your existing upload endpoint returns `/storage/cutting/${req.file.filename}`
    // This path should be directly usable if your Express static serving is set up correctly.

    // If API_BASE_URL is just 'https://yourdomain.com' and paths are '/storage/...'
    // then `${API_BASE_URL}${relativePath}` would be 'https://yourdomain.com/storage/...'
    // If API_BASE_URL includes an api prefix like 'https://yourdomain.com/api' and paths are '/storage/...'
    // then you need to ensure your static serving is at the root or adjust.

    // Given your static serving: app.use("/storage", express.static(path.join(__dirname, "public/storage")));
    // And the saved path in DB is like: `/storage/cutting/cutting-xxxxxxxx.jpg` (as per your upload endpoint)
    // The API_BASE_URL likely points to the root of your backend server (e.g., https://192.165.2.175:5001)
    // So, the full URL should be API_BASE_URL + relativePath.

    if (!relativePath) return "";
    if (relativePath.startsWith("http")) return relativePath; // Already a full URL

    // Ensure API_BASE_URL does not end with a slash if relativePath starts with one.
    const base = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    const path = relativePath.startsWith("/")
      ? relativePath
      : `/${relativePath}`;

    return `${base}${path}`;
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-3">
        {t("cutting.cuttingIssuesTitle")}
      </h3>

      {issues && issues.length > 0 && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-600 mb-2">
            {t("cutting.issuesFound")}
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">
                    {t("cutting.defectName")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.remarks")}
                  </th>
                  <th className="border border-gray-300 p-2">
                    {t("cutting.evidence")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">
                      {getIssueNameDisplay(issue)}
                    </td>
                    <td className="border border-gray-300 p-2">
                      {issue.remarks}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <div className="flex flex-wrap gap-1">
                        {issue.imageData &&
                          issue.imageData.map(
                            (img, imgIdx) =>
                              img.path && (
                                <a
                                  href={getImagePath(img.path)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  key={imgIdx}
                                >
                                  <img
                                    src={getImagePath(img.path)}
                                    alt={`${t("cutting.evidence")} ${
                                      img.no || imgIdx + 1
                                    }`}
                                    className="max-w-[80px] max-h-[80px] object-contain inline-block m-1 border hover:opacity-75"
                                  />
                                </a>
                              )
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {additionalComments && (
        <div className="mb-4">
          <h4 className="text-md font-semibold text-gray-600 mb-1">
            {t("cutting.additionalComments")}
          </h4>
          <p className="text-sm text-gray-700 p-2 border border-gray-200 rounded bg-gray-50 whitespace-pre-wrap">
            {additionalComments}
          </p>
        </div>
      )}

      {additionalImages && additionalImages.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-600 mb-1">
            {t("cutting.additionalImages")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {additionalImages.map(
              (img, index) =>
                img.path && (
                  <a
                    href={getImagePath(img.path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={index}
                  >
                    <img
                      src={getImagePath(img.path)}
                      alt={`${t("cutting.additionalImage")} ${
                        img.no || index + 1
                      }`}
                      className="max-w-[120px] max-h-[120px] object-contain border rounded hover:opacity-75"
                    />
                  </a>
                )
            )}
          </div>
        </div>
      )}

      {(!issues || issues.length === 0) &&
        !additionalComments &&
        (!additionalImages || additionalImages.length === 0) && (
          <p className="text-sm text-gray-500">
            {t("cutting.noCuttingIssuesReported")}
          </p>
        )}
    </div>
  );
};

export default ReportCuttingIssues;
