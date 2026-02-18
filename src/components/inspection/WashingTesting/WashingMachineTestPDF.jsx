import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 9,
    fontFamily: "Helvetica"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  section: {
    marginBottom: 10,
    marginTop: 2
  },
  label: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 3,
    color: "#666"
  },
  value: {
    fontSize: 10,
    marginBottom: 8
  },
  row: {
    flexDirection: "row",
    marginBottom: 10
  },
  col: {
    width: "50%",
    paddingRight: 5
  },
  badge: {
    backgroundColor: "#E3F2FD",
    padding: "2px 6px",
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
    fontSize: 8
  },
  imageContainer: {
    marginTop: 10,
    marginBottom: 10
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 5
  },
  imageWrapper: {
    marginRight: 10,
    marginBottom: 10,
    border: "1px solid #ddd",
    padding: 5
  },
  image: {
    width: 120,
    height: 120,
    objectFit: "contain"
  },
  imagesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  imageColumn: {
    width: "32%"
  },
  qrCodeContainer: {
    position: "absolute",
    top: 30,
    right: 30,
    alignItems: "center",
    width: 75
  },
  qrCodeImage: {
    width: 65,
    height: 65,
    border: "1px solid #eee",
    padding: 3
  },
  qrCodeLabel: {
    fontSize: 6,
    color: "#888",
    marginTop: 2,
    textAlign: "center"
  },
  notesBox: {
    padding: 6,
    borderRadius: 4,
    marginTop: 5,
    marginBottom: 5,
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
  },
  notesContent: {
    fontSize: 9,
    lineHeight: 1.2,
  },
  initialNotesBox: {
    backgroundColor: "#E3F2FD",
    border: "1px solid #BBDEFB",
  },
  initialNotesLabel: {
    color: "#1976D2",
  },
  receivedNotesBox: {
    backgroundColor: "#FFF9C4",
    border: "1px solid #FFF176",
  },
  receivedNotesLabel: {
    color: "#FBC02D",
  },
  completionNotesLabel: {
    color: "#388E3C",
  },
  stepHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 2
  },
  stepTitle: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#333"
  },
  stepDate: {
    fontSize: 7.5,
    color: "#666"
  }
});

// Resolve emp_id to display name from users list; fallback to id
const getNameForView = (empId, storedName, users = []) => {
  if (storedName && String(storedName).trim()) return storedName;
  if (!empId) return null;
  const u = users.find((user) => String(user.emp_id) === String(empId) || String(user.id) === String(empId));
  return u ? (u.name || u.eng_name || u.emp_id) : null;
};

const WashingMachineTestPDF = ({ report, apiBaseUrl = "", qrCodeDataURL = null, savedImageRotations = {}, users = [] }) => {
  // Helper to get rotation for an image URL
  const getImageRotation = (imageUrl) => {
    if (!imageUrl || !savedImageRotations) return 0;

    // Use a basic normalization to match the keys in savedImageRotations
    // This should match the logic in WashingTesting/utils.js
    const getBaseNormalizedUrl = (url) => {
      if (!url) return "";
      if (url.startsWith("data:")) return url;

      let filename = "";
      if (url.includes("/washing_machine_test/")) {
        filename = url.split("/washing_machine_test/")[1];
      } else if (url.includes("washing-test-")) {
        filename = url.split("/").pop();
      }

      if (filename) return `${apiBaseUrl}/api/report-washing/image/${filename}`;
      if (url.startsWith("http://") || url.startsWith("https://")) return url;
      if (url.startsWith("/storage/")) return `${apiBaseUrl}${url}`;
      if (url.startsWith("storage/")) return `${apiBaseUrl}/${url}`;
      if (url.includes(apiBaseUrl)) return url;

      const cleanPath = url.startsWith("/") ? url : `/${url}`;
      return `${apiBaseUrl}${cleanPath}`;
    };

    const key = getBaseNormalizedUrl(imageUrl);
    return savedImageRotations[key] || 0;
  };

  // Normalize image URL for PDF rendering
  // Uses /api/report-washing/image/:filename endpoint which converts WebP→JPEG on the fly.
  // Appends .jpg to the URL path so @react-pdf/renderer passes its extension validation.
  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return null;

    // If it's a data URL (base64), return as is
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }

    // Extract just the filename from whatever URL format is stored
    let filename = null;

    if (imageUrl.includes("/washing_machine_test/")) {
      filename = imageUrl.split("/washing_machine_test/")[1];
    } else if (imageUrl.includes("washing-test-")) {
      filename = imageUrl.split("/").pop();
    } else if (imageUrl.startsWith("/storage/")) {
      filename = imageUrl.split("/").pop();
    } else if (!imageUrl.includes("/")) {
      // Already just a filename
      filename = imageUrl;
    }

    // Remove any query params from filename
    if (filename && filename.includes("?")) {
      filename = filename.split("?")[0];
    }

    if (filename && apiBaseUrl) {
      // Append .jpg so @react-pdf/renderer passes its URL extension check.
      // The backend strips this suffix and serves the real file converted to JPEG.
      return `${apiBaseUrl}/api/report-washing/image/${filename}.jpg`;
    }

    // Fallback: return the original URL
    return imageUrl;
  };

  const useCompactLayout = (report.images?.length || 0) <= 1 &&
    (report.receivedImages?.length || 0) <= 1 &&
    (report.completionImages?.length || 0) <= 1;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.companyName}>
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </Text>
        <Text style={styles.title}>Launch Washing Machine Test Report</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <View style={[styles.col, { flexDirection: "row", alignItems: "baseline", width: "100%" }]}>
              <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>Report Type:</Text>
              <Text style={[styles.value, { marginBottom: 0, fontWeight: "bold", color: "#1976D2" }]}>{report.reportType || "Home Wash Test"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.col, { flexDirection: "row", alignItems: "baseline" }]}>
              <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>YM Style:</Text>
              <Text style={[styles.value, { marginBottom: 0 }]}>{report.ymStyle || "N/A"}</Text>
            </View>
            <View style={[styles.col, { flexDirection: "row", alignItems: "baseline" }]}>
              <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>Buyer Style:</Text>
              <Text style={[styles.value, { marginBottom: 0 }]}>{report.buyerStyle || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.col, { flexDirection: "row", alignItems: "baseline" }]}>
              <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>Factory:</Text>
              <Text style={[styles.value, { marginBottom: 0 }]}>{report.factory || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.col, { flexDirection: "row", alignItems: "baseline" }]}>
              <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>Submitted By:</Text>
              <Text style={[styles.value, { marginBottom: 0 }]}>{getNameForView(report.reporter_emp_id, report.reporter_name, users) || report.reporter_emp_id || "N/A"}</Text>
            </View>
            <View style={[styles.col, { flexDirection: "row", alignItems: "baseline" }]}>
              <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>Submitted At:</Text>
              <Text style={[styles.value, { marginBottom: 0 }]}>
                {report.createdAt
                  ? new Date(report.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                  : report.submittedAt
                    ? new Date(report.submittedAt).toLocaleString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
                    : "N/A"}
              </Text>
            </View>
          </View>

          {!!report.status && (
            <View style={styles.row}>
              <View style={[styles.col, { flexDirection: "row", alignItems: "baseline" }]}>
                <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>Status:</Text>
                <Text style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: report.status === 'completed' ? '#2e7d32' : report.status === 'received' ? '#1976d2' : '#ed6c02',
                  marginBottom: 0
                }}>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </Text>
              </View>
            </View>
          )}

          {report.status === 'completed' && (report.checkedBy || report.approvedBy) && (
            <View style={styles.row}>
              <View style={[styles.col, { flexDirection: "row", alignItems: "baseline" }]}>
                <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>Checked By:</Text>
                <Text style={[styles.value, { marginBottom: 0 }]}>
                  {(() => {
                    const name = getNameForView(report.checkedBy, report.checkedByName, users);
                    return name ? (name !== report.checkedBy ? `${name} (${report.checkedBy})` : name) : (report.checkedBy || "N/A");
                  })()}
                </Text>
              </View>
              <View style={[styles.col, { flexDirection: "row", alignItems: "baseline" }]}>
                <Text style={[styles.label, { marginRight: 5, marginBottom: 0 }]}>Approved By:</Text>
                <Text style={[styles.value, { marginBottom: 0 }]}>
                  {(() => {
                    const name = getNameForView(report.approvedBy, report.approvedByName, users);
                    return name ? (name !== report.approvedBy ? `${name} (${report.approvedBy})` : name) : (report.approvedBy || "N/A");
                  })()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {!!qrCodeDataURL && (
          <View style={styles.qrCodeContainer}>
            <Image
              src={qrCodeDataURL}
              style={styles.qrCodeImage}
            />
            <Text style={styles.qrCodeLabel}>Scan to Set Date</Text>
          </View>
        )}

        <View style={[styles.section, { marginTop: 5 }]}>
          <Text style={styles.label}>Colors:</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {report.color && report.color.length > 0 ? (
              report.color.map((color, idx) => (
                <Text key={idx} style={styles.badge}>{color}</Text>
              ))
            ) : (
              <Text style={styles.value}>N/A</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>PO:</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {report.po && report.po.length > 0 ? (
              report.po.map((po, idx) => (
                <Text key={idx} style={styles.badge}>{po}</Text>
              ))
            ) : (
              <Text style={styles.value}>N/A</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Ex Fty Date:</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {report.exFtyDate && report.exFtyDate.length > 0 ? (
              report.exFtyDate.map((date, idx) => (
                <Text key={idx} style={styles.badge}>{date}</Text>
              ))
            ) : (
              <Text style={styles.value}>N/A</Text>
            )}
          </View>
        </View>

        {useCompactLayout ? (
          <View style={styles.imagesRow}>
            {/* Step 1 Column */}
            <View style={styles.imageColumn}>
              {!!((report.images && report.images.length > 0) || report.notes) && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>Step 1: Sent To Wash ({report.images?.length || 0} imgs)</Text>
                    <Text style={styles.stepDate}>
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
                        : report.submittedAt
                          ? new Date(report.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
                          : "N/A"}
                    </Text>
                  </View>
                  {report.images && report.images.length > 0 && (
                    <View style={styles.imagesGrid}>
                      {report.images.map((url, idx) => {
                        const normalizedUrl = normalizeImageUrl(url);
                        if (!normalizedUrl) return null;
                        const rotation = getImageRotation(url);
                        return (
                          <View key={idx} style={styles.imageWrapper}>
                            <Image
                              src={normalizedUrl}
                              style={{
                                ...styles.image,
                                transform: rotation ? `rotate(${rotation}deg)` : undefined
                              }}
                              cache={false}
                            />
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {!!report.notes && (
                    <View style={[styles.notesBox, styles.initialNotesBox]}>
                      <Text style={[styles.notesLabel, styles.initialNotesLabel]}>Notes:</Text>
                      <Text style={styles.notesContent}>{report.notes}</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Step 2 Column */}
            <View style={styles.imageColumn}>
              {!!((report.receivedImages && report.receivedImages.length > 0) || report.receivedNotes) && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>Step 2: Received ({report.receivedImages?.length || 0} imgs)</Text>
                    <Text style={styles.stepDate}>
                      {report.receivedAt
                        ? new Date(report.receivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
                        : "N/A"}
                    </Text>
                  </View>
                  {report.receivedImages && report.receivedImages.length > 0 && (
                    <View style={styles.imagesGrid}>
                      {report.receivedImages.map((url, idx) => {
                        const normalizedUrl = normalizeImageUrl(url);
                        if (!normalizedUrl) return null;
                        const rotation = getImageRotation(url);
                        return (
                          <View key={idx} style={styles.imageWrapper}>
                            <Image
                              src={normalizedUrl}
                              style={{
                                ...styles.image,
                                transform: rotation ? `rotate(${rotation}deg)` : undefined
                              }}
                              cache={false}
                            />
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {!!report.receivedNotes && (
                    <View style={[styles.notesBox, styles.receivedNotesBox]}>
                      <Text style={[styles.notesLabel, styles.receivedNotesLabel]}>Notes:</Text>
                      <Text style={styles.notesContent}>{report.receivedNotes}</Text>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Step 3 Column */}
            <View style={styles.imageColumn}>
              {!!((report.completionImages && report.completionImages.length > 0) || report.completionNotes) && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>Step 3: Done ({report.completionImages?.length || 0} imgs)</Text>
                    <Text style={styles.stepDate}>
                      {report.completedAt
                        ? new Date(report.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' })
                        : "N/A"}
                    </Text>
                  </View>
                  {report.completionImages && report.completionImages.length > 0 && (
                    <View style={styles.imagesGrid}>
                      {report.completionImages.map((url, idx) => {
                        const normalizedUrl = normalizeImageUrl(url);
                        if (!normalizedUrl) return null;
                        const rotation = getImageRotation(url);
                        return (
                          <View key={idx} style={styles.imageWrapper}>
                            <Image
                              src={normalizedUrl}
                              style={{
                                ...styles.image,
                                transform: rotation ? `rotate(${rotation}deg)` : undefined
                              }}
                              cache={false}
                            />
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {!!report.completionNotes && (
                    <View style={[styles.notesBox, styles.completionNotesBox]}>
                      <Text style={[styles.notesLabel, styles.completionNotesLabel]}>Notes:</Text>
                      <Text style={styles.notesContent}>{report.completionNotes}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </View>
        ) : (
          <>
            {/* Regular Layout - Stacked Sections */}
            {!!((report.images && report.images.length > 0) || report.notes) && (
              <View style={[styles.section, { marginTop: 10 }]} wrap={false}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Step 1: Sent To Home Washing ({report.images?.length || 0} images)</Text>
                  <Text style={styles.stepDate}>
                    {(report.createdAt || report.submittedAt)
                      ? new Date(report.createdAt || report.submittedAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                      : report.sendToHomeWashingDate
                        ? new Date(report.sendToHomeWashingDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'numeric',
                          year: 'numeric'
                        })
                        : "N/A"}
                  </Text>
                </View>
                {report.images && report.images.length > 0 && (
                  <View style={styles.imagesGrid}>
                    {report.images.map((url, idx) => {
                      const normalizedUrl = normalizeImageUrl(url);
                      if (!normalizedUrl) return null;
                      const rotation = getImageRotation(url);
                      return (
                        <View key={idx} style={styles.imageWrapper}>
                          <Image
                            src={normalizedUrl}
                            style={{
                              ...styles.image,
                              transform: rotation ? `rotate(${rotation}deg)` : undefined
                            }}
                            cache={false}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
                {!!report.notes && (
                  <View style={[styles.notesBox, styles.initialNotesBox]}>
                    <Text style={[styles.notesLabel, styles.initialNotesLabel]}>Notes:</Text>
                    <Text style={styles.notesContent}>{report.notes}</Text>
                  </View>
                )}
              </View>
            )}

            {!!((report.receivedImages && report.receivedImages.length > 0) || report.receivedNotes) && (
              <View style={styles.section} wrap={false}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Step 2: Received ({report.receivedImages?.length || 0} images)</Text>
                  <Text style={styles.stepDate}>
                    {report.receivedAt
                      ? new Date(report.receivedAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                      : "Not yet received"}
                  </Text>
                </View>
                {report.receivedImages && report.receivedImages.length > 0 && (
                  <View style={styles.imagesGrid}>
                    {report.receivedImages.map((url, idx) => {
                      const normalizedUrl = normalizeImageUrl(url);
                      if (!normalizedUrl) return null;
                      const rotation = getImageRotation(url);
                      return (
                        <View key={idx} style={styles.imageWrapper}>
                          <Image
                            src={normalizedUrl}
                            style={{
                              ...styles.image,
                              transform: rotation ? `rotate(${rotation}deg)` : undefined
                            }}
                            cache={false}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
                {!!report.receivedNotes && (
                  <View style={[styles.notesBox, styles.receivedNotesBox]}>
                    <Text style={[styles.notesLabel, styles.receivedNotesLabel]}>Notes:</Text>
                    <Text style={styles.notesContent}>{report.receivedNotes}</Text>
                  </View>
                )}
              </View>
            )}

            {!!((report.completionImages && report.completionImages.length > 0) || report.completionNotes) && (
              <View style={styles.section} wrap={false}>
                <View style={styles.stepHeader}>
                  <Text style={styles.stepTitle}>Step 3: Completed ({report.completionImages?.length || 0} images)</Text>
                  <Text style={styles.stepDate}>
                    {report.completedAt
                      ? new Date(report.completedAt).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })
                      : "Not yet completed"}
                  </Text>
                </View>
                {report.completionImages && report.completionImages.length > 0 && (
                  <View style={styles.imagesGrid}>
                    {report.completionImages.map((url, idx) => {
                      const normalizedUrl = normalizeImageUrl(url);
                      if (!normalizedUrl) return null;
                      const rotation = getImageRotation(url);
                      return (
                        <View key={idx} style={styles.imageWrapper}>
                          <Image
                            src={normalizedUrl}
                            style={{
                              ...styles.image,
                              transform: rotation ? `rotate(${rotation}deg)` : undefined
                            }}
                            cache={false}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}
                {!!report.completionNotes && (
                  <View style={[styles.notesBox, styles.completionNotesBox]}>
                    <Text style={[styles.notesLabel, styles.completionNotesLabel]}>Notes:</Text>
                    <Text style={styles.notesContent}>{report.completionNotes}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </Page>
    </Document>
  );
};

export default WashingMachineTestPDF;
