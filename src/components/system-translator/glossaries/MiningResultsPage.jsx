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
const MiningResultsPage = ({ currentUser = { name: 'Expert', role: 2 } }) => {
    // State
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        sourceLang: 'en',
        targetLang: '',
        domain: '',
        project: '',
        verificationStatus: 'unverified',
        search: ''
    });
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
    const [editingTerms, setEditingTerms] = useState({}); // {termId: {source, target, domain}}
    const [message, setMessage] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newTerm, setNewTerm] = useState({ source: '', target: '', domain: 'General' });

    const domains = ['Legal', 'Medical', 'Engineering', 'Building', 'Finance', 'IT', 'General'];

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
                <div className="header-content">
                    <h1>📚 Glossary Mining Results</h1>
                    <span className="stats">
                        {terms.length} terms shown, {pagination.total} total
                    </span>
                </div>
            </header>

            {/* Message toast */}
            {message && (
                <div className={`message-toast ${message.type}`}>
                    {message.text}
                </div>
            )}

            {/* Filter Panel */}
            <FilterPanel filters={filters} onChange={setFilters} domains={domains} />

            {/* Bulk Actions */}
            <div className="bulk-actions">
                <label className="checkbox-label">
                    <input
                        type="checkbox"
                        checked={selectedIds.size === terms.length && terms.length > 0}
                        onChange={selectAll}
                    />
                    Select All ({selectedIds.size} selected)
                </label>

                <button
                    className="btn-verify"
                    onClick={handleBulkVerify}
                    disabled={selectedIds.size === 0}
                >
                    ✓ Bulk Verify ({selectedIds.size})
                </button>

                <button
                    className="btn-verify"
                    onClick={() => setIsAdding(true)}
                    style={{ marginLeft: '12px', backgroundColor: '#10b981' }}
                >
                    + Add New Term
                </button>
            </div>

            {/* Terms Table */}
            <div className="terms-table-container">
                {loading ? (
                    <div className="loading">Loading terms...</div>
                ) : terms.length === 0 ? (
                    <div className="empty-state">
                        No terms found matching your filters.
                    </div>
                ) : (
                    <table className="terms-table">
                        <thead>
                            <tr>
                                <th>☐</th>
                                <th>Source</th>
                                <th>Target</th>
                                <th>Confidence</th>
                                <th>Domain</th>
                                <th>Created By</th>
                                <th>Verified</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isAdding && (
                                <tr style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <td></td>
                                    <td>
                                        <input
                                            className="edit-input"
                                            placeholder="Source Term"
                                            value={newTerm.source}
                                            onChange={e => setNewTerm({ ...newTerm, source: e.target.value })}
                                            autoFocus
                                        />
                                    </td>
                                    <td>
                                        <input
                                            className="edit-input"
                                            placeholder="Target Term"
                                            value={newTerm.target}
                                            onChange={e => setNewTerm({ ...newTerm, target: e.target.value })}
                                        />
                                    </td>
                                    <td><ConfidenceBadge score={1.0} /></td>
                                    <td>
                                        <select
                                            className="edit-select"
                                            value={newTerm.domain}
                                            onChange={e => setNewTerm({ ...newTerm, domain: e.target.value })}
                                        >
                                            {domains.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </td>
                                    <td>Manual</td>
                                    <td>Verified</td>
                                    <td className="actions-cell">
                                        <button className="btn-save" onClick={handleCreate}>💾</button>
                                        <button className="btn-cancel" onClick={() => setIsAdding(false)}>✕</button>
                                    </td>
                                </tr>
                            )}
                            {terms.map(term => {
                                const isEditing = !!editingTerms[term._id];
                                const editValues = editingTerms[term._id] || {};

                                return (
                                    <tr key={term._id} className={term.verificationStatus === 'verified' ? 'verified-row' : ''}>
                                        <td>
                                            <input
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
                                                    className="edit-input"
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
                                                    className="edit-input"
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
                                                    className="edit-select"
                                                >
                                                    {domains.map(d => (
                                                        <option key={d} value={d}>{d}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="domain-tag">{term.domain}</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="created-by">
                                                {term.createdBy?.agent !== 'None'
                                                    ? `🤖 ${term.createdBy?.agent}`
                                                    : `👤 ${term.createdBy?.reviewerName || 'Manual'}`
                                                }
                                            </span>
                                        </td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={term.verificationStatus === 'verified'}
                                                onChange={() => handleVerify(term._id, term.verificationStatus)}
                                                className="verify-checkbox"
                                            />
                                        </td>
                                        <td className="actions-cell">
                                            {isEditing ? (
                                                <>
                                                    <button
                                                        className="btn-save"
                                                        onClick={() => handleSaveEdit(term._id)}
                                                    >
                                                        💾
                                                    </button>
                                                    <button
                                                        className="btn-cancel"
                                                        onClick={() => cancelEdit(term._id)}
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn-edit"
                                                        onClick={() => startEdit(term)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    {currentUser.role >= 2 && (
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => handleDelete(term._id)}
                                                        >
                                                            🗑️
                                                        </button>
                                                    )}
                                                </>
                                            )}
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
                <div className="pagination">
                    <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page <= 1}
                    >
                        ← Previous
                    </button>
                    <span>Page {pagination.page} of {pagination.pages}</span>
                    <button
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
