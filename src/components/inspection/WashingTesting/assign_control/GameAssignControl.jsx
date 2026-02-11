import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Select } from 'antd';
import './GameAssignControl.css';
import showToast from '../../../../utils/toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// SVG Icons
const TargetIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
);

const HandIcon = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 11V6C9 4.89543 9.89543 4 11 4C12.1046 4 13 4.89543 13 6V11M13 11V4C13 2.89543 13.8954 2 15 2C16.1046 2 17 2.89543 17 4V11M13 11V8C13 6.89543 13.8954 6 15 6C16.1046 6 17 6.89543 17 8V11M17 11V9C17 7.89543 17.8954 7 19 7C20.1046 7 21 7.89543 21 9V15C21 18.866 17.866 22 14 22H12C8.13401 22 5 18.866 5 15V12C5 10.8954 5.89543 10 7 10C8.10457 10 9 10.8954 9 12V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const DownArrowIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M12 19L19 12M12 19L5 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const TrashIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 6V4C8 3.46957 8.21071 3 8.58579 2.62563C8.96086 2.25126 9.46957 2.04095 10 2.04095H14C14.5304 2.04095 15.0391 2.25126 15.4142 2.62563C15.7893 3 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const GameAssignControl = ({ socket }) => {
    const [users, setUsers] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserName, setSelectedUserName] = useState('');

    const [draggedUser, setDraggedUser] = useState(null);
    const [dropTargets, setDropTargets] = useState({
        prepared: null,
        checked: null,
        approved: null
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOverTarget, setDragOverTarget] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successBucket, setSuccessBucket] = useState(null); // For success animation

    const [currentAssignment, setCurrentAssignment] = useState({
        preparedBy: null,
        checkedBy: null,
        approvedBy: null
    });

    const [activeAssignmentId, setActiveAssignmentId] = useState(null);

    useEffect(() => {
        if (!socket) return;
        socket.emit('join:assignments');

        const handleAssignmentCreated = (assignment) => {
            setAssignments(prev => [assignment, ...prev]);
            // Only update buckets if user is actively assigning
            // Don't auto-fill on socket events
        };

        const handleAssignmentUpdated = (assignment) => {
            setAssignments(prev =>
                prev.map(a => a._id === assignment._id ? assignment : a)
            );
            // Only update buckets if user is actively assigning
            // Don't auto-fill on socket events
        };

        const handleAssignmentDeleted = ({ id }) => {
            setAssignments(prev => prev.filter(a => a._id !== id));
        };

        socket.on('assignment:created', handleAssignmentCreated);
        socket.on('assignment:updated', handleAssignmentUpdated);
        socket.on('assignment:deleted', handleAssignmentDeleted);

        return () => {
            socket.off('assignment:created', handleAssignmentCreated);
            socket.off('assignment:updated', handleAssignmentUpdated);
            socket.off('assignment:deleted', handleAssignmentDeleted);
        };
    }, [socket]);

    useEffect(() => {
        fetchUsers();
        fetchAssignments();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast.error('Failed to load users');
        }
    };

    const fetchAssignments = async () => {
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
    };

    const updateCurrentAssignment = (assignment) => {
        setCurrentAssignment({
            preparedBy: assignment.preparedBy,
            checkedBy: assignment.checkedBy,
            approvedBy: assignment.approvedBy
        });
        setDropTargets({
            prepared: assignment.preparedBy,
            checked: assignment.checkedBy,
            approved: assignment.approvedBy
        });
    };

    const handleUserSelect = (value) => {
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
    };

    const handleDragStart = (e) => {
        if (!selectedUser) return;
        setDraggedUser(selectedUser);
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', selectedUser);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDragOverTarget(null);
    };

    const handleDragOver = (e, target) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverTarget(target);
    };

    const handleDragLeave = () => {
        setDragOverTarget(null);
    };

    const handleDrop = async (e, target) => {
        e.preventDefault();
        const userId = e.dataTransfer.getData('text/plain');

        if (!userId) return;

        // Update drop targets
        const newTargets = { ...dropTargets, [target]: userId };
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
    };

    const submitAssignment = async (targets = dropTargets) => {
        setIsSubmitting(true);

        try {
            const payload = {
                preparedBy: targets.prepared,
                checkedBy: targets.checked,
                approvedBy: targets.approved,
                updatedBy: selectedUser || targets.prepared || targets.checked || targets.approved
            };

            // Determine which ID to update:
            // ONLY explicitly specified ID activeAssignmentId
            // If activeAssignmentId is null, we CREATE NEW (POST)
            const targetId = activeAssignmentId;

            if (targetId) {
                await axios.put(
                    `${API_BASE_URL}/api/assign-control/${targetId}`,
                    payload
                );

                // If we didn't have an active ID (fallback case), set it now
                if (!activeAssignmentId) setActiveAssignmentId(targetId);

            } else {
                const response = await axios.post(`${API_BASE_URL}/api/assign-control`, payload);
                // Set the new assignment as active
                if (response.data && response.data._id) {
                    setActiveAssignmentId(response.data._id);
                }
            }

            showToast.success('✓ Assignment updated!');

        } catch (error) {
            console.error('Error submitting assignment:', error);
            showToast.error('Failed to update assignment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClearBucket = (bucket) => {
        const newTargets = { ...dropTargets, [bucket]: null };
        setDropTargets(newTargets);
        submitAssignment(newTargets);
    };

    const handleClearAll = () => {
        setDropTargets({
            prepared: null,
            checked: null,
            approved: null
        });
        setCurrentAssignment({
            preparedBy: null,
            checkedBy: null,
            approvedBy: null
        });
        setSelectedUser(null);
        setSelectedUserName('');
        setActiveAssignmentId(null); // CRITICAL: Reset ID so next submit creates NEW record
    };

    const handleLoadAssignment = (assignment) => {
        // Create a copy of the assignment data to ensure valid string values
        // Sometimes values might be objects if populated, though here they seem to be strings
        const safeAssignment = {
            preparedBy: typeof assignment.preparedBy === 'object' ? assignment.preparedBy?.name : assignment.preparedBy,
            checkedBy: typeof assignment.checkedBy === 'object' ? assignment.checkedBy?.name : assignment.checkedBy,
            approvedBy: typeof assignment.approvedBy === 'object' ? assignment.approvedBy?.name : assignment.approvedBy,
            updatedBy: typeof assignment.updatedBy === 'object' ? assignment.updatedBy?.name : assignment.updatedBy,
            _id: assignment._id
        };

        // Set this as the active assignment for updates
        setActiveAssignmentId(safeAssignment._id);

        // Load assignment values into buckets
        setDropTargets({
            prepared: safeAssignment.preparedBy,
            checked: safeAssignment.checkedBy,
            approved: safeAssignment.approvedBy
        });
        setCurrentAssignment({
            preparedBy: safeAssignment.preparedBy,
            checkedBy: safeAssignment.checkedBy,
            approved: safeAssignment.approvedBy
        });

        // SMART SELECT: Prioritize selecting a user who is actually in this assignment
        // This lets you immediately "pick up" where you left off
        const activeUser = assignment.preparedBy || assignment.checkedBy || assignment.approvedBy || assignment.updatedBy;

        if (activeUser) {
            setSelectedUser(activeUser);

            // Find user details to show name in bubble
            const user = users.find(u => (u.emp_id || u.name) === activeUser);
            if (user) {
                const name = user.name || user.eng_name || activeUser;
                // Show only name in bubble
                setSelectedUserName(name);
            } else {
                setSelectedUserName(activeUser);
            }
        }

        // showToast.success('✓ Assignment loaded! User selected.');
    };

    const userOptions = users.map(user => {
        const id = user.emp_id;
        const name = user.name || user.eng_name || 'Unknown';
        return {
            value: id || name,
            label: id ? `(${id}) ${name}` : name,
            key: user._id || id || name
        };
    });

    const getDisplayName = (value) => {
        if (!value) return '-';
        if (typeof value === 'object') return value.name || value.eng_name || '-';
        const user = users.find(u => (u.emp_id || u.name) === value);
        return user ? (user.name || user.eng_name || value) : value;
    };

    const bucketColors = {
        prepared: { primary: '#FF6B6B', secondary: '#FF8E53', name: 'Prepared' },
        checked: { primary: '#4ECDC4', secondary: '#44A08D', name: 'Checked' },
        approved: { primary: '#45B7D1', secondary: '#5F27CD', name: 'Approved' }
    };

    // Delete Confirmation State
    const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, id: null });

    const handleDeleteAssignment = (e, id) => {
        e.stopPropagation();
        setDeleteConfirmation({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        const id = deleteConfirmation.id;
        if (!id) return;

        try {
            await axios.delete(`${API_BASE_URL}/api/assign-control/${id}`);
            showToast.success('Assignment deleted');

            // If we deleted the active assignment, clear the board
            if (activeAssignmentId === id) {
                handleClearAll();
            }
        } catch (error) {
            console.error('Error deleting assignment:', error);
            showToast.error('Failed to delete assignment');
        } finally {
            setDeleteConfirmation({ isOpen: false, id: null });
        }
    };

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
                            placeholder="Choose user..."
                            optionFilterProp="label"
                            value={selectedUser}
                            onChange={handleUserSelect}
                            options={userOptions}
                            className="user-select-compact"
                            size="large"
                            allowClear
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
                                <button
                                    className="deselect-btn"
                                    onClick={() => handleUserSelect(null)}
                                    style={{
                                        marginTop: '10px',
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        border: '1px solid rgba(255, 255, 255, 0.4)',
                                        borderRadius: '20px',
                                        padding: '5px 15px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        margin: '10px auto 0'
                                    }}
                                >
                                    ✕ Done
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Clear Button */}
                    <motion.button
                        className="clear-btn"
                        onClick={handleClearAll}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        🗑️ Clear All
                    </motion.button>
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
                        {Object.entries(bucketColors).map(([key, color]) => (
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
                                transition={{ delay: 0.3 + Object.keys(bucketColors).indexOf(key) * 0.1 }}
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
                                                    showToast.success('User picked up!');
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
                assignments.length > 0 && (
                    <motion.div
                        className="history-compact"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        <h4 className="history-title">Recent Assignments</h4>
                        <div className="history-scroll">
                            {assignments.slice(0, 5).map((assignment, index) => (
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
                                        <span className="badge prepared">{getDisplayName(assignment.preparedBy)}</span>
                                        <span className="badge checked">{getDisplayName(assignment.checkedBy)}</span>
                                        <span className="badge approved">{getDisplayName(assignment.approvedBy)}</span>
                                    </div>
                                </motion.div>
                            ))}
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
