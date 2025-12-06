import toast from "react-hot-toast";

/**
 * Centralized Toast Notification Utility
 * 
 * This utility provides easy-to-use toast notification functions
 * that can be imported and used from any component in the application.
 * 
 * Usage:
 *   import { showToast } from '../utils/toast';
 *   showToast.success('Operation successful!');
 *   showToast.error('Something went wrong');
 *   showToast.info('Information message');
 *   showToast.warning('Warning message');
 */

/**
 * Toast configuration - defined once, used everywhere
 * This config is used by the Toaster component in App.jsx
 */
export const toastConfig = {
  duration: 3000,
  style: {
    background: '#363636',
    color: '#fff',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '14px',
  },
  success: {
    duration: 2000,
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  },
  error: {
    duration: 3000,
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  },
  info: {
    duration: 3000,
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#fff',
    },
  },
  warning: {
    duration: 3000,
    iconTheme: {
      primary: '#f59e0b',
      secondary: '#fff',
    },
  },
};

/**
 * Show a success toast notification
 * Note: Styles are inherited from Toaster component in App.jsx
 * @param {string} message - The message to display
 * @param {object} options - Optional custom options to override defaults
 */
export const showSuccess = (message, options = {}) => {
  return toast.success(message, options);
};

/**
 * Show an error toast notification
 * Note: Styles are inherited from Toaster component in App.jsx
 * @param {string} message - The message to display
 * @param {object} options - Optional custom options to override defaults
 */
export const showError = (message, options = {}) => {
  return toast.error(message, options);
};

/**
 * Show an info toast notification
 * Note: Styles are inherited from Toaster component in App.jsx
 * @param {string} message - The message to display
 * @param {object} options - Optional custom options to override defaults
 */
export const showInfo = (message, options = {}) => {
  return toast(message, {
    ...toastConfig.info,
    ...options,
  });
};

/**
 * Show a warning toast notification
 * Note: Styles are inherited from Toaster component in App.jsx
 * @param {string} message - The message to display
 * @param {object} options - Optional custom options to override defaults
 */
export const showWarning = (message, options = {}) => {
  return toast(message, {
    ...toastConfig.warning,
    ...options,
  });
};

/**
 * Show a loading toast notification
 * @param {string} message - The message to display
 * @param {object} options - Optional custom options
 * @returns {string} - Toast ID for dismissing
 */
export const showLoading = (message = "Loading...", options = {}) => {
  return toast.loading(message, options);
};

/**
 * Dismiss a specific toast by ID
 * @param {string} toastId - The toast ID to dismiss
 */
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

/**
 * Dismiss all toasts
 */
export const dismissAll = () => {
  toast.dismiss();
};

/**
 * Main export object with all toast functions
 */
const showToast = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  loading: showLoading,
  dismiss: dismissToast,
  dismissAll: dismissAll,
};

export default showToast;

