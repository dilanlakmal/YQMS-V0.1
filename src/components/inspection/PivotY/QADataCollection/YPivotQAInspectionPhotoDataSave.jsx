import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Save, Loader2, Camera } from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesPhotos from "../QATemplates/YPivotQATemplatesPhotos";

const YPivotQAInspectionPhotoDataSave = ({
  reportData,
  onUpdatePhotoData,
  reportId,
  isReportSaved
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // 1. Determine Allowed Sections based on Template (Logic from Determination component)
  const selectedTemplate = reportData?.selectedTemplate;

  const allowedSectionIds = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.SelectedPhotoSectionList) {
      return [];
    }
    return selectedTemplate.SelectedPhotoSectionList.map(
      (item) => item.PhotoSectionID
    );
  }, [selectedTemplate]);

  // 2. Fetch Existing Data (Logic from Header Data Save component)
  useEffect(() => {
    const fetchExistingPhotoData = async () => {
      if (!reportId) return;

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.photoData) {
          const backendPhotoData = res.data.data.photoData;

          const newRemarks = {};
          const newCapturedImages = {};

          // Flatten the nested structure back to UI State keys
          backendPhotoData.forEach((section) => {
            const secId = section.sectionId;

            section.items.forEach((item) => {
              const itemNo = item.itemNo;

              // Restore Remarks
              if (item.remarks) {
                const key = `${secId}_${itemNo}`;
                newRemarks[key] = item.remarks;
              }

              // Restore Images
              if (item.images && item.images.length > 0) {
                item.images.forEach((img, idx) => {
                  const key = `${secId}_${itemNo}_${idx}`;

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
                    url: displayUrl,
                    imgSrc: displayUrl,
                    history: []
                  };
                });
              }
            });
          });

          onUpdatePhotoData({
            remarks: newRemarks,
            capturedImages: newCapturedImages
          });
        }
      } catch (error) {
        console.error("Error fetching existing photo data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    // Check if we already have data in state to avoid overwrite on navigation
    // But if we just loaded the saved order, we need to fetch.
    const hasData =
      Object.keys(reportData.photoData?.capturedImages || {}).length > 0;
    if (reportId && !hasData) {
      fetchExistingPhotoData();
    }
  }, [reportId]);

  // 3. Save Handler
  const handleSavePhotoData = async () => {
    if (!isReportSaved || !reportId) {
      alert("Please save the Order information first.");
      return;
    }

    setSaving(true);
    try {
      // We need the full Section/Item definitions to send names to backend
      const configRes = await axios.get(
        `${API_BASE_URL}/api/qa-sections-photos`
      );
      const allSections = configRes.data.data;

      // Filter only sections relevant to this report
      const relevantSections = allSections.filter((sec) =>
        allowedSectionIds.includes(sec._id)
      );

      const payloadData = relevantSections
        .map((section) => {
          // Find items in this section that have data (images or remarks)
          // OR simply iterate all items defined in the config to be safe

          const processedItems = section.itemList.map((item) => {
            const itemKeyBase = `${section._id}_${item.no}`;

            // Get Remarks
            const itemRemark =
              (reportData.photoData?.remarks || {})[itemKeyBase] || "";

            // Get Images for this item
            const itemImages = Object.keys(
              reportData.photoData?.capturedImages || {}
            )
              .filter((k) => k.startsWith(`${itemKeyBase}_`))
              .sort((a, b) => {
                // Sort by index suffix to maintain order
                const idxA = parseInt(a.split("_")[2]);
                const idxB = parseInt(b.split("_")[2]);
                return idxA - idxB;
              })
              .map((k) => {
                const img = reportData.photoData.capturedImages[k];

                let payloadImageURL = null;
                let payloadImgSrc = null;

                if (img.url.startsWith("data:")) {
                  // New Image -> Base64
                  payloadImgSrc = img.url;
                  payloadImageURL = null;
                } else {
                  // Existing Image -> Relative URL
                  payloadImageURL = img.url.replace(API_BASE_URL, "");
                  payloadImgSrc = null;
                }

                return {
                  id: img.id,
                  imageURL: payloadImageURL,
                  imgSrc: payloadImgSrc
                };
              });

            return {
              itemNo: item.no,
              itemName: item.itemName,
              remarks: itemRemark,
              images: itemImages
            };
          });

          // Filter out items that are completely empty to save DB space?
          // Or keep them to show empty state next time?
          // Let's keep items if they have remarks OR images.
          const itemsWithData = processedItems.filter(
            (i) => i.remarks || i.images.length > 0
          );

          return {
            sectionId: section._id,
            sectionName: section.sectionName,
            items: itemsWithData
          };
        })
        .filter((sec) => sec.items.length > 0); // Only send sections with data

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-photo-data`,
        {
          reportId: reportId,
          photoData: payloadData
        }
      );

      if (res.data.success) {
        alert("Photo data saved successfully!");
      }
    } catch (error) {
      console.error("Error saving photo data:", error);
      alert("Failed to save photo data.");
    } finally {
      setSaving(false);
    }
  };

  // 4. Render Loading State
  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing photos...
        </span>
      </div>
    );
  }

  // 5. Render Empty/Warning State if no template selected
  if (!selectedTemplate) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
          <Camera className="w-10 h-10 text-indigo-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
          Photos Section
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Please select a Report Type in the "Order" tab to configure which
          photos are required.
        </p>
      </div>
    );
  }

  // 6. Render Not Required State
  if (selectedTemplate.Photos === "No") {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <Camera className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
          Photos Not Required
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          The selected report type "
          <strong>{selectedTemplate.ReportType}</strong>" does not require
          photos.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* 1. Configuration Context Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 shadow-lg text-white flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photos
          </h2>
          <p className="text-xs text-orange-100 opacity-90">
            {allowedSectionIds.length > 0
              ? `Sections for: ${selectedTemplate.ReportType}`
              : `Warning: No specific photo sections configured for ${selectedTemplate.ReportType}`}
          </p>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
          {allowedSectionIds.length} Sections
        </div>
      </div>

      {/* 2. UI Component */}
      <YPivotQATemplatesPhotos
        allowedSectionIds={allowedSectionIds}
        reportData={reportData}
        onUpdatePhotoData={onUpdatePhotoData}
      />

      {/* 3. Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-8xl mx-auto flex justify-end">
          <button
            onClick={handleSavePhotoData}
            disabled={!isReportSaved || saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${
                isReportSaved
                  ? "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
            title={!isReportSaved ? "Save Order Data first" : "Save Photo Data"}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Photo Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionPhotoDataSave;
