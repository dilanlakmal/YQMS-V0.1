import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  Image
} from "@react-pdf/renderer";
import { API_BASE_URL } from "../../../../config";

// Register Fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "/fonts/Roboto-Regular.ttf" },
    { src: "/fonts/Roboto-Bold.ttf", fontWeight: "bold" }
  ]
});

// Define Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    padding: 0,
    backgroundColor: "#ffffff"
  },
  // Header Section
  headerContainer: {
    
    padding: 20,
    paddingTop: 15,
    borderBottom: "2px solid #e5e7eb"
  },
  headerRow: {
   
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 16
  },
  logoArea: {
    alignItems: "center",
    justifyContent: "center"
  },
  logo: {
    width: 80,
    height: 80,
    objectFit: "contain"
  },
  headerTextContainer: {
    flex: 1
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 5
  },
  inspectionNumbers: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 3
  },
  passButton: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    padding: "8px 20px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold"
  },
  rejectButton: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    padding: "8px 20px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold"
  },
  pendingButton: {
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    padding: "8px 20px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: "bold"
  },
  // Section Headers (Dark Blue)
  sectionHeader: {
    backgroundColor: "#1e3a8a",
    color: "#ffffff",
    padding: 10,
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 15
  },
  // Content Sections
  contentSection: {
    padding: 18,
    backgroundColor: "#ffffff",
    marginBottom: 15
  },
  // Checklist Section - keep together on one page
  checklistSection: {
    break: "avoid"
  },
  // Date Header Row
  dateHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f0f4f8",
    padding: 10,
    borderBottom: "1px solid #e5e7eb"
  },
  dateHeaderItem: {
    flex: 1,
    paddingRight: 10,
    textAlign: "center"
  },
  dateHeaderLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 2,
    textAlign: "center"
  },
  dateHeaderValue: {
    fontSize: 9,
    color: "#111827",
    textAlign: "center"
  },
  // Two Column Layout
  twoColumnRow: {
    flexDirection: "row",
    marginBottom: 8,
    borderBottom: "1px solid #f3f4f6",
    paddingBottom: 5
  },
  twoColumnLabel: {
    width: "40%",
    fontWeight: "bold",
    color: "#374151",
    fontSize: 9
  },
  twoColumnValue: {
    width: "60%",
    color: "#111827",
    fontSize: 9
  },
  // Checklist Section
  checklistRow: {
    flexDirection: "row",
    marginBottom: 7,
    paddingBottom: 6,
    borderBottom: "1px solid #f3f4f6",
    break: false
  },
  checklistLabel: {
    width: "50%",
    fontSize: 9,
    color: "#374151"
  },
  checklistValue: {
    width: "50%",
    fontSize: 9,
    color: "#059669",
    fontWeight: "bold",
    textAlign: "center"
  },
  // Table Styles
  table: {
    width: "100%",
    marginTop: 10,
    marginBottom: 10
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #d1d5db"
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    padding: 8,
    fontSize: 9,
    fontWeight: "bold",
    borderRight: "1px solid #d1d5db",
    textAlign: "center"
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    borderRight: "1px solid #d1d5db",
    textAlign: "center"
  },
  // Conclusion Section
  conclusionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#ffffff",
    marginBottom: 8
  },
  conclusionLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151"
  },
  conclusionValue: {
    fontSize: 12,
    fontWeight: "bold"
  },
  passValue: {
    color: "#059669"
  },
  rejectValue: {
    color: "#dc2626"
  },
  // Defect Summary Table
  defectSummaryTable: {
    width: "100%",
    marginTop: 10,
    backgroundColor: "#f9fafb"
  },
  defectSummaryRow: {
    flexDirection: "row",
    borderBottom: "1px solid #d1d5db"
  },
  defectSummaryHeader: {
    backgroundColor: "#e5e7eb",
    padding: 8,
    fontSize: 9,
    fontWeight: "bold",
    borderRight: "1px solid #d1d5db",
    textAlign: "center"
  },
  defectSummaryCell: {
    padding: 8,
    fontSize: 9,
    borderRight: "1px solid #d1d5db",
    textAlign: "center"
  },
  // AQL Table
  aqlTable: {
    width: "100%",
    marginTop: 10
  },
  aqlRow: {
    flexDirection: "row",
    borderBottom: "1px solid #d1d5db"
  },
  aqlHeader: {
    backgroundColor: "#f3f4f6",
    padding: 6,
    fontSize: 8,
    fontWeight: "bold",
    borderRight: "1px solid #d1d5db",
    textAlign: "center"
  },
  aqlCell: {
    padding: 6,
    fontSize: 8,
    borderRight: "1px solid #d1d5db",
    textAlign: "center"
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#6b7280",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 8
  },
  // Badge Styles
  badge: {
    padding: "4px 12px",
    borderRadius: 12,
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center"
  },
  passBadge: {
    backgroundColor: "#d1fae5",
    color: "#065f46"
  },
  rejectBadge: {
    backgroundColor: "#fee2e2",
    color: "#991b1b"
  },
  naBadge: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280"
  },
  // Photo Styles
  photoCategory: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottom: "none"
  },
  photoCategoryTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 15,
    marginTop: 5,
    paddingTop: 12
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  photoRow: {
    flexDirection: "row",
    marginBottom: 15
  },
  photoRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15
  },
  photoItem: {
    marginBottom: 20
  },
  // Dynamic photo item widths based on photos per row
  photoItem1PerRow: {
    width: "48%",
    marginRight: "2%",
    marginLeft: "1%"
  },
  photoItem2PerRow: {
    width: "49%",
    marginRight: "1%"
  },
  photoItem3PerRow: {
    width: "31%",
    marginRight: "2%",
    marginLeft: "0.5%"
  },
  photoItem4PerRow: {
    width: "23%",
    marginRight: "1.5%",
    marginLeft: "0.5%"
  },
  photoImageContainer: {
    width: "100%",
    backgroundColor: "#f9fafb",
    border: "2px dashed #d1d5db",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    overflow: "hidden"
  },
  // Dynamic image container heights based on photos per row
  photoImageContainer1PerRow: {
    height: 280,
    minHeight: 280
  },
  photoImageContainer2PerRow: {
    height: 280,
    minHeight: 280
  },
  photoImageContainer3PerRow: {
    height: 230,
    minHeight: 230
  },
  photoImageContainer4PerRow: {
    height: 180,
    minHeight: 180
  },
  photoImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    maxWidth: "100%",
    maxHeight: "100%"
  },
  photoDescription: {
    fontSize: 8,
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
    paddingHorizontal: 4
  },
  // Defect Styles
  defectItem: {
    marginBottom: 20,
    width: "48%",
    marginRight: "2%"
  },
  defectImageContainer: {
    width: "100%",
    backgroundColor: "#f9fafb",
    border: "2px dashed #d1d5db",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    overflow: "hidden",
    height: 200,
    minHeight: 200
  },
  defectImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    maxWidth: "100%",
    maxHeight: "100%"
  },
  defectInfo: {
    marginTop: 8,
    fontSize: 8,
    color: "#374151",
    width: "100%"
  },
  defectInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: "1px solid #f3f4f6",
    width: "100%"
  },
  defectInfoLabel: {
    fontWeight: "bold",
    color: "#6b7280",
    fontSize: 8,
    flex: 1
  },
  defectInfoValue: {
    color: "#111827",
    fontSize: 8,
    flex: 1,
    textAlign: "right"
  },
  defectRemarks: {
    width: "100%"
  },
  defectRemarksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    width: "100%"
  },
  defectRemarksLabel: {
    fontWeight: "bold",
    fontSize: 8,
    color: "#6b7280",
    flex: 0,
    marginRight: 8,
    minWidth: 60
  },
  defectRemarksText: {
    fontSize: 8,
    color: "#4b5563",
    flex: 1,
    textAlign: "right"
  }
});

// Helper function to normalize image URLs - use image-proxy for better compatibility
const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  
  // If already a data URI, return as is
  if (imageUrl.startsWith("data:")) {
    return imageUrl;
  }
  
  // Build the full URL first
  let fullUrl = imageUrl;
  
  // If already a full URL, use it
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    fullUrl = imageUrl;
  } 
  // If starts with /storage/, prepend API_BASE_URL
  else if (imageUrl.startsWith("/storage/")) {
    fullUrl = `${API_BASE_URL}${imageUrl}`;
  }
  // If starts with /, prepend API_BASE_URL
  else if (imageUrl.startsWith("/")) {
    fullUrl = `${API_BASE_URL}${imageUrl}`;
  }
  // Otherwise, assume it's a filename and prepend the storage path
  else {
    fullUrl = `${API_BASE_URL}/storage/sub-emb-images/${imageUrl}`;
  }
  
  // Use image-proxy endpoint for better compatibility with @react-pdf/renderer
  // This helps with CORS and ensures images load properly
  return `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(fullUrl)}`;
};

const EMBReportPDF = ({ report, isPrinting = false }) => {
  if (!report) {
    console.warn("EMBReportPDF: No report data provided");
    return null;
  }

  // Debug: Log report data only when printing
  if (isPrinting) {
    console.log("EMBReportPDF - Report data:", {
      inspectionType: report.inspectionType,
      reportType: report.reportType,
      inspectionDate: report.inspectionDate,
      factoryName: report.factoryName,
      moNo: report.moNo,
      totalPcs: report.totalPcs,
      defectsQty: report.defectsQty,
      result: report.result,
      hasAqlData: !!report.aqlData,
      hasDefects: !!report.defects && report.defects.length > 0,
      hasChecklist: !!report.checklist,
      hasPhotos: !!report.photos,
      photosKeys: report.photos ? Object.keys(report.photos) : [],
      photosCount: report.photos ? Object.keys(report.photos).length : 0,
      photosStructure: report.photos ? typeof report.photos : "none"
    });
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "N/A";
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const formattedHours = String(hours).padStart(2, "0");
      return `${month}/${day}/${year}, ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      return "N/A";
    }
  };

  const formatTime = (timeString) => {
    return timeString || "N/A";
  };

  const formatInspectionDateTime = (dateString, timeString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";

      // Format given timeString (if provided) as 12-hour
      if (timeString) {
        // Assume timeString is in "HH:mm" or "H:mm" or "HH:mm:ss" or similar format
        // Extract hours and minutes
        const timeParts = timeString.split(":");
        let hours = parseInt(timeParts[0], 10);
        let minutes = timeParts[1] ? String(timeParts[1]).padStart(2, "0") : "00";
        let ampm = hours >= 12 ? "PM" : "AM";
        let formattedHours = hours % 12;
        formattedHours = formattedHours ? formattedHours : 12; // the hour '0' should be '12'
        formattedHours = String(formattedHours).padStart(2, "0");
        const formattedTime = `${formattedHours}:${minutes} ${ampm}`;

        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const year = date.getFullYear();
        return `${month}/${day}/${year}, ${formattedTime}`;
      }

      // Otherwise, format the date's time in 12-hour format
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedHours = String(hours).padStart(2, "0");
      return `${month}/${day}/${year}, ${formattedHours}:${minutes} ${ampm}`;
    } catch (error) {
      return "N/A";
    }
  };

  const getStatusButtonStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return styles.passButton;
      case "rejected":
        return styles.rejectButton;
      default:
        return styles.pendingButton;
    }
  };

  const getResultButtonStyle = (result) => {
    switch (result?.toLowerCase()) {
      case "pass":
        return styles.passButton;
      case "reject":
        return styles.rejectButton;
      default:
        return styles.pendingButton;
    }
  };

  const getResultTextStyle = (result) => {
    switch (result?.toLowerCase()) {
      case "pass":
        return styles.passValue;
      case "reject":
        return styles.rejectValue;
      default:
        return {};
    }
  };

  const getResultBadgeStyle = (result) => {
    switch (result?.toLowerCase()) {
      case "pass":
        return styles.passBadge;
      case "reject":
        return styles.rejectBadge;
      default:
        return styles.naBadge;
    }
  };

  // Calculate defect counts by category
  const calculateDefectCounts = () => {
    if (!report.defects || report.defects.length === 0) {
      return { critical: 0, major: 0, minor: 0 };
    }
    
    let critical = 0, major = 0, minor = 0;
    report.defects.forEach(defect => {
      const category = defect.category?.toLowerCase() || "";
      const qty = defect.qty || defect.count || 0;
      
      if (category.includes("critical")) {
        critical += qty;
      } else if (category.includes("major")) {
        major += qty;
      } else {
        minor += qty;
      }
    });
    
    return { critical, major, minor };
  };

  const defectCounts = calculateDefectCounts();

  // Checklist items mapping
  const checklistItems = [
    { key: "orderType", label: "Order Type" },
    { key: "samplesAvailable", label: "Samples Available" },
    { key: "labAnalysisTesting", label: "Lab Analysis & Testing" },
    { key: "masterCartonRequirements", label: "Master Carton Requirements" },
    { key: "dropTest", label: "Drop Test" },
    { key: "price", label: "Price" },
    { key: "hangTags", label: "Hang Tags" },
    { key: "labels", label: "Labels" },
    { key: "composition", label: "Composition" }
  ];

  // Helper function to group photos by category - only first photo per category (matching EMBInspectionView)
  const groupPhotosByCategory = () => {
    if (!report.photos) return [];
    
    const categories = [];
    
    // Get all photo categories - Object.keys() preserves insertion order in modern JavaScript
    const photoKeys = Object.keys(report.photos);
    
    // Process each category and get only the first photo
    photoKeys.forEach(categoryId => {
      const category = report.photos[categoryId];
      const categoryTitle = category?.categoryTitle || categoryId;
      let photos = [];
      
      if (Array.isArray(category?.photos)) {
        photos = category.photos;
      } else if (Array.isArray(category)) {
        photos = category;
      }
      
      // Get only the first photo (matching EMBInspectionView.jsx logic)
      if (photos.length > 0) {
        const firstPhoto = photos[0];
        const rawImageUrl = firstPhoto.url || firstPhoto.preview || firstPhoto;
        if (rawImageUrl && typeof rawImageUrl === 'string') {
          categories.push({
            categoryId,
            categoryTitle,
            photos: [{
              ...firstPhoto,
              categoryTitle,
              categoryId,
              rawImageUrl,
              index: 0
            }],
            totalPhotosInCategory: photos.length // Keep track of total for display
          });
        }
      }
    });
    
    return categories;
  };

  // Simplified: Always 2 photos per row (matching EMBInspectionView.jsx grid-cols-2)
  const getPhotosPerRow = () => {
    return 2; // Always 2 columns like the view component
  };

  // Get style for photo item based on photos per row
  const getPhotoItemStyle = (photosPerRow) => {
    switch (photosPerRow) {
      case 1:
        return [styles.photoItem, styles.photoItem1PerRow];
      case 2:
        return [styles.photoItem, styles.photoItem2PerRow];
      case 3:
        return [styles.photoItem, styles.photoItem3PerRow];
      case 4:
        return [styles.photoItem, styles.photoItem4PerRow];
      default:
        return [styles.photoItem, styles.photoItem2PerRow];
    }
  };

  // Get style for image container based on photos per row
  const getPhotoImageContainerStyle = (photosPerRow) => {
    switch (photosPerRow) {
      case 1:
        return [styles.photoImageContainer, styles.photoImageContainer1PerRow];
      case 2:
        return [styles.photoImageContainer, styles.photoImageContainer2PerRow];
      case 3:
        return [styles.photoImageContainer, styles.photoImageContainer3PerRow];
      case 4:
        return [styles.photoImageContainer, styles.photoImageContainer4PerRow];
      default:
        return [styles.photoImageContainer, styles.photoImageContainer2PerRow];
    }
  };

  // Group photos by category
  const photoCategories = groupPhotosByCategory();
  
  // Calculate total photos for summary
  const totalPhotos = photoCategories.reduce((sum, cat) => sum + cat.photos.length, 0);
  
  // Calculate total photos on a page
  const getPagePhotoCount = (page) => {
    return page.reduce((sum, category) => {
      return sum + (category.displayPhotos?.length || 0);
    }, 0);
  };

  // Split categories into pages: 2 columns, 4-6 photos per page (matching EMBInspectionView.jsx)
  const splitCategoriesIntoPages = (categories) => {
    const pages = [];
    const MAX_PHOTOS_PER_PAGE = 6; // 2 columns x 3 rows = 6 photos max per page
    
    categories.forEach((category) => {
      // Each category has only 1 photo (first photo only)
      if (pages.length === 0) {
        pages.push([{ ...category, displayPhotos: category.photos }]);
      } else {
        const currentPage = pages[pages.length - 1];
        const currentPagePhotoCount = getPagePhotoCount(currentPage);
        
        // If adding this category would exceed max photos per page, create new page
        if (currentPagePhotoCount + category.photos.length > MAX_PHOTOS_PER_PAGE) {
          pages.push([{ ...category, displayPhotos: category.photos }]);
        } else {
          // Add to current page
          currentPage.push({ ...category, displayPhotos: category.photos });
        }
      }
    });
    
    // Filter out empty pages
    return pages.filter(page => {
      return page.length > 0 && page.some(category => 
        category.displayPhotos && category.displayPhotos.length > 0
      );
    });
  };
  
  const photoPages = splitCategoriesIntoPages(photoCategories);
  
  // Split defects into pages: 2 columns, 6 defects per page
  const splitDefectsIntoPages = (defects) => {
    if (!defects || defects.length === 0) return [];
    
    const pages = [];
    const MAX_DEFECTS_PER_PAGE = 6; // 2 columns x 3 rows = 6 defects max per page
    
    for (let i = 0; i < defects.length; i += MAX_DEFECTS_PER_PAGE) {
      pages.push(defects.slice(i, i + MAX_DEFECTS_PER_PAGE));
    }
    
    return pages;
  };
  
  const defectsPages = splitDefectsIntoPages(report.defects || []);
  
  // Calculate total pages: Header+Inspection Details (1) + Checklists (1 if exists) + Photo pages + Defects pages + Conclusion (1)
  const hasChecklists = report.checklist && Object.keys(report.checklist).length > 0;
  const totalPages = 1 + (hasChecklists ? 1 : 0) + photoPages.length + defectsPages.length + 1;

  // Debug: Log photo information
  if (isPrinting) {
    console.log("EMBReportPDF - Photo Debug:", {
      totalPhotos,
      totalCategories: photoCategories.length,
      categories: photoCategories.map(cat => ({
        title: cat.categoryTitle,
        photoCount: cat.photos.length
      })),
      totalPages
    });
  }

  return (
    <Document>
      {/* Page 1: Header + Inspection Details */}
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.logoArea}>
                <Image
                  src="/assets/Img/sub-emb-pdf/photo_2025-12-05_09-58-53.jpg"
                  style={styles.logo}
                />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.title}>
                  {`${report.inspectionType || "First Output"}${report.reportType === "EMB + Print" ? " - EMB + Print" : report.reportType === "Printing" ? " - Printing" : " - EMB"}`}
                </Text>
                <Text style={styles.inspectionNumbers}>
                  {`Inspection #: ${report.moNo || "N/A"} | Group #: ${report._id?.slice(-6) || "N/A"}`}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <View style={getStatusButtonStyle(report.status)}>
                <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>
                  {report.status || "Pending"}
                </Text>
              </View>
              <View style={getResultButtonStyle(report.result)}>
                <Text style={{ color: "#ffffff", fontSize: 11, fontWeight: "bold" }}>
                  {report.result || "Pending"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Inspection Details Section */}
        <View>
          <View style={styles.sectionHeader}>
            <Text style={{ color: "#ffffff" }}>Inspection Details</Text>
          </View>
          {/* Date Header Row */}
          <View style={styles.dateHeaderRow}>
            <View style={styles.dateHeaderItem}>
              <Text style={styles.dateHeaderLabel}>Scheduled Inspection Date:</Text>
              <Text style={styles.dateHeaderValue}>{formatDateTime(report.inspectionDate)}</Text>
            </View>
            <View style={styles.dateHeaderItem}>
              <Text style={styles.dateHeaderLabel}>Inspection Time:</Text>
              <Text style={styles.dateHeaderValue}>{formatInspectionDateTime(report.inspectionDate, report.inspectionTime)}</Text>
            </View>
          
          </View>
          {/* Main Details Section */}
          <View style={styles.contentSection}>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Report Type:</Text>
              <Text style={styles.twoColumnValue}>
                {`${report.inspectionType || "First Output"} - ${report.reportType || "EMB"}`}
              </Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Factory Name:</Text>
              <Text style={styles.twoColumnValue}>{report.factoryName || "N/A"}</Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Inspector:</Text>
              <Text style={styles.twoColumnValue}>{report.inspector || "N/A"}</Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>MO Number:</Text>
              <Text style={styles.twoColumnValue}>{report.moNo || "N/A"}</Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Buyer:</Text>
              <Text style={styles.twoColumnValue}>{report.buyer || "N/A"}</Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Buyer Style:</Text>
              <Text style={styles.twoColumnValue}>{report.buyerStyle || "N/A"}</Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Color:</Text>
              <Text style={styles.twoColumnValue}>
                {Array.isArray(report.color) ? report.color.join(", ") : report.color || "N/A"}
              </Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>SKU #:</Text>
              <Text style={styles.twoColumnValue}>
                {Array.isArray(report.skuNumber) ? report.skuNumber.join(", ") : report.skuNumber || "N/A"}
              </Text>
            </View>
          
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Sample Inspected:</Text>
              <Text style={styles.twoColumnValue}>{report.aqlData?.sampleSize || report.totalPcs || 0}</Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Total PO Items Qty:</Text>
              <Text style={styles.twoColumnValue}>{report.totalOrderQty || 0}</Text>
            </View>
            <View style={styles.twoColumnRow}>
              <Text style={styles.twoColumnLabel}>Inspected Qty (Pcs):</Text>
              <Text style={styles.twoColumnValue}>{report.totalPcs || 0}</Text>
            </View>
            {(report.reportType === "EMB" || report.reportType === "EMB + Print") && report.embDetails && (
              <>
                <View style={styles.twoColumnRow}>
                  <Text style={styles.twoColumnLabel}>EMB Speed:</Text>
                  <Text style={styles.twoColumnValue}>{report.embDetails.speed || "N/A"}</Text>
                </View>
                <View style={styles.twoColumnRow}>
                  <Text style={styles.twoColumnLabel}>EMB Stitch:</Text>
                  <Text style={styles.twoColumnValue}>{report.embDetails.stitch || "N/A"}</Text>
                </View>
                <View style={styles.twoColumnRow}>
                  <Text style={styles.twoColumnLabel}>EMB Needle Size:</Text>
                  <Text style={styles.twoColumnValue}>{report.embDetails.needleSize || "N/A"}</Text>
                </View>
                <View style={styles.twoColumnRow}>
                  <Text style={styles.twoColumnLabel}>EMB Machine No:</Text>
                  <Text style={styles.twoColumnValue}>{report.embDetails.machineNo || "N/A"}</Text>
                </View>
              </>
            )}
            {(report.reportType === "Printing" || report.reportType === "EMB + Print") && report.printingDetails && (
              <>
                <View style={styles.twoColumnRow}>
                  <Text style={styles.twoColumnLabel}>Printing Method:</Text>
                  <Text style={styles.twoColumnValue}>{report.printingDetails.method || "N/A"}</Text>
                </View>
                <View style={styles.twoColumnRow}>
                  <Text style={styles.twoColumnLabel}>Curing Time:</Text>
                  <Text style={styles.twoColumnValue}>{report.printingDetails.curingTime || "N/A"}</Text>
                </View>
                <View style={styles.twoColumnRow}>
                  <Text style={styles.twoColumnLabel}>Curing Pressure:</Text>
                  <Text style={styles.twoColumnValue}>{report.printingDetails.curingPressure || "N/A"}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Page 1 of {totalPages}</Text>
          <Text>Powered by YaiKh</Text>
        </View>
      </Page>

      {/* Page 2: Checklists Section (if exists) */}
      {report.checklist && Object.keys(report.checklist).length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.checklistSection}>
            <View style={styles.sectionHeader}>
              <Text style={{ color: "#ffffff" }}>Checklists</Text>
            </View>
            <View style={styles.contentSection}>
              {checklistItems.map((item) => {
                const value = report.checklist[item.key];
                if (!value) return null;
                return (
                  <View key={item.key} style={styles.checklistRow}>
                    <Text style={styles.checklistLabel}>{item.label}:</Text>
                    <Text style={styles.checklistValue}>{value}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text>Page {hasChecklists ? 2 : 1} of {totalPages}</Text>
            <Text>Powered by YaiKh</Text>
          </View>
        </Page>
      )}

            {/* Photo Pages - 2 columns, one photo per category (matching EMBInspectionView.jsx) */}
            {photoPages.map((pageCategories, pageIndex) => {
        // Double-check that this page has actual content before rendering
        const hasContent = pageCategories.some(category => 
          category.displayPhotos && category.displayPhotos.length > 0
        );
        
        if (!hasContent) return null;
        
        return (
          <Page key={`photo-page-${pageIndex + 1}`} size="A4" style={styles.page}>
            {/* Photos Section */}
            <View>
              <View style={styles.sectionHeader}>
                <Text style={{ color: "#ffffff" }}>Photos{pageIndex > 0 ? " (Continued)" : ""}</Text>
              </View>
              <View style={[styles.contentSection, { padding: 20, paddingTop: 20 }]}>
                
                {/* Display photos in 2-column grid (matching EMBInspectionView.jsx) */}
                {(() => {
                  // Filter valid categories
                  const validCategories = pageCategories.filter(cat => 
                    cat.displayPhotos && cat.displayPhotos.length > 0
                  );
                  
                  // Group into rows of 2
                  const rows = [];
                  for (let i = 0; i < validCategories.length; i += 2) {
                    rows.push(validCategories.slice(i, i + 2));
                  }
                  
                  return rows.map((row, rowIndex) => (
                    <View key={`row-${rowIndex}`} style={{ flexDirection: "row", marginBottom: 20, gap: 20 }}>
                      {row.map((category) => {
                        const photo = category.displayPhotos[0];
                        if (!photo) return null;
                        
                        const imageUrl = normalizeImageUrl(photo.rawImageUrl);
                        if (!imageUrl) return null;
                        
                        return (
                          <View 
                            key={`category-${category.categoryId}`} 
                            style={{
                              width: "48%"
                            }}
                          >
                            {/* Category title header */}
                            <View style={{
                              paddingBottom: 8,
                              marginBottom: 8
                            }}>
                              <Text style={{
                                fontSize: 11,
                                fontWeight: "bold",
                                color: "#374151"
                              }}>
                                {category.categoryTitle} ({category.totalPhotosInCategory || 1})
                              </Text>
                            </View>
                            
                            {/* Photo container - no border, left-aligned */}
                            <View style={{ marginBottom: 12 }}>
                              <View style={{ alignItems: "flex-start" }}>
                                <Image
                                  src={imageUrl}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: 200,
                                    objectFit: "contain"
                                  }}
                                  crossOrigin="anonymous"
                                />
                              </View>
                              
                              {/* Description - simplified */}
                              {photo.description && (
                                <View style={{ marginTop: 8 }}>
                                  <Text style={{
                                    fontSize: 9,
                                    color: "#4b5563"
                                  }}>
                                    {photo.description}
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ));
                })()}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text>Page {hasChecklists ? pageIndex + 3 : pageIndex + 2} of {totalPages}</Text>
              <Text>Powered by YaiKh</Text>
            </View>
          </Page>
        );
      })}

      {/* Defects Pages */}
      {defectsPages.map((pageDefects, pageIndex) => {
        if (!pageDefects || pageDefects.length === 0) return null;
        
        return (
          <Page key={`defects-page-${pageIndex + 1}`} size="A4" style={styles.page}>
            {/* Defects Section */}
            <View>
              <View style={styles.sectionHeader}>
                <Text style={{ color: "#ffffff" }}>Defects{pageIndex > 0 ? " (Continued)" : ""}</Text>
              </View>
              <View style={[styles.contentSection, { padding: 20, paddingTop: 20 }]}>
                {/* Display defects in 2-column grid */}
                {(() => {
                  // Group into rows of 2
                  const rows = [];
                  for (let i = 0; i < pageDefects.length; i += 2) {
                    rows.push(pageDefects.slice(i, i + 2));
                  }
                  
                  return rows.map((row, rowIndex) => (
                    <View key={`defect-row-${rowIndex}`} style={{ flexDirection: "row", marginBottom: 20, gap: 20 }}>
                      {row.map((defect, defectIndex) => {
                        const imageUrl = normalizeImageUrl(defect.image);
                        
                        return (
                          <View 
                            key={`defect-${pageIndex}-${defectIndex}`} 
                            style={{
                              width: "48%",
                              alignItems: imageUrl ? "center" : "flex-start"
                            }}
                          >
                            {/* Defect header */}
                            <View style={{
                              paddingBottom: 8,
                              marginBottom: 8,
                              width: "100%"
                            }}>
                              <Text style={{
                                fontSize: 11,
                                fontWeight: "bold",
                                color: "#374151",
                                textAlign: "center"
                              }}>
                                {`${defect.category || "N/A"} - ${defect.name || defect.defectType || "N/A"}`}
                              </Text>
                            </View>
                            
                            {/* Defect image container - centered */}
                            {imageUrl && (
                              <View style={{
                                marginBottom: 12,
                                width: "100%",
                                // backgroundColor: "#f9fafb",
                                border: "2px dashed #d1d5db",
                                borderRadius: 4,
                                padding: 10,
                                minHeight: 200,
                                alignItems: "center",
                                justifyContent: "center"
                              }}>
                                <Image
                                  src={imageUrl}
                                  style={{
                                    maxWidth: "100%",
                                    maxHeight: 200,
                                    width: "auto",
                                    height: "auto",
                                    objectFit: "contain"
                                  }}
                                  crossOrigin="anonymous"
                                />
                              </View>
                            )}
                            
                            {/* Defect info - width matches image container if image exists */}
                            <View style={[
                              styles.defectInfo,
                              {
                                width: imageUrl ? "100%" : "100%",
                                alignItems: imageUrl ? "center" : "flex-start"
                              }
                            ]}>
                              <View style={styles.defectInfoRow}>
                                <Text style={styles.defectInfoLabel}>Category:</Text>
                                <Text style={styles.defectInfoValue}>{defect.category || "N/A"}</Text>
                              </View>
                              <View style={styles.defectInfoRow}>
                                <Text style={styles.defectInfoLabel}>Defect Type:</Text>
                                <Text style={styles.defectInfoValue}>{defect.defectType || defect.name || "N/A"}</Text>
                              </View>
                              <View style={styles.defectInfoRow}>
                                <Text style={styles.defectInfoLabel}>Quantity:</Text>
                                <Text style={styles.defectInfoValue}>{defect.qty || defect.count || 0}</Text>
                              </View>
                              {defect.machineNo && (
                                <View style={styles.defectInfoRow}>
                                  <Text style={styles.defectInfoLabel}>Machine No:</Text>
                                  <Text style={styles.defectInfoValue}>{defect.machineNo}</Text>
                                </View>
                              )}
                              {defect.remarks && defect.remarks.trim() !== "" && (
                                <View style={styles.defectRemarks}>
                                  <View style={styles.defectRemarksRow}>
                                    <Text style={styles.defectRemarksLabel}>Remarks:</Text>
                                    <Text style={styles.defectRemarksText}>{defect.remarks}</Text>
                                  </View>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ));
                })()}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text>Page {hasChecklists ? photoPages.length + pageIndex + 3 : photoPages.length + pageIndex + 2} of {totalPages}</Text>
              <Text>Powered by YaiKh</Text>
            </View>
          </Page>
        );
      })}

      {/* Conclusion Section */}
      <Page size="A4" style={styles.page}>
        <View>
          <View style={styles.sectionHeader}>
            <Text style={{ color: "#ffffff" }}>Conclusion</Text>
          </View>
          <View style={styles.contentSection}>
            {/* Inspection Result Bar */}
            <View style={styles.conclusionBar}>
              <Text style={styles.conclusionLabel}>Inspection Result</Text>
              <Text style={[styles.conclusionValue, getResultTextStyle(report.result)]}>
                {report.result || "Pending"}
              </Text>
            </View>
            <View style={styles.conclusionBar}>
              <Text style={styles.conclusionLabel}>Approval Status</Text>
              <Text style={[styles.conclusionValue, getResultTextStyle(report.result)]}>
                {report.result === "Pass" ? "Accepted" : report.result === "Reject" ? "Rejected" : "Pending"}
              </Text>
            </View>

            {/* Checklist Results */}
            {/* <View style={{ marginTop: 10, marginBottom: 10 }}>
              <View style={styles.twoColumnRow}>
                <Text style={styles.twoColumnLabel}>Checklists</Text>
                <View style={[styles.badge, styles.passBadge]}>
                  <Text>PASS</Text>
                </View>
              </View>
              <View style={styles.twoColumnRow}>
                <Text style={styles.twoColumnLabel}>Packing, Packaging & Labelling</Text>
                <View style={[styles.badge, getResultBadgeStyle(report.packingResult)]}>
                  <Text>{report.packingResult || "N/A"}</Text>
                </View>
              </View>
              <View style={styles.twoColumnRow}>
                <Text style={styles.twoColumnLabel}>Workmanship</Text>
                <View style={[styles.badge, getResultBadgeStyle(report.workmanshipResult)]}>
                  <Text>{report.workmanshipResult || "N/A"}</Text>
                </View>
              </View>
              <View style={styles.twoColumnRow}>
                <Text style={styles.twoColumnLabel}>Quality Plan</Text>
                <View style={[styles.badge, getResultBadgeStyle(report.qualityPlanResult)]}>
                  <Text>{report.qualityPlanResult || "N/A"}</Text>
                </View>
              </View>
            </View> */}

            {/* Defect Summary Table */}
            {/* <View style={styles.defectSummaryTable}>
              <View style={styles.defectSummaryRow}>
                <Text style={[styles.defectSummaryHeader, { width: "50%" }]}>PASS</Text>
                <Text style={[styles.defectSummaryHeader, { width: "16.67%" }]}>Critical</Text>
                <Text style={[styles.defectSummaryHeader, { width: "16.67%" }]}>Major</Text>
                <Text style={[styles.defectSummaryHeader, { width: "16.67%" }]}>Minor</Text>
              </View>
              <View style={styles.defectSummaryRow}>
                <Text style={[styles.defectSummaryCell, { width: "50%" }]}>Total Product + Quality Plan Defects</Text>
                <Text style={[styles.defectSummaryCell, { width: "16.67%" }]}>{defectCounts.critical}</Text>
                <Text style={[styles.defectSummaryCell, { width: "16.67%" }]}>{defectCounts.major}</Text>
                <Text style={[styles.defectSummaryCell, { width: "16.67%" }]}>{defectCounts.minor}</Text>
              </View>
              <View style={styles.defectSummaryRow}>
                <Text style={[styles.defectSummaryCell, { width: "50%" }]}>Accept/Reject Qty</Text>
                <Text style={[styles.defectSummaryCell, { width: "16.67%" }]}>
                  {defectCounts.critical === 0 ? "0/1" : "1/0"}
                </Text>
                <Text style={[styles.defectSummaryCell, { width: "16.67%" }]}>
                  {defectCounts.major === 0 ? "0/1" : "1/0"}
                </Text>
                <Text style={[styles.defectSummaryCell, { width: "16.67%" }]}>
                  {defectCounts.minor === 0 ? "0/1" : "1/0"}
                </Text>
              </View>
            </View> */}

            {/* Additional Info */}
            <View style={{ marginTop: 10 }}>
              <View style={styles.twoColumnRow}>
                <Text style={styles.twoColumnLabel}>Total Defective Units:</Text>
                <Text style={styles.twoColumnValue}>{report.defectsQty || 0}</Text>
              </View>
              {report.remarks && report.remarks !== "NA" && (
                <View style={styles.twoColumnRow}>
                  <Text style={styles.twoColumnLabel}>Comments:</Text>
                  <Text style={styles.twoColumnValue}>{report.remarks}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Page {totalPages} of {totalPages}</Text>
          <Text>Powered by YaiKh</Text>
        </View>
      </Page>

        {/* Packing, Packaging & Labelling Section - Removed */}
        {/* <View>
          <View style={styles.sectionHeader}>
            <Text style={{ color: "#ffffff" }}>Packing, Packaging & Labelling</Text>
          </View>
          <View style={styles.contentSection}>
            <View style={styles.conclusionBar}>
              <Text style={styles.conclusionLabel}>Total Defective Units</Text>
              <Text style={styles.conclusionValue}>{report.defectsQty || 0}</Text>
            </View>
            <View style={styles.conclusionBar}>
              <Text style={styles.conclusionLabel}>Inspection Result</Text>
              <View style={[styles.badge, getResultBadgeStyle(report.packingResult)]}>
                <Text>{report.packingResult || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View> */}

        {/* Workmanship Section */}
        {/* <View>
          <View style={styles.sectionHeader}>
            <Text style={{ color: "#ffffff" }}>Workmanship</Text>
          </View>
          <View style={styles.contentSection}>
            Sample Size & AQL Table
            <View style={styles.aqlTable}>
              <View style={styles.aqlRow}>
                <Text style={[styles.aqlHeader, { width: "20%" }]}>Inspection Method</Text>
                <Text style={[styles.aqlHeader, { width: "15%" }]}>Inspection Level</Text>
                <Text style={[styles.aqlHeader, { width: "13%" }]}>Critical</Text>
                <Text style={[styles.aqlHeader, { width: "13%" }]}>Major</Text>
                <Text style={[styles.aqlHeader, { width: "13%" }]}>Minor</Text>
                <Text style={[styles.aqlHeader, { width: "13%" }]}>Qty Inspected</Text>
                <Text style={[styles.aqlHeader, { width: "13%" }]}>Sample Inspected</Text>
              </View>
              <View style={styles.aqlRow}>
                <Text style={[styles.aqlCell, { width: "20%" }]}>normal</Text>
                <Text style={[styles.aqlCell, { width: "15%" }]}>{report.aqlData?.level || "II"}</Text>
                <Text style={[styles.aqlCell, { width: "13%" }]}>0.010</Text>
                <Text style={[styles.aqlCell, { width: "13%" }]}>1.500</Text>
                <Text style={[styles.aqlCell, { width: "13%" }]}>0.010</Text>
                <Text style={[styles.aqlCell, { width: "13%" }]}>{report.totalPcs || 0}</Text>
                <Text style={[styles.aqlCell, { width: "13%" }]}>{report.aqlData?.sampleSize || 0}</Text>
              </View>
            </View>

            Section Conclusion Table
            <View style={[styles.aqlTable, { marginTop: 10 }]}>
              <View style={styles.aqlRow}>
                <Text style={[styles.aqlHeader, { width: "33.33%" }]}>Critical</Text>
                <Text style={[styles.aqlHeader, { width: "33.33%" }]}>Major</Text>
                <Text style={[styles.aqlHeader, { width: "33.33%" }]}>Minor</Text>
              </View>
              <View style={styles.aqlRow}>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>Total Defects</Text>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>Total Defects</Text>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>Total Defects</Text>
              </View>
              <View style={styles.aqlRow}>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>{defectCounts.critical}</Text>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>{defectCounts.major}</Text>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>{defectCounts.minor}</Text>
              </View>
              <View style={styles.aqlRow}>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>Accept/Reject Qty</Text>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>Accept/Reject Qty</Text>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>Accept/Reject Qty</Text>
              </View>
              <View style={styles.aqlRow}>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>
                  {defectCounts.critical === 0 ? "0/1" : "1/0"}
                </Text>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>
                  {defectCounts.major === 0 ? "0/1" : "1/0"}
                </Text>
                <Text style={[styles.aqlCell, { width: "33.33%" }]}>
                  {defectCounts.minor === 0 ? "0/1" : "1/0"}
                </Text>
              </View>
            </View>

            Total Defective Units & Result
            <View style={styles.conclusionBar}>
              <Text style={styles.conclusionLabel}>Total Defective Units</Text>
              <Text style={styles.conclusionValue}>{report.defectsQty || 0}</Text>
            </View>
            <View style={styles.conclusionBar}>
              <Text style={styles.conclusionLabel}>Inspection Result</Text>
              <View style={[styles.badge, getResultBadgeStyle(report.workmanshipResult)]}>
                <Text>{report.workmanshipResult || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View> */}

        {/* Quality Plan Section */}
        {/* <View>
          <View style={styles.sectionHeader}>
            <Text style={{ color: "#ffffff" }}>Quality Plan (Quality Plan尺寸表 - ANF)</Text>
          </View>
          <View style={styles.contentSection}>
            <View style={styles.conclusionBar}>
              <Text style={styles.conclusionLabel}>Total Defective Units</Text>
              <Text style={styles.conclusionValue}>0</Text>
            </View>
            <View style={styles.conclusionBar}>
              <Text style={styles.conclusionLabel}>Inspection Result</Text>
              <View style={[styles.badge, getResultBadgeStyle(report.qualityPlanResult)]}>
                <Text>{report.qualityPlanResult || "N/A"}</Text>
              </View>
            </View>
          </View>
        </View> */}



    </Document>
  );
};

export default EMBReportPDF;
