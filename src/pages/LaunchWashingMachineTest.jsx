import React, { useRef, useEffect } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { useSearchParams } from "react-router-dom";
import { HiDocumentAdd, HiClipboardList } from "react-icons/hi";
import {
  MdWarehouse,
  MdLocalLaundryService,
  MdOutlineDeviceThermostat,
  MdOutlineImagesearchRoller,
  MdOutlineExpand,
  MdAssignmentInd,
} from "react-icons/md";
import { Camera, ScanSearch } from "lucide-react";
import { io } from "socket.io-client";
import { API_BASE_URL, QR_CODE_BASE_URL } from "../../config.js";
import GameAssignControl from "../components/inspection/WashingTesting/assign_control/GameAssignControl";
import {
  ImageViewerModal,
  DynamicFormSection,
  ReportsList,
  ReceivedModal,
  CompletionModal,
  DeleteConfirmationModal,
  RejectReportModal,
  EditImagesModal,
  EditReportModal,
  QRCodeModal,
  QRScannerModal,
  SizeFollowUpModal,
  REPORT_TYPES,
  getInitialFormData,
  getQRCodeBaseURL,
} from "../components/inspection/WashingTesting/lib";
import {
  useWashingFilterStore,
  useModalStore,
  useWashingReportsStore,
  useFormStore,
  useOrderDataStore,
  useAssignControlStore,
  computeUserRoles,
  useImageStore,
  useQRScannerStore,
} from "../components/inspection/WashingTesting/stores";

const LaundryWashingMachineTest = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const fileInputRef = useRef(null);
  const scannerUploadInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const receivedImageInputRef = useRef(null);
  const completionImageInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // ─── Initialize form default once ─────────────────────────────────
  if (!useFormStore.getState().formData.reportType) {
    useFormStore.getState().resetForm(getInitialFormData(REPORT_TYPES.GARMENT_WASH));
  }

  // ─── Store subscriptions ──────────────────────────────────────────
  const {
    showColorDropdown, setShowColorDropdown,
    showPODropdown, setShowPODropdown,
    showETDDropdown, setShowETDDropdown,
    isReportTypeOpen, setIsReportTypeOpen,
    activeTab, setActiveTab,
    handleInputChange, handleOrderNoSelect, searchOrderNo,
    handleFileInputChange, handleCameraInputChange,
    triggerFileInput, triggerCameraInput,
    handleRemoveImageWrapper, handleSubmit,
  } = useFormStore();

  const {
    standard: { pagination, reports: standardReports },
    fetchReports: _fetchReports,
    refreshAllReports,
    handlePrintPDF, handleDownloadPDF, handleExportExcel,
  } = useWashingReportsStore();

  const {
    imageRotations, receivedImageRotations, completionImageRotations,
    setReceivedImageRotations, setCompletionImageRotations,
    imageViewer, savedImageRotations,
    openImageViewer, closeImageViewer,
    goToNextImage, goToPreviousImage,
    rotateImageViewer, zoomImageViewer,
    toggleZoom, handleImageMouseDown,
    handleImageMouseMove, handleImageMouseUp,
    downloadImageViewer,
  } = useImageStore();

  const { standard: _stdF, warehouse: _whF, easy_scan: _ef } = useWashingFilterStore();
  const { fetchFactories, fetchOrderColors, fetchYorksysOrderETD, fetchAnfSpecs } = useOrderDataStore();

  const { causeAssignHistory, fetchAssignControl, fetchUsers } = useAssignControlStore();
  const { isAdminUser, isWarehouseUser } = computeUserRoles(user, causeAssignHistory);

  const {
    receivedModal, closeReceivedModal, setReceivedImages, setReceivedNotes,
    completionModal, closeCompletionModal, setCompletionImages, setCompletionNotes,
    completingReport,
    deleteModal, closeDeleteModal, openRejectModal,
    editModal, editImagesModal, closeEditImagesModal,
    setEditImages, setEditNotes,
    editFormData, setEditFormData,
    editAvailableColors, editAvailablePOs, editAvailableETDs,
    showEditColorDropdown, setShowEditColorDropdown,
    showEditPODropdown, setShowEditPODropdown,
    showEditETDDropdown, setShowEditETDDropdown,
    showReportDateQR, setShowReportDateQR,
    showReportDateScanner, setShowReportDateScanner,
    handleDelete, confirmDelete, handleReject,
    handleEditReport, handleEditSubmit, resetEditState,
    handleReceivedImageUpload, handleReceivedSubmit,
    handleAcceptReceivedFromCard,
    handleCompletionImageUpload, handleCompletionSubmit,
    handleEditInitialImages, handleEditReceivedImages, handleEditCompletionImages,
    handleEditImageUpload, handleRemoveEditImage, handleUpdateImages,
    sizeFollowUpModal, closeSizeFollowUpModal,
  } = useModalStore();

  const {
    scannerFlashOn, initializeScanner, stopScanner, toggleScannerFlash,
    handleQRCodeFileUpload, downloadQRCode, printQRCode,
    processQRScanFromURL, startStatusPolling, clearStatusInterval,
  } = useQRScannerStore();

  // ─── Sync auth user to stores once ────────────────────────────────
  useEffect(() => {
    useAssignControlStore.getState().setCurrentUser(user);
  }, [user]);

  // ─── Set refs for form store ──────────────────────────────────────
  useEffect(() => {
    useFormStore.getState().setRefs({ fileInputRef, cameraInputRef });
  }, []); // eslint-disable-line

  // ─── Cleanup form timers on unmount ───────────────────────────────
  useEffect(() => {
    return () => useFormStore.getState().cleanupTimers();
  }, []);

  // ─── Tab access control ───────────────────────────────────────────
  useEffect(() => {
    if (isWarehouseUser && activeTab === "reports") setActiveTab("warehouse_reports");
    else if (isWarehouseUser && activeTab === "form" && !completingReport) setActiveTab("warehouse_reports");
    else if (!isAdminUser && !isWarehouseUser && (activeTab === "warehouse_reports" || activeTab === "easy_scan")) setActiveTab("reports");
    else if (!isAdminUser && activeTab === "assign_control") setActiveTab(isWarehouseUser ? "warehouse_reports" : "reports");
  }, [isWarehouseUser, activeTab, isAdminUser, completingReport]); // eslint-disable-line

  // ─── Polling: assign control + users ──────────────────────────────
  useEffect(() => {
    fetchAssignControl();
    fetchUsers();
    const intervalId = setInterval(fetchAssignControl, 5000);
    const handleFocus = () => fetchAssignControl();
    window.addEventListener("focus", handleFocus);
    return () => { clearInterval(intervalId); window.removeEventListener("focus", handleFocus); };
  }, []); // eslint-disable-line

  // ─── Debounced report fetching ────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => _fetchReports("standard", _stdF), 500);
    return () => clearTimeout(timer);
  }, [_stdF]); // eslint-disable-line

  useEffect(() => {
    const timer = setTimeout(() => _fetchReports("warehouse", _whF), 500);
    return () => clearTimeout(timer);
  }, [_whF]); // eslint-disable-line

  useEffect(() => {
    const timer = setTimeout(() => _fetchReports("easy_scan", _ef), 500);
    return () => clearTimeout(timer);
  }, [_ef]); // eslint-disable-line

  // ─── Socket.IO: real-time refresh ─────────────────────────────────
  useEffect(() => {
    if (!API_BASE_URL) return;
    const socket = io(API_BASE_URL, { path: "/socket.io", transports: ["websocket"], secure: API_BASE_URL.startsWith("https") });
    const onUpdated = () => refreshAllReports();
    socket.on("washing-report-updated", onUpdated);
    return () => { socket.off("washing-report-updated", onUpdated); socket.disconnect(); };
  }, [refreshAllReports]);

  // ─── Factories on mount ───────────────────────────────────────────
  useEffect(() => { fetchFactories(); }, []); // eslint-disable-line

  // ─── QR scanner cleanup ───────────────────────────────────────────
  useEffect(() => {
    if (!showReportDateScanner) stopScanner();
    return () => stopScanner();
  }, [showReportDateScanner]); // eslint-disable-line

  // ─── QR status polling ────────────────────────────────────────────
  useEffect(() => {
    clearStatusInterval();
    if (showReportDateQR) {
      const reports = useWashingReportsStore.getState().standard.reports;
      const currentReport = reports.find((r) => r._id === showReportDateQR || r.id === showReportDateQR);
      startStatusPolling(showReportDateQR, currentReport?.status || "pending", reports);
    }
    return () => clearStatusInterval();
  }, [showReportDateQR]); // eslint-disable-line

  // ─── URL-based QR scan ────────────────────────────────────────────
  useEffect(() => {
    const scanReportId = searchParams.get("scan");
    if (!scanReportId) return;
    setActiveTab("reports");
    processQRScanFromURL(scanReportId);
    setSearchParams({});
  }, [searchParams]); // eslint-disable-line

  // ─── Close QR modal if report becomes completed ───────────────────
  useEffect(() => {
    if (showReportDateQR) {
      const report = standardReports.find((r) => r._id === showReportDateQR || r.id === showReportDateQR);
      if (report && report.status === "completed") setShowReportDateQR(null);
    }
  }, [standardReports, showReportDateQR]); // eslint-disable-line

  // ─── Close dropdowns on click outside ─────────────────────────────
  useEffect(() => {
    const onMouseDown = (e) => {
      if (showColorDropdown && !e.target.closest(".color-dropdown-container")) setShowColorDropdown(false);
      if (showPODropdown && !e.target.closest(".po-dropdown-container")) setShowPODropdown(false);
      if (showETDDropdown && !e.target.closest(".etd-dropdown-container")) setShowETDDropdown(false);
      if (showEditColorDropdown && !e.target.closest(".color-dropdown-container")) setShowEditColorDropdown(false);
      if (showEditPODropdown && !e.target.closest(".po-dropdown-container")) setShowEditPODropdown(false);
      if (showEditETDDropdown && !e.target.closest(".etd-dropdown-container")) setShowEditETDDropdown(false);
      if (isReportTypeOpen && dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsReportTypeOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [showColorDropdown, showPODropdown, showETDDropdown, showEditColorDropdown, showEditPODropdown, showEditETDDropdown, isReportTypeOpen]); // eslint-disable-line

  const isQRLocked = !isAdminUser && !isWarehouseUser;

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-700 p-6 md:p-8 rounded-t-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-all duration-700 group-hover:bg-cyan-400/30"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-all duration-700 group-hover:bg-blue-400/30"></div>
          <div className="absolute top-10 right-20 w-4 h-4 bg-white/20 rounded-full blur-sm animate-pulse"></div>
          <div className="absolute bottom-10 left-32 w-6 h-6 bg-white/10 rounded-full blur-md animate-bounce delay-700"></div>
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 text-white tracking-tight drop-shadow-md">
              Launch Washing Machine Test
            </h1>
            <p className="text-sm text-blue-100 flex items-center gap-2 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400"></span>
              </span>
              Report Washing - Enter test details and view submitted reports
            </p>
          </div>
        </div>

        <div className="p-4 md:p-6">
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto scrollbar-hide -mb-px" aria-label="Tabs" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {((isAdminUser || !isWarehouseUser) || (isWarehouseUser && activeTab === "form")) && (
                <button onClick={() => setActiveTab("form")} className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "form" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <HiDocumentAdd className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "form" ? "text-emerald-600" : "text-emerald-500/70"}`} />
                    <span className="hidden sm:inline">Create New Report</span>
                    <span className="sm:hidden">Create</span>
                  </span>
                </button>
              )}

              {(isAdminUser || !isWarehouseUser) && (
                <button onClick={() => setActiveTab("reports")} className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "reports" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <HiClipboardList className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "reports" ? "text-blue-600" : "text-blue-500/70"}`} />
                    <span className="hidden sm:inline">Reports ({pagination.totalRecords})</span>
                    <span className="sm:hidden">Reports <span className="text-[10px] bg-blue-100 px-1.5 py-0.5 rounded-full">{pagination.totalRecords}</span></span>
                  </span>
                </button>
              )}

              {(isAdminUser || isWarehouseUser) && (
                <button onClick={() => setActiveTab("warehouse_reports")} className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "warehouse_reports" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <MdWarehouse className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "warehouse_reports" ? "text-amber-600" : "text-amber-500/70"}`} />
                    <span className="hidden sm:inline">Warehouse Report</span>
                    <span className="sm:hidden">Warehouse</span>
                  </span>
                </button>
              )}

              {(isAdminUser || isWarehouseUser) && (
                <button onClick={() => setActiveTab("easy_scan")} className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "easy_scan" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <ScanSearch className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "easy_scan" ? "text-teal-600" : "text-teal-500/70"}`} />
                    <span className="hidden sm:inline">Easy Scan</span>
                    <span className="sm:hidden">Easy Scan</span>
                  </span>
                </button>
              )}

              {isAdminUser && (
                <button onClick={() => setActiveTab("assign_control")} className={`flex-shrink-0 py-3 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${activeTab === "assign_control" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}>
                  <span className="flex items-center gap-1.5 sm:gap-2">
                    <MdAssignmentInd className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === "assign_control" ? "text-purple-600" : "text-purple-500/70"}`} />
                    <span className="hidden sm:inline">Assign Control</span>
                    <span className="sm:hidden">Assign</span>
                  </span>
                </button>
              )}

              <div className="ml-auto flex items-center flex-shrink-0 pr-0">
                <button
                  type="button"
                  onClick={() => { setShowReportDateScanner("standalone"); setTimeout(() => initializeScanner("standalone"), 300); }}
                  className="p-2 text-indigo-600 hover:text-indigo-700 transform transition-all duration-300 hover:scale-125 active:scale-95 group border-b-2 border-transparent"
                  title="Open Live Camera Scanner"
                >
                  <Camera size={32} className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </nav>
          </div>

          {activeTab === "form" && (
            <DynamicFormSection
              handleInputChange={handleInputChange}
              handleSubmit={(e) => handleSubmit(e, user)}
              isCompleting={!!completingReport}
              handleOrderNoSelect={handleOrderNoSelect}
              searchOrderNo={searchOrderNo}
              fetchOrderColors={fetchOrderColors}
              fetchYorksysOrderETD={fetchYorksysOrderETD}
              fetchAnfSpecs={fetchAnfSpecs}
              handleFileInputChange={handleFileInputChange}
              handleCameraInputChange={handleCameraInputChange}
              triggerFileInput={triggerFileInput}
              triggerCameraInput={triggerCameraInput}
              handleRemoveImage={handleRemoveImageWrapper}
              fileInputRef={fileInputRef}
              cameraInputRef={cameraInputRef}
              imageRotations={imageRotations}
              dropdownRef={dropdownRef}
              reportTypeIcons={{
                "Home Wash Test": <MdLocalLaundryService />,
                "Garment Wash Report": <MdLocalLaundryService />,
                "HT Testing": <MdOutlineDeviceThermostat />,
                "EMB/Printing Testing": <MdOutlineImagesearchRoller />,
                "Pulling Test": <MdOutlineExpand />,
              }}
              reportTypes={[
                { val: "Garment Wash Report", icon: <MdLocalLaundryService /> },
                { val: "HT Testing", icon: <MdOutlineDeviceThermostat /> },
                { val: "EMB/Printing Testing", icon: <MdOutlineImagesearchRoller /> },
                { val: "Pulling Test", icon: <MdOutlineExpand /> },
              ]}
            />
          )}

          {activeTab === "reports" && (
            <ReportsList
              tab="standard"
              onPrintPDF={handlePrintPDF}
              onDownloadPDF={handleDownloadPDF}
              onExportExcel={handleExportExcel}
              onEdit={handleEditReport}
              onDelete={handleDelete}
              onReject={handleReject}
              openRejectModal={openRejectModal}
              onAcceptReceived={handleAcceptReceivedFromCard}
              savedImageRotations={savedImageRotations}
              openImageViewer={openImageViewer}
              restrictDeleteStatuses={["received", "completed"]}
              restrictEditStatuses={["received", "completed"]}
              onEditInitialImages={handleEditInitialImages}
              onEditReceivedImages={handleEditReceivedImages}
              onEditCompletionImages={handleEditCompletionImages}
            />
          )}

          {activeTab === "warehouse_reports" && (
            <ReportsList
              tab="warehouse"
              onPrintPDF={handlePrintPDF}
              onDownloadPDF={handleDownloadPDF}
              onExportExcel={handleExportExcel}
              onEdit={handleEditReport}
              onDelete={handleDelete}
              onReject={handleReject}
              openRejectModal={openRejectModal}
              onAcceptReceived={handleAcceptReceivedFromCard}
              savedImageRotations={savedImageRotations}
              openImageViewer={openImageViewer}
              restrictDeleteStatuses={["received", "completed"]}
              restrictEditStatuses={["received", "completed"]}
              onEditInitialImages={handleEditInitialImages}
              onEditReceivedImages={handleEditReceivedImages}
              onEditCompletionImages={handleEditCompletionImages}
              enableRoleLocking={true}
            />
          )}

          {activeTab === "easy_scan" && (
            <ReportsList
              tab="easy_scan"
              onPrintPDF={handlePrintPDF}
              onDownloadPDF={handleDownloadPDF}
              onExportExcel={handleExportExcel}
              onEdit={handleEditReport}
              onDelete={handleDelete}
              onReject={handleReject}
              openRejectModal={openRejectModal}
              onAcceptReceived={handleAcceptReceivedFromCard}
              savedImageRotations={savedImageRotations}
              openImageViewer={openImageViewer}
              restrictDeleteStatuses={["received", "completed"]}
              restrictEditStatuses={["received", "completed"]}
              onEditInitialImages={handleEditInitialImages}
              onEditReceivedImages={handleEditReceivedImages}
              onEditCompletionImages={handleEditCompletionImages}
              enableRoleLocking={true}
            />
          )}

          {activeTab === "assign_control" && isAdminUser && <GameAssignControl user={user} />}

          <ReceivedModal
            isOpen={receivedModal.isOpen}
            onClose={() => { closeReceivedModal(); setReceivedImageRotations({}); }}
            receivedImages={receivedModal.images}
            setReceivedImages={setReceivedImages}
            receivedNotes={receivedModal.notes}
            setReceivedNotes={setReceivedNotes}
            receivedImageInputRef={receivedImageInputRef}
            handleReceivedImageUpload={handleReceivedImageUpload}
            handleReceivedSubmit={handleReceivedSubmit}
            receivedImageRotations={receivedImageRotations}
            setReceivedImageRotations={setReceivedImageRotations}
          />

          <CompletionModal
            isOpen={completionModal.isOpen}
            onClose={() => { closeCompletionModal(); setCompletionImageRotations({}); }}
            completionImages={completionModal.images}
            setCompletionImages={setCompletionImages}
            completionNotes={completionModal.notes}
            setCompletionNotes={setCompletionNotes}
            completionImageInputRef={completionImageInputRef}
            handleCompletionImageUpload={handleCompletionImageUpload}
            handleCompletionSubmit={handleCompletionSubmit}
            completionImageRotations={completionImageRotations}
            setCompletionImageRotations={setCompletionImageRotations}
          />

          <EditReportModal
            isOpen={editModal.isOpen}
            editingReport={editModal.report}
            editFormData={editFormData}
            setEditFormData={setEditFormData}
            editAvailableColors={editAvailableColors}
            editAvailablePOs={editAvailablePOs}
            editAvailableETDs={editAvailableETDs}
            showEditColorDropdown={showEditColorDropdown}
            setShowEditColorDropdown={setShowEditColorDropdown}
            showEditPODropdown={showEditPODropdown}
            setShowEditPODropdown={setShowEditPODropdown}
            showEditETDDropdown={showEditETDDropdown}
            setShowEditETDDropdown={setShowEditETDDropdown}
            onClose={resetEditState}
            onSubmit={handleEditSubmit}
          />

          <DeleteConfirmationModal isOpen={deleteModal.isOpen} onClose={closeDeleteModal} onConfirm={confirmDelete} />
          <RejectReportModal onConfirm={handleReject} />

          <QRCodeModal
            isOpen={!!showReportDateQR}
            reportId={showReportDateQR}
            onClose={() => setShowReportDateQR(null)}
            onDownloadQRCode={downloadQRCode}
            onPrintQRCode={printQRCode}
            onUploadQRCode={handleQRCodeFileUpload}
            onOpenScanner={(reportId) => { setShowReportDateScanner(reportId); setTimeout(() => initializeScanner(reportId), 300); }}
            getQRCodeBaseURL={() => getQRCodeBaseURL(QR_CODE_BASE_URL)}
            fileInputRef={fileInputRef}
            isLocked={isQRLocked}
          />

          <QRScannerModal
            isOpen={!!showReportDateScanner}
            reportId={showReportDateScanner}
            onClose={() => { stopScanner(); setShowReportDateScanner(null); }}
            scannerElementId={showReportDateScanner ? `report-date-scanner-${showReportDateScanner}` : ""}
            onUploadQRClick={() => scannerUploadInputRef.current?.click()}
            onFlashToggle={toggleScannerFlash}
            flashOn={scannerFlashOn}
          />
          <input
            type="file"
            accept="image/*"
            ref={scannerUploadInputRef}
            className="hidden"
            aria-hidden
            onChange={(e) => { if (showReportDateScanner) handleQRCodeFileUpload(e, showReportDateScanner); e.target.value = ""; }}
          />

          {[
            { type: "initial", isOpen: editImagesModal.isOpen && editImagesModal.type === "initial", color: "blue", uploadType: "initial" },
            { type: "received", isOpen: editImagesModal.isOpen && editImagesModal.type === "received", color: "yellow", uploadType: "received" },
            { type: "completion", isOpen: editImagesModal.isOpen && editImagesModal.type === "completion", color: "green", uploadType: "completion" },
          ].map(({ type, isOpen, color, uploadType }) => (
            <EditImagesModal
              key={type}
              isOpen={isOpen}
              onClose={() => { closeEditImagesModal(); setEditImages([]); setEditNotes(""); }}
              title={`Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Images - ${editImagesModal.report?.ymStyle || "N/A"}`}
              images={editImagesModal.images}
              notes={editImagesModal.notes}
              onNotesChange={setEditNotes}
              onRemoveImage={handleRemoveEditImage}
              onUploadImage={(files) => handleEditImageUpload(files, uploadType)}
              onSave={handleUpdateImages}
              isSaving={editImagesModal.isUpdating}
              saveButtonColor={color}
            />
          ))}

          <ImageViewerModal
            isOpen={imageViewer.isOpen}
            imageUrl={imageViewer.imageUrl}
            imageTitle={imageViewer.imageTitle}
            images={imageViewer.images}
            currentIndex={imageViewer.currentIndex}
            rotation={imageViewer.rotation}
            zoom={imageViewer.zoom}
            panX={imageViewer.panX}
            panY={imageViewer.panY}
            isDragging={imageViewer.isDragging}
            onClose={closeImageViewer}
            onNextImage={goToNextImage}
            onPreviousImage={goToPreviousImage}
            onRotate={rotateImageViewer}
            onZoom={zoomImageViewer}
            onPanStart={handleImageMouseDown}
            onPanMove={handleImageMouseMove}
            onPanEnd={handleImageMouseUp}
            onToggleZoom={toggleZoom}
            onDownload={downloadImageViewer}
          />

          {/* Size follow-up dialog — shown after multi-size Home Wash submissions */}
          <SizeFollowUpModal
            isOpen={sizeFollowUpModal.isOpen}
            sizes={sizeFollowUpModal.sizes}
            ymStyle={sizeFollowUpModal.ymStyle}
            colors={sizeFollowUpModal.colors}
            onClose={closeSizeFollowUpModal}
          />
        </div>
      </div>
    </div>
  );
};

export default LaundryWashingMachineTest;
