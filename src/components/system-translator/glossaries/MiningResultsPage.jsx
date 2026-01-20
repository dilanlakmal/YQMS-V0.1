/**
 * MiningResultsPage.jsx
 * Expert Review UI for glossary terms mined by AI agents
 * Allows filtering, inline editing, verification, and bulk operations
 */

import { useState, useEffect, useCallback } from 'react';
import './MiningResultsPage.css';

import { API_BASE_URL } from '../../../../config';

const API_BASE = `${API_BASE_URL}/api/glossary`;

// Confidence badge component
const ConfidenceBadge = ({ score }) => {
    const percentage = (score * 100).toFixed(0);
    let colorClass = 'badge-red';
    let icon = '⚠️';

    if (score >= 0.90) {
        colorClass = 'badge-green';
        icon = '✅';
    } else if (score >= 0.70) {
        colorClass = 'badge-yellow';
        icon = '🟡';
    }

    return (
        <span className={`confidence-badge ${colorClass}`}>
            {icon} {percentage}%
        </span>
    );
};

// Filter panel component
const FilterPanel = ({ filters, onChange, domains }) => {
    return (
        <div className="filter-panel">
            <div className="filter-group">
                <label>Source Lang</label>
                <select
                    value={filters.sourceLang}
                    onChange={(e) => onChange({ ...filters, sourceLang: e.target.value })}
                >
                    <option value="en">English</option>
                    <option value="km">Khmer</option>
                    <option value="zh-Hans">Chinese</option>
                    <option value="ja">Japanese</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Target Lang</label>
                <select
                    value={filters.targetLang}
                    onChange={(e) => onChange({ ...filters, targetLang: e.target.value })}
                >
                    <option value="">All Languages</option>
                    <option value="km">Khmer</option>
                    <option value="en">English</option>
                    <option value="zh-Hans">Chinese</option>
                    <option value="ja">Japanese</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Domain</label>
                <select
                    value={filters.domain}
                    onChange={(e) => onChange({ ...filters, domain: e.target.value })}
                >
                    <option value="">All Domains</option>
                    {domains.map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

            <div className="filter-group">
                <label>Status</label>
                <select
                    value={filters.verificationStatus}
                    onChange={(e) => onChange({ ...filters, verificationStatus: e.target.value })}
                >
                    <option value="">All</option>
                    <option value="unverified">Unverified</option>
                    <option value="verified">Verified</option>
                </select>
            </div>

            <div className="filter-group">
                <label>Search</label>
                <input
                    type="text"
                    placeholder="Search terms..."
                    value={filters.search}
                    onChange={(e) => onChange({ ...filters, search: e.target.value })}
                />
            </div>
        </div>
    );
};

// Main component
const MiningResultsPage = ({ currentUser = { name: 'Expert', role: 2 }, initialBatchId = null }) => {
    // State
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        sourceLang: 'en',
        targetLang: '',
        domain: '',
        project: '',
        verificationStatus: 'unverified',
        search: '',
        creator: '',
        miningBatchId: initialBatchId || ''
    });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
    const [editingTerms, setEditingTerms] = useState({}); // {termId: {source, target, domain}}
    const [message, setMessage] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newTerm, setNewTerm] = useState({ source: '', target: '', domain: 'Garment Industry' });

    const domains = ['Garment Industry', 'Legal', 'Medical', 'Engineering', 'Building', 'Finance', 'IT', 'General'];

    // Fetch terms
    const fetchTerms = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            params.append('page', pagination.page);
            params.append('limit', pagination.limit);

            const res = await fetch(`${API_BASE}/terms?${params}`);
            const data = await res.json();

            if (data.success) {
                setTerms(data.terms);
                setPagination(prev => ({
                    ...prev,
                    total: data.total,
                    pages: data.pages
                }));
            }
        } catch (error) {
            showMessage('Error loading terms: ' + error.message, 'error');
        }
        setLoading(false);
    }, [filters, pagination.page, pagination.limit]);

    useEffect(() => {
        fetchTerms();
    }, [fetchTerms]);

    // Show message toast
    const showMessage = (text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    // Toggle selection
    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Select all visible
    const selectAll = () => {
        if (selectedIds.size === terms.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(terms.map(t => t._id)));
        }
    };

    // Single term verify toggle
    const handleVerify = async (termId, currentStatus) => {
        try {
            const res = await fetch(`${API_BASE}/terms/${termId}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verified: currentStatus !== 'verified',
                    reviewerName: currentUser.name
                })
            });
            const data = await res.json();
            if (data.success) {
                showMessage(data.term.verificationStatus === 'verified' ? 'Term verified!' : 'Term unverified');
                fetchTerms();
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
    };

    // Start editing a term
    const startEdit = (term) => {
        setEditingTerms(prev => ({
            ...prev,
            [term._id]: {
                source: term.source,
                target: term.target,
                domain: term.domain
            }
        }));
    };

    // Update edit values
    const updateEdit = (termId, field, value) => {
        setEditingTerms(prev => ({
            ...prev,
            [termId]: {
                ...prev[termId],
                [field]: value
            }
        }));
    };

    // Save edit (auto-verifies)
    const handleSaveEdit = async (termId) => {
        try {
            const updates = editingTerms[termId];
            const res = await fetch(`${API_BASE}/terms/${termId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...updates,
                    reviewerName: currentUser.name
                })
            });
            const data = await res.json();
            if (data.success) {
                showMessage('Term saved and verified!');
                setEditingTerms(prev => {
                    const copy = { ...prev };
                    delete copy[termId];
                    return copy;
                });
                fetchTerms();
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
    };

    // Cancel edit
    const cancelEdit = (termId) => {
        setEditingTerms(prev => {
            const copy = { ...prev };
            delete copy[termId];
            return copy;
        });
    };

    // Bulk verify
    const handleBulkVerify = async () => {
        if (selectedIds.size === 0) return;
        try {
            const res = await fetch(`${API_BASE}/terms/bulk-verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    termIds: Array.from(selectedIds),
                    verified: true,
                    reviewerName: currentUser.name
                })
            });
            const data = await res.json();
            if (data.success) {
                showMessage(`${data.modified} terms verified!`);
                setSelectedIds(new Set());
                fetchTerms();
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
    };

    // Create new manual term
    const handleCreate = async () => {
        if (!newTerm.source || !newTerm.target) {
            showMessage('Source and Target are required', 'error');
            return;
        }
        try {
            const res = await fetch(`${API_BASE}/terms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: newTerm.source,
                    target: newTerm.target,
                    sourceLang: filters.sourceLang,
                    targetLang: filters.targetLang,
                    domain: newTerm.domain,
                    project: filters.project || 'Manual',
                    verificationStatus: 'verified',
                    createdBy: { reviewerName: currentUser.name }
                })
            });
            const data = await res.json();
            if (data.success) {
                showMessage('Term created successfully!');
                setIsAdding(false);
                setNewTerm({ source: '', target: '', domain: 'General' });
                fetchTerms();
            } else {
                showMessage(data.error || 'Failed to create', 'error');
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
    };

    // Delete term (admin only)
    const handleDelete = async (termId) => {
        if (!confirm('Are you sure you want to delete this term?')) return;
        try {
            const res = await fetch(`${API_BASE}/terms/${termId}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            if (data.success) {
                showMessage('Term deleted');
                fetchTerms();
            }
        } catch (error) {
            showMessage('Error: ' + error.message, 'error');
        }
    };

    return (
        <div className="mining-results-page">
            {/* Header */}
            <header className="page-header">
                <div className="header-title-area">
                    <h1>📚 Glossary Mining Results</h1>
                </div>
                <div className="header-stats">
                    {terms.length} terms shown • {pagination.total} total
                </div>
            </header>

            {/* Message toast */}
            <div className={`message-toast ${message ? 'active' : ''} ${message?.type === 'error' ? 'toast-error' : 'toast-success'}`}>
                {message?.text}
            </div>

            {/* Source Type Tabs */}
            <nav className="mining-tabs">
                {[
                    { id: '', label: 'All Results' },
                    { id: 'single', label: 'Single File' },
                    { id: 'parallel', label: 'Parallel Files' },
                    { id: 'manual', label: 'Manual Input' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`mining-tab-btn ${filters.creator === tab.id ? 'active' : ''}`}
                        onClick={() => setFilters({ ...filters, creator: tab.id })}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* Batch Filter Indicator */}
            {filters.miningBatchId && (
                <div className="batch-indicator">
                    <span className="batch-text">
                        📍 Viewing batch: <strong>{filters.miningBatchId}</strong>
                    </span>
                    <button
                        className="batch-clear-btn"
                        onClick={() => setFilters({ ...filters, miningBatchId: '' })}
                    >
                        Show all batches
                    </button>
                </div>
            )}

            {/* Filter Panel */}
            <FilterPanel filters={filters} onChange={setFilters} domains={domains} />

            {/* Bulk Actions */}
            <div className="bulk-actions-bar">
                <div className="selection-count">
                    <input
                        className="custom-cb"
                        type="checkbox"
                        checked={selectedIds.size === terms.length && terms.length > 0}
                        onChange={selectAll}
                    />
                    <span>{selectedIds.size} Selected</span>
                </div>

                <div className="action-buttons">
                    <button
                        className="btn-premium btn-verify-bulk"
                        onClick={handleBulkVerify}
                        disabled={selectedIds.size === 0}
                    >
                        ✓ Bulk Verify
                    </button>

                    <button
                        className="btn-premium btn-add-new"
                        onClick={() => setIsAdding(true)}
                    >
                        + Add New Term
                    </button>
                </div>
            </div>

            {/* Terms Table */}
            <div className="terms-table-container">
                {loading ? (
                    <div className="loading-pulse">
                        <div className="loader-spinner"></div>
                        <span>Loading refined terms...</span>
                    </div>
                ) : terms.length === 0 ? (
                    <div className="empty-state">
                        <span style={{ fontSize: '32px' }}>🔍</span>
                        <p>No terms found matching your current filters.</p>
                    </div>
                ) : (
                    <table className="terms-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}></th>
                                <th>Source</th>
                                <th>Target</th>
                                <th>Confidence</th>
                                <th>Domain</th>
                                <th>Created By</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isAdding && (
                                <tr className="edit-row">
                                    <td></td>
                                    <td>
                                        <input
                                            className="edit-input-modern"
                                            placeholder="Source Term"
                                            value={newTerm.source}
                                            onChange={e => setNewTerm({ ...newTerm, source: e.target.value })}
                                            autoFocus
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="edit-input-modern"
                                            placeholder="Target Term"
                                            value={newTerm.target}
                                            onChange={e => setNewTerm({ ...newTerm, target: e.target.value })}
                                        />
                                    </td>
                                    <td><ConfidenceBadge score={1.0} /></td>
                                    <td>
                                        <select
                                            className="edit-select-modern"
                                            value={newTerm.domain}
                                            onChange={e => setNewTerm({ ...newTerm, domain: e.target.value })}
                                        >
                                            {domains.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </td>
                                    <td><span className="creator-info">👤 Manual</span></td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="badge-green confidence-badge">Verified</span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div className="actions-flex" style={{ justifyContent: 'flex-end' }}>
                                            <button className="icon-btn btn-save-mode" onClick={handleCreate} title="Save">💾</button>
                                            <button className="icon-btn" onClick={() => setIsAdding(false)} title="Cancel">✕</button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {terms.map(term => {
                                const isEditing = !!editingTerms[term._id];
                                const editValues = editingTerms[term._id] || {};

                                return (
                                    <tr key={term._id} className={`${term.verificationStatus === 'verified' ? 'verified-row' : ''} ${isEditing ? 'edit-row' : ''}`}>
                                        <td>
                                            <input
                                                className="custom-cb"
                                                type="checkbox"
                                                checked={selectedIds.has(term._id)}
                                                onChange={() => toggleSelection(term._id)}
                                            />
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editValues.source}
                                                    onChange={(e) => updateEdit(term._id, 'source', e.target.value)}
                                                    className="edit-input-modern"
                                                />
                                            ) : (
                                                <span className="term-text">{term.source}</span>
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editValues.target}
                                                    onChange={(e) => updateEdit(term._id, 'target', e.target.value)}
                                                    className="edit-input-modern"
                                                />
                                            ) : (
                                                <span className="term-text">{term.target}</span>
                                            )}
                                        </td>
                                        <td>
                                            <ConfidenceBadge score={term.confidenceScore || 0} />
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <select
                                                    value={editValues.domain}
                                                    onChange={(e) => updateEdit(term._id, 'domain', e.target.value)}
                                                    className="edit-select-modern"
                                                >
                                                    {domains.map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="domain-pill">{term.domain}</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="creator-info">
                                                {term.createdBy?.agent !== 'None'
                                                    ? `🤖 ${term.createdBy?.agent}`
                                                    : `👤 ${term.createdBy?.reviewerName || 'Manual'}`
                                                }
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={term.verificationStatus === 'verified'}
                                                onChange={() => handleVerify(term._id, term.verificationStatus)}
                                                className="custom-cb"
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="actions-flex" style={{ justifyContent: 'flex-end' }}>
                                                {isEditing ? (
                                                    <>
                                                        <button
                                                            className="icon-btn btn-save-mode"
                                                            onClick={() => handleSaveEdit(term._id)}
                                                            title="Save"
                                                        >
                                                            💾
                                                        </button>
                                                        <button
                                                            className="icon-btn"
                                                            onClick={() => cancelEdit(term._id)}
                                                            title="Cancel"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="icon-btn btn-edit-mode"
                                                            onClick={() => startEdit(term)}
                                                            title="Edit"
                                                        >
                                                            ✏️
                                                        </button>
                                                        {currentUser.role >= 2 && (
                                                            <button
                                                                className="icon-btn btn-delete-mode"
                                                                onClick={() => handleDelete(term._id)}
                                                                title="Delete"
                                                            >
                                                                🗑️
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="pagination-area">
                    <button
                        className="pg-btn"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page <= 1}
                    >
                        ← Prev
                    </button>
                    <span className="pg-info">Page {pagination.page} of {pagination.pages}</span>
                    <button
                        className="pg-btn"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page >= pagination.pages}
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
};

export default MiningResultsPage;
