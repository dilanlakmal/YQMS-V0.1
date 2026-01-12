/**
 * Washing Machine Testing Module - Main Export File
 * 
 * This file serves as the central export point for the entire washing testing module.
 * Import from this file to access components, hooks, services, helpers, and constants.
 * 
 * @example
 * import { 
 *   FormSection, 
 *   useReports, 
 *   fetchReportsAPI,
 *   IMAGE_LIMITS 
 * } from '../components/inspection/WashingTesting/lib';
 */

// =============================================================================
// COMPONENTS - UI Components
// =============================================================================

// Main Components
export { default as FormSection } from '../FormSection';
export { default as ReportsList } from '../ReportsList';
export { default as ReportCard } from '../ReportCard';
export { default as ReportTimeline } from '../ReportTimeline';

// Modal Components
export { default as ImageViewerModal } from '../washing-modal/ImageViewerModal';
export { default as ReceivedModal } from '../washing-modal/ReceivedModal';
export { default as CompletionModal } from '../washing-modal/CompletionModal';
export { default as EditReportModal } from '../washing-modal/EditReportModal';
export { default as QRCodeModal } from '../washing-modal/QRCodeModal';
export { default as QRScannerModal } from '../washing-modal/QRScannerModal';
export { default as DeleteConfirmationModal } from '../washing-modal/DeleteConfirmationModal';
export { default as EditImagesModal } from '../washing-modal/EditImagesModal';

// =============================================================================
// HOOKS - Custom React Hooks
// =============================================================================

export { useFormState } from '../hooks/useFormState';
export { useImageHandling } from '../hooks/useImageHandling';
export { useImageViewer } from '../hooks/useImageViewer';
export { useOrderData } from '../hooks/useOrderData';
export { useQRCode } from '../hooks/useQRCode';
export { useReports } from '../hooks/useReports';
export { useReportSubmission } from '../hooks/useReportSubmission';

// =============================================================================
// SERVICES - API Layer
// =============================================================================

export * from '../services';

// =============================================================================
// HELPERS - Utility Functions
// =============================================================================

export * from '../helpers';

// =============================================================================
// HANDLERS - Event Handlers and Business Logic
// =============================================================================

export * from '../handlers';

// =============================================================================
// CONSTANTS - Configuration Values
// =============================================================================

export * from '../constants';

// =============================================================================
// UTILS - Legacy Utilities
// =============================================================================

export * from '../utils';
