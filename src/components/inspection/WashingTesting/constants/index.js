/**
 * Constants for Washing Machine Testing Module
 * Centralized configuration values and constants
 */

// Image upload limits
export const IMAGE_LIMITS = {
    INITIAL: 5,
    RECEIVED: 5,
    COMPLETION: 5,
};

// Form validation rules
export const VALIDATION_RULES = {
    MIN_ORDER_NO_LENGTH: 2,
    MIN_YM_STYLE_LENGTH: 3,
    AUTO_FETCH_DELAY: 800, // milliseconds
    DEBOUNCE_DELAY: 500, // milliseconds
};

// QR Scanner configuration
export const QR_SCANNER_CONFIG = {
    FPS: 10,
    QR_BOX_SIZE: { width: 250, height: 250 },
};

// Tab names
export const TABS = {
    FORM: 'form',
    REPORTS: 'reports',
};

// Status types
export const STATUS_TYPES = {
    PENDING: 'pending',
    RECEIVED: 'received',
    COMPLETED: 'completed',
};

// Image types
export const IMAGE_TYPES = {
    INITIAL: 'initial',
    RECEIVED: 'received',
    COMPLETION: 'completion',
};

// Default pagination
export const DEFAULT_PAGINATION = {
    PAGE: 1,
    LIMIT: 10,
};

// File types
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Date formats
export const DATE_FORMATS = {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'DD/MM/YYYY',
};
