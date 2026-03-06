import { create } from "zustand";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";

// ─── Helper: extract emp_id list from a role_management doc ──────────────────
const getUsersForRole = (washingRoles, roleName) => {
    const doc = washingRoles.find(r => r.role === roleName);
    return doc?.users || [];
};

/**
 * Compute isAdminUser / isWarehouseUser / isReporterUser / isSystemAdmin
 * entirely from role_management data (washingRoles).
 *
 * `causeAssignHistory` kept in signature for backward compat (ignored now).
 * `adminUsers` kept in signature for backward compat (ignored now — merged into washingRoles).
 */
export const computeUserRoles = (user, causeAssignHistory = [], adminUsers = [], washingRoles = []) => {
    if (!user) return { isAdminUser: false, isWarehouseUser: false, isReporterUser: false, isSystemAdmin: false };

    const empId = String(user.emp_id || "");

    // Helper: check if user is in a given role's users array
    const isInRole = (roleName) => {
        const roleUsers = getUsersForRole(washingRoles, roleName);
        return roleUsers.some(u => String(u.emp_id) === empId);
    };

    // Helper to check user.role / user.roles (local JWT role)
    const hasLocalRole = (roleName) => {
        const uRole = (user.role || "").toLowerCase();
        const uRoles = Array.isArray(user.roles) ? user.roles.map(r => r.toLowerCase()) : [];
        const target = roleName.toLowerCase();
        return uRole === target || uRoles.includes(target);
    };

    // System admins: in role_management "Admin" or "Super Admin" OR has a local admin role
    const isSystemAdmin =
        isInRole("Admin") ||
        isInRole("Super Admin") ||
        hasLocalRole("super_admin") ||
        hasLocalRole("user_admin") ||
        hasLocalRole("admin") ||
        hasLocalRole("super admin") ||
        hasLocalRole("superadmin");

    // Reporter: in role_management "Reporter"
    const isReporterUser = isInRole("Reporter");

    // Warehouse: in role_management "User Warehouse" (and NOT system admin — admin sees all tabs anyway)
    const isWarehouseUser = isInRole("User Warehouse") && !isSystemAdmin;

    // Admin privileges => same as isSystemAdmin
    const isAdminUser = isSystemAdmin;

    return { isAdminUser, isWarehouseUser, isReporterUser, isSystemAdmin };
};

/**
 * Zustand store for assign-control data and user list.
 *
 * Now fetches roles from role_management via /api/assign-control/washing-roles.
 * The old causeAssignHistory (from report_assign_control) is still fetched
 * for backward compat with old Assign Control tab but is NOT used for
 * role checks anymore.
 */
export const useAssignControlStore = create((set, get) => ({
    users: [],
    isLoadingUsers: false,
    causeAssignHistory: [],  // Kept for backward compat (old assign control tab)
    adminUsers: [],          // Kept for backward compat
    washingRoles: [],        // NEW: all washing-relevant roles from role_management
    _currentUser: null,
    setCurrentUser: (user) => set({ _currentUser: user }),

    fetchAssignControl: async () => {
        try {
            // Fetch washing-relevant roles from role_management
            const response = await axios.get(`${API_BASE_URL}/api/report-washing/washing-roles`);

            if (response.data && Array.isArray(response.data)) {
                // Store full roles array
                set({ washingRoles: response.data });
                // Also set adminUsers for backward compat (filter Admin/Super Admin)
                const admins = response.data.filter(r => r.role === "Admin" || r.role === "Super Admin");
                set({ adminUsers: admins });
            }
        } catch (error) {
            console.error("Error fetching washing roles:", error);
        }
    },

    fetchUsers: async () => {
        set({ isLoadingUsers: true });
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            if (response.data) {
                set({ users: response.data });
            }
        } catch (error) {
            console.error("Error fetching users:", error);
            showToast.error("Failed to load users list");
        } finally {
            set({ isLoadingUsers: false });
        }
    },

    // ─── Helpers to get users for a specific washing role ────────────────
    getUsersForWashingRole: (roleName) => {
        const { washingRoles } = get();
        return getUsersForRole(washingRoles, roleName);
    },
}));
