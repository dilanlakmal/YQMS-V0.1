import React, { useState, useEffect } from "react";
import axios from "axios";
import { Save, Loader2 } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesHeader from "../QATemplates/YPivotQATemplatesHeader";

const YPivotQAInspectionHeaderDataSave = ({
  headerData,
  onUpdateHeaderData,
  reportId,
  isReportSaved
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // --- FETCH EXISTING DATA ON MOUNT OR ID CHANGE ---
  useEffect(() => {
    const fetchExistingHeaderData = async () => {
      if (!reportId) return;

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.headerData) {
          const backendHeaderData = res.data.data.headerData;

          const newSelectedOptions = {};
          const newRemarks = {};
          const newCapturedImages = {};

          backendHeaderData.forEach((section) => {
            const secId = section.headerId;

            if (section.selectedOption)
              newSelectedOptions[secId] = section.selectedOption;
            if (section.remarks) newRemarks[secId] = section.remarks;

            if (section.images && section.images.length > 0) {
              section.images.forEach((img, idx) => {
                const key = `${secId}_${idx}`;

                // If imageURL exists and is relative (starts with /), prepend API_BASE_URL
                let displayUrl = img.imageURL;
                if (
                  displayUrl &&
                  !displayUrl.startsWith("http") &&
                  !displayUrl.startsWith("data:")
                ) {
                  displayUrl = `${API_BASE_URL}${displayUrl}`;
                }

                newCapturedImages[key] = {
                  id: img.imageId,
                  url: displayUrl, // Full URL for valid <img> src
                  imgSrc: displayUrl, // For editor preview
                  history: []
                };
              });
            }
          });

          onUpdateHeaderData({
            selectedOptions: newSelectedOptions,
            remarks: newRemarks,
            capturedImages: newCapturedImages
          });
        }
      } catch (error) {
        console.error("Error fetching existing header data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    // Check if we should load data
    const hasData = Object.keys(headerData.selectedOptions || {}).length > 0;
    if (reportId && !hasData) {
      fetchExistingHeaderData();
    }
  }, [reportId]);

  // --- SAVE HANDLER---
  const handleSaveHeaderData = async () => {
    if (!isReportSaved || !reportId) {
      alert(
        "Please save the Order information first before saving Header data."
      );
      return;
    }

    setSaving(true);
    try {
      const sectionsRes = await axios.get(
        `${API_BASE_URL}/api/qa-sections-home`
      );
      const sections = sectionsRes.data.data;

      const payloadData = sections.map((section) => {
        const secId = section._id;

        const sectionImages = Object.keys(headerData.capturedImages || {})
          .filter((k) => k.startsWith(`${secId}_`))
          .map((k) => {
            const img = headerData.capturedImages[k];

            let payloadImageURL = null;
            let payloadImgSrc = null;

            if (img.url.startsWith("data:")) {
              // Case A: New Image (Base64)
              // We send it in 'imgSrc' so backend can save it to disk
              payloadImgSrc = img.url;
              payloadImageURL = null;
            } else {
              // Case B: Existing Image (Full URL)
              // We strip the API_BASE_URL to save only relative path
              payloadImageURL = img.url.replace(API_BASE_URL, "");
              payloadImgSrc = null; // No need to re-upload
            }

            return {
              id: img.id || k,
              imageURL: payloadImageURL,
              imgSrc: payloadImgSrc
            };
          });

        return {
          headerId: secId,
          name: section.MainTitle,
          selectedOption: (headerData.selectedOptions || {})[secId] || "",
          remarks: (headerData.remarks || {})[secId] || "",
          images: sectionImages
        };
      });

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-header-data`,
        {
          reportId: reportId,
          headerData: payloadData
        }
      );

      if (res.data.success) {
        alert("Header data saved successfully!");
        // Optional: Reload data here to refresh logic if needed
      }
    } catch (error) {
      console.error("Error saving header data:", error);
      alert("Failed to save header data.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing data...
        </span>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* 1. UI Component */}
      <YPivotQATemplatesHeader
        headerData={headerData}
        onUpdateHeaderData={onUpdateHeaderData}
      />

      {/* 2. Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-5xl mx-auto flex justify-end">
          <button
            onClick={handleSaveHeaderData}
            disabled={!isReportSaved || saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${
                isReportSaved
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
            title={
              !isReportSaved ? "Save Order Data first" : "Save Header Data"
            }
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Header Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionHeaderDataSave;
