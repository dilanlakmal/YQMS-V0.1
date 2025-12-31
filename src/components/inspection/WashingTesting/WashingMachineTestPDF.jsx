import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica"
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center"
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center"
  },
  section: {
    marginBottom: 15
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
    paddingRight: 10
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
    width: 150,
    height: 150,
    objectFit: "contain"
  }
});

const WashingMachineTestPDF = ({ report, apiBaseUrl = "", qrCodeDataURL = null }) => {
  // Normalize image URL for PDF rendering - use image-proxy for better compatibility
  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    
    // If it's a data URL (base64), return as is
    if (imageUrl.startsWith("data:")) {
      return imageUrl;
    }
    
    // Build the full URL first
    let fullUrl = imageUrl;
    
    // If already a full URL, use it
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      fullUrl = imageUrl;
    } 
    // Extract filename from URL if it contains washing_machine_test
    else if (imageUrl.includes("/washing_machine_test/")) {
      const filename = imageUrl.split("/washing_machine_test/")[1];
      if (filename && apiBaseUrl) {
        fullUrl = `${apiBaseUrl}/api/report-washing/image/${filename}`;
      } else if (apiBaseUrl) {
        fullUrl = `${apiBaseUrl}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
      }
    }
    // If starts with /storage/, prepend API_BASE_URL
    else if (imageUrl.startsWith("/storage/") && apiBaseUrl) {
      fullUrl = `${apiBaseUrl}${imageUrl}`;
    }
    // If starts with /, prepend API_BASE_URL
    else if (imageUrl.startsWith("/") && apiBaseUrl) {
      fullUrl = `${apiBaseUrl}${imageUrl}`;
    }
    // Otherwise, assume it's a filename and prepend the storage path
    else if (apiBaseUrl) {
      fullUrl = `${apiBaseUrl}/storage/washing_machine_test/${imageUrl}`;
    }
    
    // Use image-proxy endpoint for better compatibility with @react-pdf/renderer
    // This helps with CORS and ensures images load properly
    if (apiBaseUrl && fullUrl) {
      return `${apiBaseUrl}/api/image-proxy?url=${encodeURIComponent(fullUrl)}`;
    }
    
    return fullUrl;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.companyName}>
          Yorkmars (Cambodia) Garment MFG Co., LTD
        </Text>
        <Text style={styles.title}>Laundry Washing Machine Test Report</Text>
        
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>YM Style:</Text>
              <Text style={styles.value}>{report.ymStyle || "N/A"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Buyer Style:</Text>
              <Text style={styles.value}>{report.buyerStyle || "N/A"}</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Factory:</Text>
              <Text style={styles.value}>{report.factory || "N/A"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Report Date:</Text>
              <Text style={styles.value}>
                {report.reportDate 
                  ? new Date(report.reportDate).toLocaleDateString() 
                  : "N/A"}
              </Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Send To Home Washing Date:</Text>
              <Text style={styles.value}>
                {report.sendToHomeWashingDate 
                  ? new Date(report.sendToHomeWashingDate).toLocaleDateString() 
                  : "N/A"}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Submitted By:</Text>
              <Text style={styles.value}>{report.engName || report.userName || report.userId || "N/A"}</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Submitted At:</Text>
              <Text style={styles.value}>
                {report.createdAt 
                  ? new Date(report.createdAt).toLocaleString() 
                  : report.submittedAt 
                  ? new Date(report.submittedAt).toLocaleString()
                  : "N/A"}
              </Text>
            </View>
          </View>

          {/* Status Information */}
          {/* {(report.status || report.receivedDate || report.completedDate) && (
            <View style={styles.section}>
              <Text style={styles.label}>Status Information:</Text>
              <View style={styles.row}>
                {report.status && (
                  <View style={styles.col}>
                    <Text style={styles.label}>Status:</Text>
                    <Text style={styles.value}>
                      {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                    </Text>
                  </View>
                )}
                {report.receivedDate && (
                  <View style={styles.col}>
                    <Text style={styles.label}>Received Date:</Text>
                    <Text style={styles.value}>
                      {report.receivedAt
                        ? new Date(report.receivedAt).toLocaleString()
                        : report.receivedDate}
                    </Text>
                  </View>
                )}
                {report.completedDate && (
                  <View style={styles.col}>
                    <Text style={styles.label}>Completed Date:</Text>
                    <Text style={styles.value}>
                      {report.completedAt
                        ? new Date(report.completedAt).toLocaleString()
                        : report.completedDate}
                    </Text>
                  </View>
                )}
              </View>
              {report.completionNotes && (
                <View style={styles.section}>
                  <Text style={styles.label}>Completion Notes:</Text>
                  <Text style={styles.value}>{report.completionNotes}</Text>
                </View>
              )}
            </View>
          )} */}
        </View>

        <View style={styles.section}>
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

        {report.images && report.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Initial Images ({report.images.length}):</Text>
            <View style={styles.imagesGrid}>
              {report.images.map((url, idx) => {
                const normalizedUrl = normalizeImageUrl(url);
                if (!normalizedUrl) {
                  return (
                    <View key={idx} style={styles.imageWrapper}>
                      <Text style={styles.value}>Image {idx + 1}: Invalid URL</Text>
                    </View>
                  );
                }
                return (
                  <View key={idx} style={styles.imageWrapper}>
                    <Image
                      src={normalizedUrl}
                      style={styles.image}
                      cache={false}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {report.completionImages && report.completionImages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Completion Images ({report.completionImages.length}):</Text>
            <View style={styles.imagesGrid}>
              {report.completionImages.map((url, idx) => {
                const normalizedUrl = normalizeImageUrl(url);
                if (!normalizedUrl) {
                  return (
                    <View key={idx} style={styles.imageWrapper}>
                      <Text style={styles.value}>Image {idx + 1}: Invalid URL</Text>
                    </View>
                  );
                }
                return (
                  <View key={idx} style={styles.imageWrapper}>
                    <Image
                      src={normalizedUrl}
                      style={styles.image}
                      cache={false}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* QR Code Section for Report Date Scanning */}
        {qrCodeDataURL && (
          <View style={styles.section}>
            {/* <Text style={styles.label}>Scan QR Code to Set Report Date:</Text> */}
            <View style={{ alignItems: "center", marginTop: 10 }}>
              <Image
                src={qrCodeDataURL}
                style={{
                  width: 100,
                  height: 100,
                  border: "1px solid #ddd",
                  padding: 5
                }}
              />
              {/* <Text style={{ ...styles.value, textAlign: "center", marginTop: 5, fontSize: 8 }}>
                Scan this QR code to automatically set the report date
              </Text> */}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};

export default WashingMachineTestPDF;

