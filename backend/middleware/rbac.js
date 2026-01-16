/**
 * RBAC Middleware for Glossary System
 * Provides role-based access control for glossary operations
 */

// Role hierarchy
export const ROLES = {
    USER: 1,      // Can view terms only
    EXPERT: 2,    // Can mine, edit, verify terms
    ADMIN: 3      // Full access including delete
};

/**
 * Middleware to check if user has minimum required role
 * @param {number} minRole - Minimum role level required
 * @returns {Function} Express middleware
 */
export const requireRole = (minRole) => (req, res, next) => {
    // Get user role from request (set by auth middleware)
    // Default to EXPERT for development/testing
    const userRole = req.user?.role || ROLES.EXPERT;

    if (userRole < minRole) {
        const roleName = Object.keys(ROLES).find(k => ROLES[k] === minRole);
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: `This action requires ${roleName} role or higher`
        });
    }
    next();
};

/**
 * Helper to check if user is at least an expert
 */
export const isExpert = (req) => {
    return (req.user?.role || ROLES.EXPERT) >= ROLES.EXPERT;
};

/**
 * Helper to check if user is admin
 */
export const isAdmin = (req) => {
    return (req.user?.role || ROLES.EXPERT) >= ROLES.ADMIN;
};

/**
 * Get reviewer name from request
 * Used for audit trail
 */
export const getReviewerName = (req) => {
    return req.user?.name || req.body?.reviewerName || 'anonymous';
};

export default { ROLES, requireRole, isExpert, isAdmin, getReviewerName };
