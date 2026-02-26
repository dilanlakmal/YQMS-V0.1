import { create } from "zustand";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config.js";
import showToast from "../../../../utils/toast.js";

/**
 * Compute isAdminUser / isWarehouseUser from the current user and assign history.
 * Exported so any component can derive roles without receiving them as props.
 */
export const computeUserRoles = (user, causeAssignHistory = []) => {
    if (!user) return { isAdminUser: false, isWarehouseUser: false };

    const activeAssign = causeAssignHistory.length > 0 ? causeAssignHistory[0] : null;

    const isAdminUser =
        user.emp_id === "TYM055" ||
        user.role === "admin" ||
        user.role === "super_admin" ||
        user.role === "user_admin" ||
        (activeAssign && String(user.emp_id) === String(activeAssign.admin));

    const warehouseAssignment = causeAssignHistory.find(
        (assign) =>
            assign.userWarehouse &&
            String(user.emp_id) === String(assign.userWarehouse)
    );

    const isWarehouseUser =
        !!warehouseAssignment &&
        String(user.emp_id) === String(warehouseAssignment.userWarehouse) &&
        !isAdminUser;

    return { isAdminUser, isWarehouseUser };
};

/**
 * Zustand store for assign-control data and user list.
 * Replaces 5 useState hooks in LaunchWashingMachineTest and the 34-line
 * useEffect that wired up polling + initial fetch.
 */
export const useAssignControlStore = create((set, get) => ({
    users: [],
    isLoadingUsers: false,
    causeAssignHistory: [],
    _currentUser: null,
    setCurrentUser: (user) => set({ _currentUser: user }),

    fetchAssignControl: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/assign-control`);
            if (response.data && Array.isArray(response.data)) {
                set({ causeAssignHistory: response.data });
            }
        } catch (error) {
            console.error("Error fetching assign control:", error);
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
}));
