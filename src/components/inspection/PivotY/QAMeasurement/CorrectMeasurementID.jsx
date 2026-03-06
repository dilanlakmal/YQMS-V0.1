import React, { useState, useMemo, useCallback } from "react";
import axios from "axios";
import debounce from "lodash/debounce";
import { API_BASE_URL } from "../../../../../config";

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    marginBottom: "16px",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    padding: "20px",
    marginBottom: "20px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#1a1a2e",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  stepBadge: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#4361ee",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: "500",
    color: "#444",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "14px",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
  primaryButton: {
    backgroundColor: "#4361ee",
    color: "#fff",
  },
  successButton: {
    backgroundColor: "#10b981",
    color: "#fff",
  },
  secondaryButton: {
    backgroundColor: "#f3f4f6",
    color: "#374151",
    border: "1px solid #d1d5db",
  },
  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  orderList: {
    maxHeight: "200px",
    overflowY: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    marginTop: "8px",
  },
  orderItem: {
    padding: "10px 14px",
    borderBottom: "1px solid #e5e7eb",
    cursor: "pointer",
    transition: "background-color 0.15s",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderItemSelected: {
    backgroundColor: "#eff6ff",
    borderLeft: "3px solid #4361ee",
  },
  badge: {
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "500",
  },
  badgeBlue: {
    backgroundColor: "#dbeafe",
    color: "#1d4ed8",
  },
  badgeGreen: {
    backgroundColor: "#d1fae5",
    color: "#059669",
  },
  badgeYellow: {
    backgroundColor: "#fef3c7",
    color: "#d97706",
  },
  badgeRed: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
  },
  badgePurple: {
    backgroundColor: "#ede9fe",
    color: "#7c3aed",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    backgroundColor: "#f9fafb",
    borderBottom: "2px solid #e5e7eb",
    fontWeight: "600",
    color: "#374151",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
  },
  changedRow: {
    backgroundColor: "#fef3c7",
  },
  unchangedRow: {
    backgroundColor: "#fff",
  },
  idCell: {
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#6b7280",
    maxWidth: "140px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  summaryBox: {
    padding: "16px",
    backgroundColor: "#f0fdf4",
    borderRadius: "8px",
    marginBottom: "16px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
  },
  summaryItem: {
    textAlign: "center",
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  summaryValue: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#059669",
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
  },
  alert: {
    padding: "12px 16px",
    borderRadius: "8px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  alertSuccess: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  alertError: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  alertWarning: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  alertInfo: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  checkboxGroup: {
    display: "flex",
    gap: "24px",
    marginTop: "16px",
    marginBottom: "16px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  tabContainer: {
    display: "flex",
    gap: "4px",
    marginBottom: "16px",
    borderBottom: "2px solid #e5e7eb",
    flexWrap: "wrap",
  },
  tab: {
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    color: "#6b7280",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    transition: "all 0.2s",
  },
  tabActive: {
    color: "#4361ee",
    borderBottomColor: "#4361ee",
  },
  flexRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  loader: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid #fff",
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  noData: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#9ca3af",
    fontSize: "14px",
  },
  kValueBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    marginRight: "8px",
  },
  kValueSection: {
    marginBottom: "24px",
    padding: "16px",
    backgroundColor: "#fafafa",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  kValueHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  sourceInfoBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "16px",
  },
  sourceInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
  },
  sourceInfoItem: {
    padding: "12px",
    backgroundColor: "#fff",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
  },
  sourceInfoLabel: {
    fontSize: "11px",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  sourceInfoValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f2937",
  },
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const CorrectMeasurementID = () => {
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [targetOrderNo, setTargetOrderNo] = useState("");
  const [qaSpecsInfo, setQaSpecsInfo] = useState(null);
  const [sourceAnalysis, setSourceAnalysis] = useState(null);
  const [preview, setPreview] = useState(null);
  const [activeTab, setActiveTab] = useState("afterWash");
  const [activeBWKValue, setActiveBWKValue] = useState(null);
  const [updateAfterWash, setUpdateAfterWash] = useState(true);
  const [updateBeforeWash, setUpdateBeforeWash] = useState(true);

  // Loading states
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingSpecs, setIsCheckingSpecs] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ============================================================================
  // API CALLS
  // ============================================================================

  // Debounced search for orders
  const debouncedSearch = useMemo(
    () =>
      debounce(async (term) => {
        if (!term || term.length < 2) {
          setSearchResults([]);
          return;
        }

        setIsSearching(true);
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/qa-sections/measurement-specs/search-fincheck-orders`,
            { params: { searchTerm: term } },
          );

          if (response.data.success) {
            setSearchResults(response.data.orders || []);
          }
        } catch (error) {
          console.error("Search error:", error);
          setErrorMessage("Failed to search orders");
        } finally {
          setIsSearching(false);
        }
      }, 300),
    [],
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Check QA specs for target order
  const checkQASpecs = useCallback(async (orderNo) => {
    if (!orderNo || orderNo.length < 3) {
      setQaSpecsInfo(null);
      return;
    }

    setIsCheckingSpecs(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/check-qa-specs/${encodeURIComponent(orderNo)}`,
      );

      if (response.data.success) {
        setQaSpecsInfo(response.data);
      }
    } catch (error) {
      console.error("Error checking QA specs:", error);
      setQaSpecsInfo({ exists: false });
    } finally {
      setIsCheckingSpecs(false);
    }
  }, []);

  // Analyze source order
  const analyzeSourceOrder = useCallback(async (orderNo) => {
    if (!orderNo) return;

    setIsAnalyzing(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/analyze-source/${encodeURIComponent(orderNo)}`,
      );

      if (response.data.success) {
        setSourceAnalysis(response.data.analysis);
      }
    } catch (error) {
      console.error("Error analyzing source:", error);
      setSourceAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Select an order from search results
  const handleSelectOrder = useCallback(
    async (order) => {
      setSelectedOrder(order);
      setPreview(null);
      setTargetOrderNo(order.orderNo); // Auto-fill target order
      setErrorMessage("");
      setSuccessMessage("");
      setSourceAnalysis(null);

      // Analyze source order
      analyzeSourceOrder(order.orderNo);

      // Check if QA specs exist for this order
      checkQASpecs(order.orderNo);
    },
    [analyzeSourceOrder, checkQASpecs],
  );

  // Debounced check for QA specs
  const debouncedCheckQASpecs = useMemo(
    () =>
      debounce((orderNo) => {
        checkQASpecs(orderNo);
      }, 500),
    [checkQASpecs],
  );

  // Handle target order change
  const handleTargetOrderChange = (e) => {
    const value = e.target.value;
    setTargetOrderNo(value);
    setPreview(null);
    debouncedCheckQASpecs(value);
  };

  // Load preview
  const handlePreview = useCallback(async () => {
    if (!selectedOrder || !targetOrderNo) {
      setErrorMessage("Please select a source order and enter target Order No");
      return;
    }

    setIsLoadingPreview(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/preview-id-mapping`,
        {
          sourceOrderNo: selectedOrder.orderNo,
          targetOrderNo: targetOrderNo.trim(),
        },
      );

      if (response.data.success) {
        setPreview(response.data.preview);

        // Set initial active BW kValue if available
        if (
          response.data.preview.mappings.beforeWash &&
          response.data.preview.mappings.beforeWash.length > 0
        ) {
          setActiveBWKValue(
            response.data.preview.mappings.beforeWash[0].kValue,
          );
        }
      } else {
        setErrorMessage(response.data.message || "Failed to load preview");
      }
    } catch (error) {
      console.error("Preview error:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to load preview",
      );
    } finally {
      setIsLoadingPreview(false);
    }
  }, [selectedOrder, targetOrderNo]);

  // Execute update
  const handleExecute = useCallback(async () => {
    if (!selectedOrder || !targetOrderNo) {
      setErrorMessage("Please select a source order and target Order No");
      return;
    }

    if (!updateAfterWash && !updateBeforeWash) {
      setErrorMessage("Please select at least one spec type to update");
      return;
    }

    // Confirmation
    const confirmMsg =
      `Are you sure you want to update measurement IDs?\n\n` +
      `Source: ${selectedOrder.orderNo}\n` +
      `Target: ${targetOrderNo}\n\n` +
      `This will update:\n` +
      `${updateAfterWash ? "✓ After Wash Specs\n" : ""}` +
      `${updateBeforeWash ? "✓ Before Wash Specs (all K-Values)\n" : ""}`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsExecuting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/execute-id-update`,
        {
          sourceOrderNo: selectedOrder.orderNo,
          targetOrderNo: targetOrderNo.trim(),
          updateAfterWash,
          updateBeforeWash,
        },
      );

      if (response.data.success) {
        const result = response.data.result;
        let msg = "Successfully updated IDs!\n";

        if (updateAfterWash) {
          msg += `After Wash: ${result.afterWash.updated} specs updated, ${result.afterWash.selected} selected specs updated.\n`;
        }

        if (updateBeforeWash) {
          msg += `Before Wash: ${result.beforeWash.updated} specs updated across ${result.beforeWash.kValuesUpdated.length} K-Value(s), ${result.beforeWash.selected} selected specs updated.`;
        }

        setSuccessMessage(msg);

        // Refresh preview
        handlePreview();
      } else {
        setErrorMessage(response.data.message || "Update failed");
      }
    } catch (error) {
      console.error("Execute error:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to execute update",
      );
    } finally {
      setIsExecuting(false);
    }
  }, [
    selectedOrder,
    targetOrderNo,
    updateAfterWash,
    updateBeforeWash,
    handlePreview,
  ]);

  // Reset all
  const handleReset = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedOrder(null);
    setTargetOrderNo("");
    setQaSpecsInfo(null);
    setSourceAnalysis(null);
    setPreview(null);
    setActiveTab("afterWash");
    setActiveBWKValue(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderSourceAnalysis = () => {
    if (!sourceAnalysis) return null;

    return (
      <div style={styles.sourceInfoBox}>
        <div
          style={{ marginBottom: "12px", fontWeight: "600", color: "#374151" }}
        >
          Source Measurement Data Analysis
        </div>
        <div style={styles.sourceInfoGrid}>
          {/* After Wash Info */}
          <div style={styles.sourceInfoItem}>
            <div style={styles.sourceInfoLabel}>After Wash</div>
            <div style={styles.sourceInfoValue}>
              {sourceAnalysis.afterWash.found ? (
                <>
                  <span style={{ ...styles.badge, ...styles.badgeGreen }}>
                    Found
                  </span>
                  <span style={{ marginLeft: "8px" }}>
                    {sourceAnalysis.afterWash.idCount} IDs (Report #
                    {sourceAnalysis.afterWash.reportId})
                  </span>
                </>
              ) : (
                <span style={{ ...styles.badge, ...styles.badgeRed }}>
                  Not Found
                </span>
              )}
            </div>
          </div>

          {/* Before Wash Info */}
          <div style={styles.sourceInfoItem}>
            <div style={styles.sourceInfoLabel}>Before Wash</div>
            <div style={styles.sourceInfoValue}>
              {sourceAnalysis.beforeWash.found ? (
                <>
                  <span style={{ ...styles.badge, ...styles.badgeGreen }}>
                    Found
                  </span>
                  <span style={{ marginLeft: "8px" }}>
                    {sourceAnalysis.beforeWash.kValues.length} K-Value(s)
                  </span>
                </>
              ) : (
                <span style={{ ...styles.badge, ...styles.badgeRed }}>
                  Not Found
                </span>
              )}
            </div>
          </div>

          {/* K-Value Details */}
          {sourceAnalysis.beforeWash.found &&
            sourceAnalysis.beforeWash.details.map((detail) => (
              <div key={detail.kValue} style={styles.sourceInfoItem}>
                <div style={styles.sourceInfoLabel}>
                  K-Value: {detail.kValue}
                </div>
                <div style={styles.sourceInfoValue}>
                  {detail.idCount} IDs (Report #{detail.reportId})
                  {detail.size && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        marginLeft: "8px",
                      }}
                    >
                      Size: {detail.size}
                    </span>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderMappingTable = (mappings) => {
    if (!mappings || mappings.length === 0) {
      return <div style={styles.noData}>No mappings available</div>;
    }

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>No</th>
              <th style={styles.th}>Measurement Point</th>
              <th style={styles.th}>Old ID</th>
              <th style={styles.th}>→</th>
              <th style={styles.th}>New ID</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((mapping, idx) => (
              <tr
                key={idx}
                style={
                  mapping.isChanged ? styles.changedRow : styles.unchangedRow
                }
              >
                <td style={styles.td}>{mapping.no}</td>
                <td style={styles.td}>
                  <div>{mapping.pointName}</div>
                  {mapping.pointNameChi && (
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {mapping.pointNameChi}
                    </div>
                  )}
                </td>
                <td
                  style={{ ...styles.td, ...styles.idCell }}
                  title={mapping.oldId}
                >
                  {mapping.oldId}
                </td>
                <td style={styles.td}>→</td>
                <td
                  style={{ ...styles.td, ...styles.idCell }}
                  title={mapping.newId}
                >
                  {mapping.newId}
                </td>
                <td style={styles.td}>
                  {mapping.isChanged ? (
                    <span style={{ ...styles.badge, ...styles.badgeYellow }}>
                      Will Change
                    </span>
                  ) : (
                    <span style={{ ...styles.badge, ...styles.badgeGreen }}>
                      No Change
                    </span>
                  )}
                  {mapping.isSelected && (
                    <span
                      style={{
                        ...styles.badge,
                        ...styles.badgePurple,
                        marginLeft: "4px",
                      }}
                    >
                      Critical
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBeforeWashTabs = () => {
    if (
      !preview ||
      !preview.mappings.beforeWash ||
      preview.mappings.beforeWash.length === 0
    ) {
      return <div style={styles.noData}>No Before Wash data available</div>;
    }

    return (
      <div>
        {/* K-Value Sub-tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          {preview.mappings.beforeWash.map((kValueData) => (
            <button
              key={kValueData.kValue}
              style={{
                ...styles.button,
                ...(activeBWKValue === kValueData.kValue
                  ? styles.primaryButton
                  : styles.secondaryButton),
                padding: "8px 16px",
              }}
              onClick={() => setActiveBWKValue(kValueData.kValue)}
            >
              {kValueData.kValue}
              <span
                style={{
                  marginLeft: "6px",
                  fontSize: "11px",
                  opacity: 0.8,
                }}
              >
                ({kValueData.mappings.length})
              </span>
            </button>
          ))}
        </div>

        {/* Active K-Value Content */}
        {preview.mappings.beforeWash.map((kValueData) => {
          if (kValueData.kValue !== activeBWKValue) return null;

          const changedCount = kValueData.mappings.filter(
            (m) => m.isChanged,
          ).length;

          return (
            <div key={kValueData.kValue} style={styles.kValueSection}>
              <div style={styles.kValueHeader}>
                <div style={styles.flexRow}>
                  <span style={styles.kValueBadge}>{kValueData.kValue}</span>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>
                    Source: Report #{kValueData.reportId} •{" "}
                    {kValueData.sourceIdCount} IDs
                  </span>
                </div>
                <div style={styles.flexRow}>
                  <span style={{ ...styles.badge, ...styles.badgeYellow }}>
                    {changedCount} to update
                  </span>
                  <span style={{ ...styles.badge, ...styles.badgeBlue }}>
                    {kValueData.mappings.length} total
                  </span>
                </div>
              </div>
              {renderMappingTable(kValueData.mappings)}
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div style={styles.container}>
      {/* Add keyframes for loader animation */}
      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Correct Measurement Point IDs</h1>
        <p style={styles.subtitle}>
          Update measurement point IDs in QA Specs from Fincheck Inspection
          Reports.
          <br />
          Supports different IDs per K-Value for Before Wash measurements.
        </p>
      </div>

      {/* Messages */}
      {successMessage && (
        <div style={{ ...styles.alert, ...styles.alertSuccess }}>
          <span>✓</span>
          <span style={{ whiteSpace: "pre-line" }}>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div style={{ ...styles.alert, ...styles.alertError }}>
          <span>✕</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Step 1: Search Source Order */}
      <div style={styles.card}>
        <div style={styles.cardTitle}>
          <span style={styles.stepBadge}>1</span>
          Search Source Order (Fincheck Reports)
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>Order Number</label>
          <input
            type="text"
            style={styles.input}
            placeholder="Enter order number to search..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>

        {isSearching && (
          <div style={{ color: "#6b7280", fontSize: "13px" }}>Searching...</div>
        )}

        {searchResults.length > 0 && (
          <div style={styles.orderList}>
            {searchResults.map((order, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.orderItem,
                  ...(selectedOrder?.orderNo === order.orderNo
                    ? styles.orderItemSelected
                    : {}),
                }}
                onClick={() => handleSelectOrder(order)}
              >
                <span style={{ fontWeight: "500" }}>{order.orderNo}</span>
                <span style={{ ...styles.badge, ...styles.badgeBlue }}>
                  {order.reportCount} report(s)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Source Analysis */}
        {selectedOrder && (
          <div style={{ marginTop: "16px" }}>
            {isAnalyzing ? (
              <div style={{ color: "#6b7280", fontSize: "13px" }}>
                Analyzing source order...
              </div>
            ) : (
              renderSourceAnalysis()
            )}
          </div>
        )}
      </div>

      {/* Step 2: Target Order */}
      {selectedOrder && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span style={styles.stepBadge}>2</span>
            Target QA Specs Order
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Target Order Number (QA Specs to update)
            </label>
            <input
              type="text"
              style={styles.input}
              placeholder="Enter target order number..."
              value={targetOrderNo}
              onChange={handleTargetOrderChange}
            />
          </div>

          {isCheckingSpecs && (
            <div style={{ color: "#6b7280", fontSize: "13px" }}>
              Checking QA specs...
            </div>
          )}

          {qaSpecsInfo && (
            <div
              style={{
                ...styles.alert,
                ...(qaSpecsInfo.exists
                  ? styles.alertInfo
                  : styles.alertWarning),
              }}
            >
              {qaSpecsInfo.exists ? (
                <div>
                  <div>
                    <span>✓</span>
                    <span style={{ marginLeft: "8px" }}>
                      QA Specs found for "{qaSpecsInfo.orderNo}"
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", marginTop: "8px" }}>
                    <strong>After Wash:</strong>{" "}
                    {qaSpecsInfo.counts?.afterWash || 0} points
                    <br />
                    <strong>Before Wash:</strong>{" "}
                    {qaSpecsInfo.counts?.beforeWash || 0} points
                    {qaSpecsInfo.counts?.beforeWashKValues && (
                      <span style={{ marginLeft: "8px" }}>
                        (K-Values:{" "}
                        {Object.entries(qaSpecsInfo.counts.beforeWashKValues)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                        )
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <span>⚠</span>
                  <span>
                    No QA Specs found for this order. Please save specs first.
                  </span>
                </>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <button
              style={{
                ...styles.button,
                ...styles.primaryButton,
                ...(isLoadingPreview || !qaSpecsInfo?.exists || !sourceAnalysis
                  ? styles.disabledButton
                  : {}),
              }}
              onClick={handlePreview}
              disabled={
                isLoadingPreview || !qaSpecsInfo?.exists || !sourceAnalysis
              }
            >
              {isLoadingPreview ? (
                <>
                  <span style={styles.loader}></span>
                  Analyzing & Loading Preview...
                </>
              ) : (
                <>📋 Preview ID Mapping</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Execute */}
      {preview && (
        <div style={styles.card}>
          <div style={styles.cardTitle}>
            <span style={styles.stepBadge}>3</span>
            Preview & Execute Update
          </div>

          {/* Warnings */}
          {preview.warnings &&
            preview.warnings.map((warning, idx) => (
              <div
                key={idx}
                style={{
                  ...styles.alert,
                  ...styles.alertWarning,
                  marginBottom: "12px",
                }}
              >
                <span>⚠</span>
                <span>{warning.message}</span>
              </div>
            ))}

          {/* Summary */}
          <div style={styles.summaryBox}>
            <div style={styles.summaryGrid}>
              {/* After Wash Summary */}
              <div style={styles.summaryItem}>
                <div
                  style={{
                    ...styles.summaryValue,
                    color: preview.summary.afterWash.sourceFound
                      ? "#059669"
                      : "#9ca3af",
                  }}
                >
                  {preview.summary.afterWash.toBeUpdated}
                </div>
                <div style={styles.summaryLabel}>After Wash to Update</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "4px",
                  }}
                >
                  {preview.summary.afterWash.total} total
                </div>
              </div>

              {/* Before Wash Summary */}
              <div style={styles.summaryItem}>
                <div
                  style={{
                    ...styles.summaryValue,
                    color: preview.summary.beforeWash.sourceFound
                      ? "#059669"
                      : "#9ca3af",
                  }}
                >
                  {preview.summary.beforeWash.totalToBeUpdated}
                </div>
                <div style={styles.summaryLabel}>Before Wash to Update</div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#9ca3af",
                    marginTop: "4px",
                  }}
                >
                  {preview.summary.beforeWash.totalSpecs} total across{" "}
                  {preview.summary.beforeWash.kValueCount} K-Value(s)
                </div>
              </div>

              {/* K-Value breakdown */}
              {preview.summary.beforeWash.kValues.map((kv) => (
                <div key={kv.kValue} style={styles.summaryItem}>
                  <div style={{ ...styles.summaryValue, fontSize: "20px" }}>
                    {kv.toBeUpdated}
                  </div>
                  <div style={styles.summaryLabel}>{kv.kValue}</div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#9ca3af",
                      marginTop: "4px",
                    }}
                  >
                    {kv.total} specs, {kv.selectedCount} critical
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={updateAfterWash}
                onChange={(e) => setUpdateAfterWash(e.target.checked)}
                disabled={!preview.summary.afterWash.sourceFound}
              />
              Update After Wash Specs ({preview.summary.afterWash.total} points)
              {!preview.summary.afterWash.sourceFound && (
                <span
                  style={{
                    color: "#ef4444",
                    fontSize: "12px",
                    marginLeft: "8px",
                  }}
                >
                  (No source data)
                </span>
              )}
            </label>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                style={styles.checkbox}
                checked={updateBeforeWash}
                onChange={(e) => setUpdateBeforeWash(e.target.checked)}
                disabled={!preview.summary.beforeWash.sourceFound}
              />
              Update Before Wash Specs ({preview.summary.beforeWash.totalSpecs}{" "}
              points, {preview.summary.beforeWash.kValueCount} K-Values)
              {!preview.summary.beforeWash.sourceFound && (
                <span
                  style={{
                    color: "#ef4444",
                    fontSize: "12px",
                    marginLeft: "8px",
                  }}
                >
                  (No source data)
                </span>
              )}
            </label>
          </div>

          {/* Main Tabs */}
          <div style={styles.tabContainer}>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === "afterWash" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("afterWash")}
            >
              After Wash ({preview.summary.afterWash.total})
            </div>
            <div
              style={{
                ...styles.tab,
                ...(activeTab === "beforeWash" ? styles.tabActive : {}),
              }}
              onClick={() => setActiveTab("beforeWash")}
            >
              Before Wash ({preview.summary.beforeWash.totalSpecs})
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "afterWash" && (
            <div>
              {preview.summary.afterWash.sourceFound ? (
                renderMappingTable(preview.mappings.afterWash)
              ) : (
                <div style={styles.noData}>
                  No After Wash measurement data found in source reports
                </div>
              )}
            </div>
          )}

          {activeTab === "beforeWash" && renderBeforeWashTabs()}

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "24px",
              justifyContent: "flex-end",
            }}
          >
            <button
              style={{ ...styles.button, ...styles.secondaryButton }}
              onClick={handleReset}
            >
              Reset All
            </button>
            <button
              style={{
                ...styles.button,
                ...styles.successButton,
                ...(isExecuting || (!updateAfterWash && !updateBeforeWash)
                  ? styles.disabledButton
                  : {}),
              }}
              onClick={handleExecute}
              disabled={isExecuting || (!updateAfterWash && !updateBeforeWash)}
            >
              {isExecuting ? (
                <>
                  <span style={styles.loader}></span>
                  Executing...
                </>
              ) : (
                <>✓ Execute Update</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrectMeasurementID;
