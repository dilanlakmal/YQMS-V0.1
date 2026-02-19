import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Select } from 'antd';
import './GameAssignControl.css';
import showToast from '../../../../utils/toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// SVG Icons - Memoized to prevent re-renders
const TargetIcon = React.memo(() => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
));

const HandIcon = React.memo(() => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 11V6C9 4.89543 9.89543 4 11 4C12.1046 4 13 4.89543 13 6V11M13 11V4C13 2.89543 13.8954 2 15 2C16.1046 2 17 2.89543 17 4V11M13 11V8C13 6.89543 13.8954 6 15 6C16.1046 6 17 6.89543 17 8V11M17 11V9C17 7.89543 17.8954 7 19 7C20.1046 7 21 7.89543 21 9V15C21 18.866 17.866 22 14 22H12C8.13401 22 5 18.866 5 15V12C5 10.8954 5.89543 10 7 10C8.10457 10 9 10.8954 9 12V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
));

const DownArrowIcon = React.memo(() => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
));

const CheckIcon = React.memo(() => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
));

const TrashIcon = React.memo(() => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6V4C8 3.46957 8.21071 3 8.58579 2.62563C8.96086 2.25126 9.46957 2.04095 10 2.04095H14C14.5304 2.04095 15.0391 2.25126 15.4142 2.62563C15.7893 3 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
));

const LeftArrowIcon = React.memo(() => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
));

const RightArrowIcon = React.memo(() => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
));

// Bucket colors configuration - moved outside component to prevent recreation
const BUCKET_COLORS = {
    prepared: { primary: '#FF6B6B', secondary: '#FF8E53', name: 'Prepared' },
    checked: { primary: '#4ECDC4', secondary: '#44A08D', name: 'Checked' },
    approved: { primary: '#45B7D1', secondary: '#5F27CD', name: 'Approved' },
    admin: { primary: '#F093FB', secondary: '#F5576C', name: 'Admin' },
    userWarehouse: { primary: '#FFA726', secondary: '#FB8C00', name: 'Warehouse' }
};

const GameAssignControl = ({ socket, user }) => {
    const [users, setUsers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState('');

    const [draggedUser, setDraggedUser] = useState(null);
    const [dropTargets, setDropTargets] = useState({
        prepared: null,
        checked: null,
        approved: null,
        admin: null,
        userWarehouse: null
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverTarget, setDragOverTarget] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successBucket, setSuccessBucket] = useState(null); // For success animation

    const [currentAssignment, setCurrentAssignment] = useState({
        preparedBy: null,
        checkedBy: null,
        approvedBy: null,
        admin: null,
        userWarehouse: null
    });

    const [activeAssignmentId, setActiveAssignmentId] = useState(null);
    // Use ref to prevent race conditions when dropping multiple bubbles quickly
    const activeAssignmentIdRef = useRef(null);

    const scrollContainerRef = useRef(null);

    const scrollLeft = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    }, []);

    const scrollRight = useCallback(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    }, []);



    // Memoized socket event handlers to prevent recreation on every render
    const handleAssignmentCreated = useCallback((assignment) => {
        setAssignments(prev => [assignment, ...prev]);
    }, []);

    const handleAssignmentUpdated = useCallback((assignment) => {
        setAssignments(prev =>
            prev.map(a => a._id === assignment._id ? assignment : a)
        );
    }, []);

    const handleAssignmentDeleted = useCallback(({ id }) => {
        setAssignments(prev => prev.filter(a => a._id !== id));
    }, []);







    // Memoize getUserName helper to prevent recreation
    const getUserName = useCallback((userId) => {
        if (!userId) return null;
        const user = users.find(u => (u.emp_id || u.name) === userId);
        return user ? (user.name || user.eng_name || userId) : userId;
    }, [users]);

    const submitAssignment = useCallback(async (targets = dropTargets) => {
        setIsSubmitting(true);

        try {
            const payload = {
                preparedBy: targets.prepared,
                preparedByName: getUserName(targets.prepared),
                checkedBy: targets.checked,
                checkedByName: getUserName(targets.checked),
                approvedBy: targets.approved,
                approvedByName: getUserName(targets.approved),
                admin: targets.admin,
                adminName: getUserName(targets.admin),
                userWarehouse: targets.userWarehouse,
                userWarehouseName: getUserName(targets.userWarehouse),
                updatedBy: user?.emp_id || user?.name || selectedUser || 'System'
            };

            // Use ref to check current ID (prevents race conditions)
            const currentId = activeAssignmentIdRef.current;

            // Clear logic: If we have an activeAssignmentId, UPDATE it. Otherwise, CREATE new.
            if (currentId) {
                // UPDATE existing assignment using PUT endpoint
                console.log(`[Frontend] UPDATING assignment ID: ${currentId}`);
                await axios.put(
                    `${API_BASE_URL}/api/assign-control/${currentId}`,
                    payload
                );
                showToast.success('✓ Assignment updated!');

            } else {
                // CREATE new assignment using POST endpoint
                console.log('[Frontend] CREATING new assignment');
                const response = await axios.post(`${API_BASE_URL}/api/assign-control`, payload);

                // Set the newly created assignment as active for future updates
                if (response.data && response.data._id) {
                    const newId = response.data._id;
                    console.log(`[Frontend] New assignment created with ID: ${newId}`);

                    // Update BOTH state and ref immediately
                    activeAssignmentIdRef.current = newId;
                    setActiveAssignmentId(newId);
                }
                showToast.success('✓ New assignment created!');
            }

        } catch (error) {
            console.error('[Frontend] Error submitting assignment:', error);
            showToast.error('Failed to save assignment');
        } finally {
            setIsSubmitting(false);
        }
    }, [dropTargets, getUserName, selectedUser, user?.emp_id, user?.name]);

    const resetForm = useCallback(() => {
        setDropTargets({
            prepared: null,
            checked: null,
            approved: null,
            admin: null,
            userWarehouse: null
        });
        setCurrentAssignment({
            preparedBy: null,
            checkedBy: null,
            approvedBy: null,
            admin: null,
            userWarehouse: null
        });
        setSelectedUser(null);
        setSelectedUserName('');

        // Reset BOTH state and ref
        activeAssignmentIdRef.current = null;
        setActiveAssignmentId(null);
    }, []);

    const handleLoadAssignment = useCallback((assignment) => {
        // Create a copy of the assignment data - DO NOT convert IDs to names here
        // as we need the IDs for the dropTargets to work correctly with searching
        const safeAssignment = {
            preparedBy: typeof assignment.preparedBy === 'object' ? (assignment.preparedBy?.emp_id || assignment.preparedBy?._id) : assignment.preparedBy,
            checkedBy: typeof assignment.checkedBy === 'object' ? (assignment.checkedBy?.emp_id || assignment.checkedBy?._id) : assignment.checkedBy,
            approvedBy: typeof assignment.approvedBy === 'object' ? (assignment.approvedBy?.emp_id || assignment.approvedBy?._id) : assignment.approvedBy,
            admin: typeof assignment.admin === 'object' ? (assignment.admin?.emp_id || assignment.admin?._id) : assignment.admin,
            userWarehouse: typeof assignment.userWarehouse === 'object' ? (assignment.userWarehouse?.emp_id || assignment.userWarehouse?._id) : assignment.userWarehouse,
            updatedBy: typeof assignment.updatedBy === 'object' ? (assignment.updatedBy?.emp_id || assignment.updatedBy?._id) : assignment.updatedBy,
            _id: assignment._id
        };

        // Set this as the active assignment for updates (both state and ref)
        activeAssignmentIdRef.current = safeAssignment._id;
        setActiveAssignmentId(safeAssignment._id);

        // Load assignment values into buckets
        setDropTargets({
            prepared: safeAssignment.preparedBy,
            checked: safeAssignment.checkedBy,
            approved: safeAssignment.approvedBy,
            admin: safeAssignment.admin,
            userWarehouse: safeAssignment.userWarehouse
        });
        setCurrentAssignment({
            preparedBy: safeAssignment.preparedBy,
            checkedBy: safeAssignment.checkedBy,
            approvedBy: safeAssignment.approvedBy,
            admin: safeAssignment.admin,
            userWarehouse: safeAssignment.userWarehouse
        });

        // Sync SELECT USER dropdown with the loaded assignment so it shows who the assignment is for
        const firstUserId = safeAssignment.checkedBy || safeAssignment.approvedBy || safeAssignment.preparedBy || safeAssignment.admin || safeAssignment.userWarehouse;
        if (firstUserId) {
            // Use the same value format as userOptions (emp_id or name) so the Select displays correctly
            const matchedUser = users.find(u => (u.emp_id || u.name) === firstUserId || String(u.emp_id) === String(firstUserId));
            const valueToSet = matchedUser ? (matchedUser.emp_id || matchedUser.name) : firstUserId;
            setSelectedUser(valueToSet);
            setSelectedUserName(getUserName(valueToSet) || valueToSet);
        } else {
            setSelectedUser(null);
            setSelectedUserName('');
        }
    }, [users, getUserName]);

    const fetchUsers = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast.error('Failed to load users');
        }
    }, []);

    const fetchAssignments = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/assign-control`);
            const data = Array.isArray(response.data)
                ? response.data
                : response.data.assignments || [];

            setAssignments(data);

            // Default to the latest assignment if available
            /*
            if (data.length > 0) {
                // Ensure we call handleLoadAssignment to populate state fully
                // Need to defer this slightly or ensure render order? No, plain set is fine.
                // But handleLoadAssignment depends on users potentially? No, it just sets IDs.
                handleLoadAssignment(data[0]);
            }
            */
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
    }, [handleLoadAssignment]);

    const updateCurrentAssignment = useCallback((assignment) => {
        setCurrentAssignment({
            preparedBy: assignment.preparedBy,
            checkedBy: assignment.checkedBy,
            approvedBy: assignment.approvedBy,
            admin: assignment.admin,
            userWarehouse: assignment.userWarehouse
        });
        setDropTargets({
            prepared: assignment.preparedBy,
            checked: assignment.checkedBy,
            approved: assignment.approvedBy,
            admin: assignment.admin,
            userWarehouse: assignment.userWarehouse
        });
    }, []);

    const handleUserSelect = useCallback((value) => {
        setSelectedUser(value);
        if (!value) {
            setSelectedUserName('');
            return;
        }
        const user = users.find(u => (u.emp_id || u.name) === value);
        if (user) {
            const name = user.name || user.eng_name || value;
            // Show only name in bubble
            setSelectedUserName(name);
        }

        // Check if this user already has an existing assignment
        // ONLY jump if we are not currently editing a record
        if (!activeAssignmentIdRef.current) {
            const existingAssignment = assignments.find(assignment =>
                assignment.preparedBy === value ||
                assignment.checkedBy === value ||
                assignment.approvedBy === value ||
                assignment.admin === value ||
                assignment.userWarehouse === value
            );

            if (existingAssignment) {
                // User already has a record - load it automatically
                handleLoadAssignment(existingAssignment);
            }
        }
    }, [users, assignments, handleLoadAssignment]);

    const handleDragStart = useCallback((e) => {
        if (!selectedUser) return;
        setDraggedUser(selectedUser);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', selectedUser);
    }, [selectedUser]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setDragOverTarget(null);
    }, []);

    const handleDragOver = useCallback((e, target) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverTarget(target);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOverTarget(null);
    }, []);

    const handleDrop = useCallback(async (e, target) => {
        e.preventDefault();
        const userId = e.dataTransfer.getData('text/plain');

        if (!userId) return;

        // Prevent concurrent drops (race condition protection)
        if (isSubmitting) {
            console.log('[Frontend] Drop ignored - submission in progress');
            return;
        }

        // Mutual exclusion: admin and userWarehouse cannot both have a value
        let newTargets = { ...dropTargets, [target]: userId };
        if (target === 'admin') {
            newTargets.userWarehouse = null;
        } else if (target === 'userWarehouse') {
            newTargets.admin = null;
        }
        setDropTargets(newTargets);
        setDragOverTarget(null);
        setIsDragging(false);

        // Show success animation
        setSuccessBucket(target);
        setTimeout(() => setSuccessBucket(null), 1000);

        // Auto-submit
        await submitAssignment(newTargets);

        // Keep the user selected for multiple assignments 
        // (lines removed to prevent auto-clearing)
    }, [dropTargets, isSubmitting]);



    const handleClearBucket = useCallback((bucket) => {
        const newTargets = { ...dropTargets, [bucket]: null };
        setDropTargets(newTargets);
        submitAssignment(newTargets);
    }, [dropTargets]);



    const handleClearAll = useCallback(() => {
        if (isSubmitting) return;

        if (activeAssignmentId) {
            setDeleteConfirmation({ isOpen: true, id: activeAssignmentId });
        } else {
            resetForm();
        }
    }, [activeAssignmentId, resetForm, isSubmitting]);


    // Memoize user options to prevent recalculation on every render
    const userOptions = useMemo(() => {
        return users.map(user => {
            const id = user.emp_id;
            const name = user.name || user.eng_name || 'Unknown';
            return {
                value: id || name,
                label: id ? `(${id}) ${name}` : name,
                key: user._id || id || name
            };
        });
    }, [users]);

    // Memoize getDisplayName to prevent recalculation
    const getDisplayName = useCallback((value, nameField = null) => {
        // If we have the name field directly, use it
        if (nameField) return nameField;

        if (!value) return '-';
        if (typeof value === 'object') return value.name || value.eng_name || '-';

        // Convert to string for comparison (handles both string and number emp_ids)
        const valueStr = String(value);

        // Try to find user by emp_id or name
        const user = users.find(u => {
            const empId = u.emp_id ? String(u.emp_id) : null;
            const name = u.name || u.eng_name;
            return empId === valueStr || name === valueStr;
        });

        if (user) {
            return user.name || user.eng_name || value;
        } else {
            // If we can't find the user, just return the value
            // (This handles cases where users are deleted)
            return value;
        }
    }, [users]);

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null });

    const handleDeleteAssignment = useCallback((e, id) => {
        e.stopPropagation();
        setDeleteConfirmation({ isOpen: true, id });
    }, []);

    const confirmDelete = useCallback(async () => {
        const id = deleteConfirmation.id;
        if (!id) return;

        try {
            await axios.delete(`${API_BASE_URL}/api/assign-control/${id}`);
            showToast.success('Assignment deleted');

            // If we deleted the active assignment, clear the board
            if (activeAssignmentId === id) {
                resetForm();
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            showToast.error('Failed to delete assignment');
        } finally {
            setDeleteConfirmation({ isOpen: false, id: null });
        }
    }, [deleteConfirmation.id, activeAssignmentId, resetForm]);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join:assignments');

        socket.on('assignment:created', handleAssignmentCreated);
        socket.on('assignment:updated', handleAssignmentUpdated);
        socket.on('assignment:deleted', handleAssignmentDeleted);

        return () => {
            socket.off('assignment:created', handleAssignmentCreated);
            socket.off('assignment:updated', handleAssignmentUpdated);
            socket.off('assignment:deleted', handleAssignmentDeleted);
        };
    }, [socket, handleAssignmentCreated, handleAssignmentUpdated, handleAssignmentDeleted]);

    useEffect(() => {
        fetchUsers();
        fetchAssignments();
    }, [fetchUsers, fetchAssignments]);

    // Filter assignments based on user role
    const filteredAssignments = useMemo(() => {
        if (!user || !assignments.length) return [];

        // Admin sees all
        // Check both role AND specific admin IDs
        if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'user_admin' || user.emp_id === 'TYM055') {
            return assignments;
        }

        // Regular users see only assignments where they are involved OR where they performed the update
        const userId = user.emp_id;
        const userName = user.name || user.eng_name;

        return assignments.filter(assignment => {
            // Check if user ID or Name matches any role field
            // Helper to check a field
            const checkField = (fieldValue) => {
                if (!fieldValue) return false;
                // Field value could be object or string/number
                const val = typeof fieldValue === 'object' ? (fieldValue.emp_id || fieldValue.name) : fieldValue;
                return String(val) === String(userId) || String(val) === String(userName);
            };

            return (
                checkField(assignment.preparedBy) ||
                checkField(assignment.checkedBy) ||
                checkField(assignment.approvedBy) ||
                checkField(assignment.admin) ||
                checkField(assignment.userWarehouse) ||
                checkField(assignment.updatedBy) // This should cover the creator/updater
            );
        });
    }, [assignments, user]);

    return (
        <div className="game-assign-control-compact1">
            {/* Floating Background Bubbles */}
            <div className="background-bubble" />
            <div className="background-bubble" />
            <div className="background-bubble" />

            {/* Main Game Container - Everything in One View */}
            <div className="game-container">

                {/* Left Side: User Selection & Draggable Bubble */}
                <motion.div
                    className="left-panel"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="game-title">Bubble Assignment</h2>

                    {/* User Selection */}
                    <div className="select-section">
                        <label className="select-label">SELECT USER:</label>
                        <Select
                            showSearch
                            placeholder="Select User"
                            optionFilterProp="label"
                            value={selectedUser}
                            onChange={handleUserSelect}
                            options={userOptions}
                            className="user-select-compact"
                            size="large"
                            allowClear
                            disabled={!!activeAssignmentId || isSubmitting}
                        />
                    </div>

                    {/* Draggable Bubble */}
                    <AnimatePresence>
                        {selectedUser && (
                            <motion.div
                                className="bubble-zone"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                            >
                                <div className="bubble-label">DRAG TO BUCKET →</div>
                                <motion.div
                                    className={`game-bubble ${isDragging ? 'dragging' : ''}`}
                                    draggable
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    animate={{
                                        y: [0, -8, 0],
                                        rotate: [0, 2, -2, 0]
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                >
                                    <div className="bubble-shine" />
                                    <div className="bubble-icon">
                                        <HandIcon />
                                    </div>
                                    <div className="bubble-user">{selectedUserName}</div>
                                </motion.div>

                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Control Buttons Container */}
                    <div className="actions-group">
                        {/* New / Reset View Button - Shown only when editing to allow unlocking 'Search' */}
                        {activeAssignmentId && (
                            <motion.button
                                className="new-btn"
                                onClick={resetForm}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                New Assignment
                            </motion.button>
                        )}

                        {/* Clear All - Delete Record button hidden per requirement */}
                        {!activeAssignmentId && (
                            <motion.button
                                className="clear-btn"
                                onClick={handleClearAll}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                🧹 Clear All
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Right Side: Drop Buckets (Horizontal) */}
                <motion.div
                    className="right-panel"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h3 className="buckets-title">DROP ZONES</h3>
                    <div className="buckets-row">
                        {Object.entries(BUCKET_COLORS).map(([key, color]) => (
                            <motion.div
                                key={key}
                                className={`bucket ${dragOverTarget === key ? 'active' : ''} ${dropTargets[key] ? 'filled' : ''} ${successBucket === key ? 'success' : ''}`}
                                onDragOver={(e) => handleDragOver(e, key)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, key)}
                                style={{
                                    background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`
                                }}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + Object.keys(BUCKET_COLORS).indexOf(key) * 0.1 }}
                            >
                                <div className="bucket-top">
                                    <div className="bucket-name">{color.name}</div>
                                </div>

                                <AnimatePresence mode="wait">
                                    {dropTargets[key] ? (
                                        <motion.div
                                            className="bucket-filled"
                                            initial={{ scale: 0, rotate: -180 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0, rotate: 180 }}
                                        >
                                            <div
                                                className="filled-bubble"
                                                onClick={() => {
                                                    handleUserSelect(dropTargets[key]);
                                                    // showToast.success('User picked up!');
                                                }}
                                                style={{ cursor: 'pointer' }}
                                                title="Click to pick up user"
                                            >
                                                <div className="filled-shine" />
                                                <div className="filled-check">
                                                    <CheckIcon />
                                                </div>
                                                <div className="filled-user">
                                                    {getDisplayName(dropTargets[key])}
                                                </div>
                                            </div>
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleClearBucket(key)}
                                            >
                                                ✕
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            className="bucket-empty"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <div className="empty-icon">
                                                <DownArrowIcon />
                                            </div>
                                            <div className="empty-text">Drop Here</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Assignment History - Compact Horizontal */}
            {
                filteredAssignments.length > 0 && (
                    <motion.div
                        className="history-compact"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h4 className="history-title">Recent Assignments</h4>

                        <div className="history-scroll-wrapper">
                            {/* Only show scroll buttons if there are more than 5 assignments */}
                            <button
                                className="scroll-btn left"
                                onClick={scrollLeft}
                                aria-label="Scroll Left"
                                style={{ display: filteredAssignments.length > 5 ? 'flex' : 'none' }}
                            >
                                <LeftArrowIcon />
                            </button>

                            <div className="history-scroll" ref={scrollContainerRef}>
                                {filteredAssignments.map((assignment, index) => (
                                    <motion.div
                                        key={assignment._id}
                                        className="history-card"
                                        onClick={() => handleLoadAssignment(assignment)}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 + index * 0.05 }}
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {/* Delete Button */}
                                        <button
                                            className="assignment-delete-btn"
                                            onClick={(e) => handleDeleteAssignment(e, assignment._id)}
                                            title="Delete Assignment"
                                        >
                                            <TrashIcon />
                                        </button>

                                        <div className="history-time">
                                            {new Date(assignment.updatedAt).toLocaleTimeString()}
                                            {activeAssignmentId === assignment._id && <span className="active-dot" style={{ marginLeft: 'auto', color: '#4ECDC4' }}>●</span>}
                                        </div>
                                        <div className="history-badges">
                                            <span className="badge prepared">{getDisplayName(assignment.preparedBy, assignment.preparedByName)}</span>
                                            <span className="badge checked">{getDisplayName(assignment.checkedBy, assignment.checkedByName)}</span>
                                            <span className="badge approved">{getDisplayName(assignment.approvedBy, assignment.approvedByName)}</span>
                                            <span className="badge admin">{getDisplayName(assignment.admin, assignment.adminName)}</span>
                                            <span className="badge userWarehouse">{getDisplayName(assignment.userWarehouse, assignment.userWarehouseName)}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Only show scroll buttons if there are more than 5 assignments */}
                            <button
                                className="scroll-btn right"
                                onClick={scrollRight}
                                aria-label="Scroll Right"
                                style={{ display: filteredAssignments.length > 5 ? 'flex' : 'none' }}
                            >
                                <RightArrowIcon />
                            </button>
                        </div>
                    </motion.div>
                )
            }

            {/* Custom Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirmation.isOpen && (
                    <motion.div
                        className="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 100,
                            backdropFilter: 'blur(5px)'
                        }}
                        onClick={() => setDeleteConfirmation({ isOpen: false, id: null })}
                    >
                        <motion.div
                            className="delete-modal"
                            initial={{ scale: 0.8, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'white',
                                padding: '24px',
                                borderRadius: '16px',
                                width: '90%',
                                maxWidth: '320px',
                                textAlign: 'center',
                                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                                border: '1px solid rgba(0,0,0,0.1)'
                            }}
                        >
                            <div style={{
                                width: '60px',
                                height: '60px',
                                background: '#fee2e2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                                color: '#ef4444'
                            }}>
                                <TrashIcon />
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#1f2937' }}>Delete Assignment?</h3>
                            <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280' }}>
                                Are you sure you want to remove this assignment history?
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDeleteConfirmation({ isOpen: false, id: null })}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        background: 'white',
                                        color: '#374151',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#ef4444',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default GameAssignControl;
