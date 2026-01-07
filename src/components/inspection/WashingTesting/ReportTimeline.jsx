import React from "react";
import { Pencil, Plus } from "lucide-react";
import { normalizeImageUrl, getImageFilename } from "./utils";

const ReportTimeline = ({ report, savedImageRotations, openImageViewer, onEditInitialImages, onEditReceivedImages, onEditCompletionImages }) => {
  return (
    <div className="mt-4 space-y-3">
      {/* Step 1: Initial Submission */}
      <div className="relative pl-4 md:pl-6 border-l-2 border-gray-300 dark:border-gray-600">
        <div className="absolute -left-1.5 top-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800"></div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2.5 md:p-3 border border-blue-200 dark:border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1.5">
            <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              Step 1: Sent To Home Washing
            </h4>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {report.sendToHomeWashingDate
                ? new Date(report.sendToHomeWashingDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
                : report.submittedAt
                  ? new Date(report.submittedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : "N/A"}
            </span>
          </div>

          {/* Initial Images */}
          {((report.images && report.images.length > 0) || onEditInitialImages) && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  {report.images && report.images.length > 0 ? `Images (${report.images.length})` : "Images"}
                </p>
                {onEditInitialImages && report.status !== 'completed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditInitialImages(report);
                    }}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                    title={report.images && report.images.length > 0 ? "Edit Images" : "Add Images"}
                  >
                    {report.images && report.images.length > 0 ? <Pencil size={12} /> : <Plus size={12} />}
                    {!(report.images && report.images.length > 0) && "Add"}
                  </button>
                )}
              </div>
              {report.images && report.images.length > 0 && (
                <div className="flex flex-row flex-wrap gap-1.5 md:gap-2">
                  {report.images.map((imageUrl, idx) => {
                    const normalizedUrl = normalizeImageUrl(imageUrl);
                    const savedRotation = savedImageRotations[normalizedUrl] || 0;
                    return (
                      <div
                        key={`initial-${idx}`}
                        className="flex flex-col items-center gap-0.5"
                      >
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden border-2 border-blue-300 dark:border-blue-700 bg-gray-100 dark:bg-gray-700">
                          <div className="w-full h-full flex items-center justify-center">
                            <img
                              src={normalizedUrl}
                              alt={`Initial ${idx + 1}`}
                              className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-80 transition-all duration-300"
                              style={{ transform: `rotate(${savedRotation}deg)` }}
                              onClick={() => openImageViewer(normalizedUrl, getImageFilename(normalizedUrl), report.images, idx)}
                              onError={(e) => {
                                console.error("Image load error:", normalizedUrl);
                                e.target.style.display = "none";
                                const placeholder = document.createElement("div");
                                placeholder.className = "w-full h-full flex items-center justify-center text-xs text-gray-400";
                                placeholder.textContent = "Not found";
                                e.target.parentElement.appendChild(placeholder);
                              }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {idx + 1}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Initial Notes */}
          {report.notes && (
            <div className="mt-2">
              <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1.5">
                Notes
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                {report.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Received */}
      {(report.receivedDate || report.receivedAt || (report.receivedImages && report.receivedImages.length > 0) || report.receivedNotes) && (
        <div className="relative pl-4 md:pl-6 border-l-2 border-yellow-400 dark:border-yellow-600">
          <div className="absolute -left-1.5 top-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2.5 md:p-3 border border-yellow-200 dark:border-yellow-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1.5">
              <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                Step 2: Received
              </h4>
              <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                {report.receivedAt
                  ? new Date(report.receivedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : report.receivedDate
                    ? new Date(report.receivedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                    : "Not yet received"}
              </span>
            </div>

            {/* Received Images */}
            {((report.receivedImages && report.receivedImages.length > 0) || onEditReceivedImages) && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
                    {report.receivedImages && report.receivedImages.length > 0 ? `Images (${report.receivedImages.length})` : "Images"}
                  </p>
                  {onEditReceivedImages && report.status !== 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditReceivedImages(report);
                      }}
                      className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center gap-1"
                      title={report.receivedImages && report.receivedImages.length > 0 ? "Edit Images" : "Add Images"}
                    >
                      {report.receivedImages && report.receivedImages.length > 0 ? <Pencil size={12} /> : <Plus size={12} />}
                      {!(report.receivedImages && report.receivedImages.length > 0) && "Add"}
                    </button>
                  )}
                </div>
                {report.receivedImages && report.receivedImages.length > 0 && (
                  <div className="flex flex-row flex-wrap gap-1.5 md:gap-2">
                    {report.receivedImages.map((imageUrl, idx) => {
                      const normalizedUrl = normalizeImageUrl(imageUrl);
                      const savedRotation = savedImageRotations[normalizedUrl] || 0;
                      return (
                        <div
                          key={`received-${idx}`}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden border-2 border-yellow-300 dark:border-yellow-700 bg-gray-100 dark:bg-gray-700">
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={normalizedUrl}
                                alt={`Received ${idx + 1}`}
                                className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-80 transition-all duration-300"
                                style={{ transform: `rotate(${savedRotation}deg)` }}
                                onClick={() => openImageViewer(normalizedUrl, getImageFilename(normalizedUrl), report.receivedImages, idx)}
                                onError={(e) => {
                                  console.error("Image load error:", normalizedUrl);
                                  e.target.style.display = "none";
                                  const placeholder = document.createElement("div");
                                  placeholder.className = "w-full h-full flex items-center justify-center text-xs text-gray-400";
                                  placeholder.textContent = "Not found";
                                  e.target.parentElement.appendChild(placeholder);
                                }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                            {idx + 1}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Received Notes */}
            {report.receivedNotes && (
              <div className="mt-2 px-2.5 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 rounded border border-yellow-300 dark:border-yellow-700">
                <p className="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-0.5">Notes</p>
                <p className="text-xs text-yellow-900 dark:text-yellow-200 leading-relaxed">{report.receivedNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Completed */}
      {(report.completedDate || report.completedAt || (report.completionImages && report.completionImages.length > 0) || report.completionNotes) && (
        <div className="relative pl-4 md:pl-6 border-l-2 border-green-400 dark:border-green-600">
          <div className="absolute -left-1.5 top-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2.5 md:p-3 border border-green-200 dark:border-green-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 mb-1.5">
              <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Step 3: Completed
              </h4>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                {report.completedAt
                  ? new Date(report.completedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                  : report.completedDate
                    ? new Date(report.completedDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })
                    : "Not yet completed"}
              </span>
            </div>

            {/* Completion Images */}
            {((report.completionImages && report.completionImages.length > 0) || onEditCompletionImages) && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-green-600 dark:text-green-400">
                    {report.completionImages && report.completionImages.length > 0 ? `Images (${report.completionImages.length})` : "Images"}
                  </p>
                  {onEditCompletionImages && report.status !== 'completed' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCompletionImages(report);
                      }}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                      title={report.completionImages && report.completionImages.length > 0 ? "Edit Images" : "Add Images"}
                    >
                      {report.completionImages && report.completionImages.length > 0 ? <Pencil size={12} /> : <Plus size={12} />}
                      {!(report.completionImages && report.completionImages.length > 0) && "Add"}
                    </button>
                  )}
                </div>
                {report.completionImages && report.completionImages.length > 0 && (
                  <div className="flex flex-row flex-wrap gap-1.5 md:gap-2">
                    {report.completionImages.map((imageUrl, idx) => {
                      const normalizedUrl = normalizeImageUrl(imageUrl);
                      const savedRotation = savedImageRotations[normalizedUrl] || 0;
                      return (
                        <div
                          key={`completion-${idx}`}
                          className="flex flex-col items-center gap-0.5"
                        >
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded overflow-hidden border-2 border-green-300 dark:border-green-700 bg-gray-100 dark:bg-gray-700">
                            <div className="w-full h-full flex items-center justify-center">
                              <img
                                src={normalizedUrl}
                                alt={`Completion ${idx + 1}`}
                                className="max-w-full max-h-full object-contain cursor-pointer hover:opacity-80 transition-all duration-300"
                                style={{ transform: `rotate(${savedRotation}deg)` }}
                                onClick={() => openImageViewer(normalizedUrl, getImageFilename(normalizedUrl), report.completionImages, idx)}
                                onError={(e) => {
                                  console.error("Image load error:", normalizedUrl);
                                  e.target.style.display = "none";
                                  const placeholder = document.createElement("div");
                                  placeholder.className = "w-full h-full flex items-center justify-center text-xs text-gray-400";
                                  placeholder.textContent = "Not found";
                                  e.target.parentElement.appendChild(placeholder);
                                }}
                              />
                            </div>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {idx + 1}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Completion Notes */}
            {report.completionNotes && (
              <div className="mt-2 px-2.5 py-1.5 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700">
                <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-0.5">Notes</p>
                <p className="text-xs text-green-900 dark:text-green-200 leading-relaxed">{report.completionNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportTimeline;
