import { FincheckInspectionReports } from "../../MongoDB/dbConnectionController.js";

// ============================================================
// Get Filtered Inspection Reports
// ============================================================
export const getInspectionReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reportId,
      reportType,
      orderType,
      orderNo,
      productType,
      empId
    } = req.query;

    let query = {
      // Exclude cancelled reports by default if needed, or show all
      status: { $ne: "cancelled" }
    };

    // 1. Date Range Filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.inspectionDate = { $gte: start, $lte: end };
    }

    // 2. Report ID Filter (Exact Match)
    if (reportId) {
      query.reportId = parseInt(reportId);
    }

    // 3. Report Name (Type) Filter
    if (reportType && reportType !== "All") {
      query.reportType = reportType;
    }

    // 4. Order Type Filter
    if (orderType && orderType !== "All") {
      query.orderType = orderType.toLowerCase(); // Ensure lowercase matching
    }

    // 5. Order No Filter (Regex Search)
    if (orderNo) {
      query.orderNosString = { $regex: orderNo, $options: "i" };
    }

    // 6. Product Type Filter
    if (productType && productType !== "All") {
      query.productType = productType;
    }

    // 7. QA ID (Emp ID) Filter
    if (empId) {
      query.empId = { $regex: empId, $options: "i" };
    }

    // Execute Query
    const reports = await FincheckInspectionReports.find(query)
      .sort({ inspectionDate: -1, createdAt: -1 }) // Newest first
      // This populates the 'productTypeId' field with the full object from 'qa_sections_product_type'
      .populate("productTypeId", "imageURL")
      .lean();

    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error("Error fetching inspection reports:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
};
