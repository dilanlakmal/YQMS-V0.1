import autoTable from "jspdf-autotable";
import { decimalToFraction } from "../../../../utils/fractionUtils";

const getPdfLocalizedText = (eng, khmer, chinese, currentLang) => {
  if (currentLang === "km" && khmer) return khmer;
  if (currentLang === "zh" && chinese) return chinese;
  return eng || "";
};

const getDefectDisplayNamePDF = (
  defectNameFromInspection,
  fabricDefectsMaster,
  currentLang
) => {
  const masterDefect = fabricDefectsMaster.find(
    (m) =>
      m.defectName === defectNameFromInspection ||
      m.defectNameEng === defectNameFromInspection
  );
  if (masterDefect) {
    return getPdfLocalizedText(
      masterDefect.defectNameEng,
      masterDefect.defectNameKhmer,
      masterDefect.defectNameChinese,
      currentLang
    );
  }
  return defectNameFromInspection;
};

export const generateCuttingReportPDF = async (
  reportData,
  qcUserData,
  fabricDefectsMasterData,
  i18nInstance
) => {
  if (!reportData) {
    console.error("No report data provided for PDF generation.");
    alert("No report data to generate PDF.");
    return;
  }

  const t = i18nInstance.t;
  const currentLang = i18nInstance.language;

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4"
  });

  const pageMargin = 30; // Reduced margin slightly for more content space
  const pageWidth = pdf.internal.pageSize.getWidth() - 2 * pageMargin;
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = pageMargin;
  const lineSpacing = 11; // Slightly reduced
  const sectionSpacing = 18; // Slightly reduced
  const tableCellPadding = 2; // Slightly reduced

  const addText = (text, x, y, options = {}) => {
    pdf.setFontSize(options.fontSize || 9); // Default smaller font
    pdf.setFont(undefined, options.fontStyle || "normal");
    pdf.setTextColor(options.color || "#000000");
    if (
      options.maxWidth &&
      (pdf.getStringUnitWidth(text) * (options.fontSize || 9)) /
        pdf.internal.scaleFactor >
        options.maxWidth
    ) {
      const lines = pdf.splitTextToSize(text, options.maxWidth);
      pdf.text(lines, x, y, { align: options.align || "left" });
      return y + lines.length * (options.lineHeight || lineSpacing * 0.75);
    } else {
      pdf.text(text, x, y, { align: options.align || "left" });
      return y + (options.lineHeight || lineSpacing);
    }
  };

  const checkAndAddPage = (spaceNeeded) => {
    if (currentY + spaceNeeded > pageHeight - pageMargin) {
      pdf.addPage(
        pdf.internal.pageSize.getFormat(),
        pdf.internal.pageSize.getOrientation()
      );
      currentY = pageMargin;
      // Optional: Redraw consistent page headers here if needed
      // pdf.setFontSize(8);
      // pdf.text('Page ' + pdf.internal.getNumberOfPages(), pageWidth + pageMargin - 30, pageHeight - 15, {align: 'right'});
      return true;
    }
    return false;
  };

  // --- PDF Content ---

  // Section 1: Header
  pdf.setFontSize(14); // Slightly smaller main title
  pdf.setFont(undefined, "bold");
  pdf.text(
    "YORKMARS (CAMBODIA) GARMENT MFG CO., LTD",
    pageWidth / 2 + pageMargin,
    currentY,
    { align: "center" }
  );
  currentY += lineSpacing * 1.3;

  pdf.setFontSize(12); // Slightly smaller subtitle
  pdf.setFont(undefined, "bold");
  pdf.text(
    t("cutting.cutPanelInspectionReportTitle", "Cut Panel Inspection Report"),
    pageWidth / 2 + pageMargin,
    currentY,
    { align: "center" }
  );
  currentY += lineSpacing * 1.1;

  pdf.setFontSize(8); // Smaller info text
  pdf.setFont(undefined, "normal");
  const headerInfo = `${t("cutting.panel")}: ${reportData.garmentType} | ${t(
    "cutting.moNo"
  )}: ${reportData.moNo} | ${t("cutting.tableNo")}: ${reportData.tableNo} | ${t(
    "cutting.date"
  )}: ${reportData.inspectionDate}`;
  pdf.text(headerInfo, pageWidth / 2 + pageMargin, currentY, {
    align: "center"
  });
  currentY += sectionSpacing * 0.8; // Reduced spacing

  // Section 2: Cut Panel Details & QC Info
  currentY = addText(
    t("cutting.cutPanelDetailsTitle", "Cut Panel Details"),
    pageMargin,
    currentY,
    { fontSize: 11, fontStyle: "bold" }
  ); // Slightly smaller section title
  currentY += lineSpacing * 0.4;

  if (qcUserData || reportData.cutting_emp_id) {
    const qcId = qcUserData?.emp_id || reportData.cutting_emp_id;
    const qcName =
      getPdfLocalizedText(
        qcUserData?.eng_name,
        qcUserData?.kh_name,
        qcUserData?.chinese_name,
        currentLang
      ) ||
      getPdfLocalizedText(
        reportData.cutting_emp_engName,
        reportData.cutting_emp_khName,
        "",
        currentLang
      ) ||
      "N/A";
    const qcBoxWidth = 110; // Slightly narrower
    const qcBoxX = pageWidth + pageMargin - qcBoxWidth - 5; // Adjusted X
    let qcTempY = currentY - lineSpacing * 2;

    pdf.setFontSize(7); // Smaller QC info
    pdf.text(`${t("cutting.qcId")}: ${qcId}`, qcBoxX, qcTempY);
    qcTempY += lineSpacing * 0.7;
    const qcNameLines = pdf.splitTextToSize(qcName, qcBoxWidth - 5);
    pdf.text(qcNameLines, qcBoxX, qcTempY);
  }

  let detailX = pageMargin;
  let tempY = currentY;
  const colWidthDetails = (pageWidth - 120) / 3 - 4; // Adjusted for QC box space

  tempY = Math.max(
    addText(
      `${t("cutting.lotNo")}: ${reportData.lotNo?.join(", ") || "N/A"}`,
      detailX,
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    ),
    addText(
      `${t("cutting.color")}: ${reportData.color}`,
      detailX + colWidthDetails + 5,
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    ),
    addText(
      `${t("cutting.orderQty")}: ${reportData.orderQty}`,
      detailX + 2 * (colWidthDetails + 5),
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    )
  );
  tempY = Math.max(
    addText(
      `${t("cutting.spreadTable")}: ${
        reportData.cuttingTableDetails?.spreadTable || "N/A"
      }`,
      detailX,
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    ),
    addText(
      `${t("cutting.spreadTableNo")}: ${
        reportData.cuttingTableDetails?.spreadTableNo || "N/A"
      }`,
      detailX + colWidthDetails + 5,
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    ),
    addText(
      `${t("cutting.planLayers")}: ${
        reportData.cuttingTableDetails?.planLayers
      }`,
      detailX + 2 * (colWidthDetails + 5),
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    )
  );
  tempY = Math.max(
    addText(
      `${t("cutting.actualLayers")}: ${
        reportData.cuttingTableDetails?.actualLayers
      }`,
      detailX,
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    ),
    addText(
      `${t("cutting.totalPcs")}: ${reportData.cuttingTableDetails?.totalPcs}`,
      detailX + colWidthDetails + 5,
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    ),
    addText(
      `${t("cutting.mackerNo")}: ${reportData.cuttingTableDetails?.mackerNo}`,
      detailX + 2 * (colWidthDetails + 5),
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    )
  );
  currentY = tempY;

  currentY = addText(
    t("cutting.markerRatio"),
    pageMargin,
    currentY + lineSpacing * 0.4,
    { fontSize: 9, fontStyle: "bold" }
  ); // Smaller title
  if (reportData.mackerRatio && reportData.mackerRatio.length > 0) {
    const markerHeaders = reportData.mackerRatio.map((mr) => mr.markerSize);
    const markerRatios = reportData.mackerRatio.map((mr) =>
      mr.ratio.toString()
    );
    autoTable(pdf, {
      // Corrected: pass pdf instance as first argument
      startY: currentY,
      head: [markerHeaders],
      body: [markerRatios],
      theme: "grid",
      styles: {
        fontSize: 7,
        cellPadding: tableCellPadding - 1,
        halign: "center"
      }, // Smaller font
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: 20,
        fontStyle: "bold",
        fontSize: 7
      },
      margin: { left: pageMargin, right: pageMargin },
      tableWidth: "auto"
    });
    currentY = pdf.lastAutoTable.finalY + lineSpacing * 0.4;
  } else {
    currentY = addText("N/A", pageMargin + 20, currentY, { fontSize: 8 });
  }

  tempY = currentY;
  tempY = Math.max(
    addText(
      `${t("cutting.totalBundleQty")}: ${reportData.totalBundleQty}`,
      detailX,
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    ),
    addText(
      `${t("cutting.bundleQtyCheck")}: ${reportData.bundleQtyCheck}`,
      detailX + colWidthDetails + 5,
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    ),
    addText(
      `${t("cutting.cuttingBy")}: ${reportData.cuttingtype}`,
      detailX + 2 * (colWidthDetails + 5),
      tempY,
      { fontSize: 8, maxWidth: colWidthDetails }
    )
  );
  currentY = tempY + sectionSpacing * 0.8;

  // Section 3: Inspection Summary Table
  checkAndAddPage(80);
  currentY = addText(
    t("cutting.inspectionSummaryOverall", "Inspection Summary (Overall)"),
    pageMargin,
    currentY,
    { fontSize: 11, fontStyle: "bold" }
  );
  currentY += lineSpacing * 0.4;

  const summaryHeaders = [
    t("cutting.size"),
    t("cutting.inspectionQty", "Insp. Qty"),
    t("cutting.pass"),
    t("cutting.reject"),
    t("cutting.rejectMeasurements"),
    t("cutting.rejectDefects"),
    `${t("cutting.passRate")} (%)`
  ];
  const summaryBody = reportData.inspectionData.flatMap((item) => {
    /* ... (same as before) ... */ const rejectDefectsVal =
      item.rejectGarmentSize?.total || 0;
    const mainRow = [
      item.inspectedSize,
      item.totalPcsSize || 0,
      item.passSize?.total || 0,
      item.rejectSize?.total || 0,
      item.rejectMeasurementSize?.total || 0,
      rejectDefectsVal,
      (item.passrateSize?.total || 0).toFixed(2)
    ];
    const tmbRow = [
      "",
      `T:${item.pcsSize?.top || 0} M:${item.pcsSize?.middle || 0} B:${
        item.pcsSize?.bottom || 0
      }`,
      `T:${item.passSize?.top || 0} M:${item.passSize?.middle || 0} B:${
        item.passSize?.bottom || 0
      }`,
      `T:${item.rejectSize?.top || 0} M:${item.rejectSize?.middle || 0} B:${
        item.rejectSize?.bottom || 0
      }`,
      `T:${item.rejectMeasurementSize?.top || 0} M:${
        item.rejectMeasurementSize?.middle || 0
      } B:${item.rejectMeasurementSize?.bottom || 0}`,
      `T:${item.rejectGarmentSize?.top || 0} M:${
        item.rejectGarmentSize?.middle || 0
      } B:${item.rejectGarmentSize?.bottom || 0}`,
      `T:${(item.passrateSize?.top || 0).toFixed(0)}% M:${(
        item.passrateSize?.middle || 0
      ).toFixed(0)}% B:${(item.passrateSize?.bottom || 0).toFixed(0)}%`
    ];
    return [mainRow, tmbRow];
  });
  const summaryTotals = reportData.inspectionData.reduce(
    (acc, curr) => {
      /* ... (same as before) ... */ acc.totalPcsSize += curr.totalPcsSize || 0;
      acc.pcsSize.top += curr.pcsSize?.top || 0;
      acc.pcsSize.middle += curr.pcsSize?.middle || 0;
      acc.pcsSize.bottom += curr.pcsSize?.bottom || 0;
      acc.passSize.total += curr.passSize?.total || 0;
      acc.passSize.top += curr.passSize?.top || 0;
      acc.passSize.middle += curr.passSize?.middle || 0;
      acc.passSize.bottom += curr.passSize?.bottom || 0;
      acc.rejectSize.total += curr.rejectSize?.total || 0;
      acc.rejectSize.top += curr.rejectSize?.top || 0;
      acc.rejectSize.middle += curr.rejectSize?.middle || 0;
      acc.rejectSize.bottom += curr.rejectSize?.bottom || 0;
      acc.rejectMeasurementSize.total += curr.rejectMeasurementSize?.total || 0;
      acc.rejectMeasurementSize.top += curr.rejectMeasurementSize?.top || 0;
      acc.rejectMeasurementSize.middle +=
        curr.rejectMeasurementSize?.middle || 0;
      acc.rejectMeasurementSize.bottom +=
        curr.rejectMeasurementSize?.bottom || 0;
      acc.rejectGarmentSize.total += curr.rejectGarmentSize?.total || 0;
      acc.rejectGarmentSize.top += curr.rejectGarmentSize?.top || 0;
      acc.rejectGarmentSize.middle += curr.rejectGarmentSize?.middle || 0;
      acc.rejectGarmentSize.bottom += curr.rejectGarmentSize?.bottom || 0;
      return acc;
    },
    {
      totalPcsSize: 0,
      pcsSize: { top: 0, middle: 0, bottom: 0 },
      passSize: { total: 0, top: 0, middle: 0, bottom: 0 },
      rejectSize: { total: 0, top: 0, middle: 0, bottom: 0 },
      rejectMeasurementSize: { total: 0, top: 0, middle: 0, bottom: 0 },
      rejectGarmentSize: { total: 0, top: 0, middle: 0, bottom: 0 }
    }
  );
  const totalPassRate =
    summaryTotals.totalPcsSize > 0
      ? (summaryTotals.passSize.total / summaryTotals.totalPcsSize) * 100
      : 0;
  const totalPassRateT =
    summaryTotals.pcsSize.top > 0
      ? (summaryTotals.passSize.top / summaryTotals.pcsSize.top) * 100
      : 0;
  const totalPassRateM =
    summaryTotals.pcsSize.middle > 0
      ? (summaryTotals.passSize.middle / summaryTotals.pcsSize.middle) * 100
      : 0;
  const totalPassRateB =
    summaryTotals.pcsSize.bottom > 0
      ? (summaryTotals.passSize.bottom / summaryTotals.pcsSize.bottom) * 100
      : 0;
  const totalRowMain = [
    t("common.total"),
    summaryTotals.totalPcsSize,
    summaryTotals.passSize.total,
    summaryTotals.rejectSize.total,
    summaryTotals.rejectMeasurementSize.total,
    summaryTotals.rejectGarmentSize.total,
    totalPassRate.toFixed(2)
  ];
  const totalRowTMB = [
    "",
    `T:${summaryTotals.pcsSize.top} M:${summaryTotals.pcsSize.middle} B:${summaryTotals.pcsSize.bottom}`,
    `T:${summaryTotals.passSize.top} M:${summaryTotals.passSize.middle} B:${summaryTotals.passSize.bottom}`,
    `T:${summaryTotals.rejectSize.top} M:${summaryTotals.rejectSize.middle} B:${summaryTotals.rejectSize.bottom}`,
    `T:${summaryTotals.rejectMeasurementSize.top} M:${summaryTotals.rejectMeasurementSize.middle} B:${summaryTotals.rejectMeasurementSize.bottom}`,
    `T:${summaryTotals.rejectGarmentSize.top} M:${summaryTotals.rejectGarmentSize.middle} B:${summaryTotals.rejectGarmentSize.bottom}`,
    `T:${totalPassRateT.toFixed(0)}% M:${totalPassRateM.toFixed(
      0
    )}% B:${totalPassRateB.toFixed(0)}%`
  ];
  summaryBody.push(totalRowMain, totalRowTMB);

  autoTable(pdf, {
    // Corrected: pass pdf instance
    startY: currentY,
    head: [summaryHeaders],
    body: summaryBody,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: tableCellPadding - 1,
      halign: "center"
    }, // Smaller font
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: 20,
      fontStyle: "bold",
      fontSize: 7
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.row.index % 2 !== 0) {
        pdf.setFontSize(6);
        pdf.setTextColor(100);
      } // TMB rows even smaller
      if (
        data.section === "body" &&
        (data.row.index === summaryBody.length - 2 ||
          data.row.index === summaryBody.length - 1)
      ) {
        pdf.setFont(undefined, "bold");
        if (data.row.index === summaryBody.length - 1) pdf.setFontSize(6);
      }
    },
    margin: { left: pageMargin, right: pageMargin }
  });
  currentY = pdf.lastAutoTable.finalY + sectionSpacing * 0.8;

  // Section 4: Measurement Details Table
  checkAndAddPage(40);
  const toleranceText =
    reportData.inspectionData &&
    reportData.inspectionData.length > 0 &&
    reportData.inspectionData[0].tolerance
      ? `(${t("cutting.tolerance")}: ${
          reportData.inspectionData[0].tolerance.min
        } / ${reportData.inspectionData[0].tolerance.max})`
      : "";
  currentY = addText(
    `${t("cutting.measurementDetails")} ${toleranceText}`,
    pageMargin,
    currentY,
    { fontSize: 11, fontStyle: "bold" }
  );
  currentY += lineSpacing * 0.4;

  const measurementTableHeaders = [
    t("cutting.size"),
    t("cutting.bundleQty"),
    t("cutting.bundleNo"),
    t("cutting.partName"),
    t("cutting.measurementPoint")
  ];
  const allPcsHeadersSet = new Set();
  reportData.inspectionData.forEach((sd) =>
    sd.bundleInspectionData.forEach((b) =>
      b.measurementInsepctionData.forEach((p) =>
        p.measurementPointsData.forEach((mp) =>
          mp.measurementValues.forEach((mv) =>
            mv.measurements.forEach((m) => allPcsHeadersSet.add(m.pcsName))
          )
        )
      )
    )
  );
  const sortedPcsHeaders = Array.from(allPcsHeadersSet).sort((a, b) => {
    const pA = a[0],
      pB = b[0],
      nA = parseInt(a.slice(1)),
      nB = parseInt(b.slice(1));
    if (pA < pB) return -1;
    if (pA > pB) return 1;
    return nA - nB;
  });
  measurementTableHeaders.push(...sortedPcsHeaders);

  const measurementTableBody = [];
  let currentSizeRendered = null;
  let currentBundleRendered = null;
  let currentPartRendered = null;
  reportData.inspectionData.forEach((sizeData) => {
    sizeData.bundleInspectionData.forEach((bundle) => {
      bundle.measurementInsepctionData.forEach((part) => {
        part.measurementPointsData.forEach((mp) => {
          const rowValues = sortedPcsHeaders.map((pcsHeader) => {
            for (const mv of mp.measurementValues) {
              const m = mv.measurements.find((m) => m.pcsName === pcsHeader);
              if (m) return decimalToFraction(m.valuedecimal);
            }
            return "-";
          });
          measurementTableBody.push([
            sizeData.inspectedSize === currentSizeRendered
              ? ""
              : sizeData.inspectedSize,
            sizeData.inspectedSize === currentSizeRendered &&
            bundle.bundleNo === currentBundleRendered
              ? ""
              : sizeData.bundleQtyCheckSize,
            sizeData.inspectedSize === currentSizeRendered &&
            bundle.bundleNo === currentBundleRendered
              ? ""
              : bundle.bundleNo,
            sizeData.inspectedSize === currentSizeRendered &&
            bundle.bundleNo === currentBundleRendered &&
            part.partName === currentPartRendered
              ? ""
              : getPdfLocalizedText(
                  part.partName,
                  part.partNameKhmer,
                  part.partNameChinese,
                  currentLang
                ),
            getPdfLocalizedText(
              mp.measurementPointName,
              mp.measurementPointNameKhmer,
              mp.measurementPointNameChinese,
              currentLang
            ),
            ...rowValues
          ]);
          currentSizeRendered = sizeData.inspectedSize;
          currentBundleRendered = bundle.bundleNo;
          currentPartRendered = part.partName;
        });
      });
    });
  });

  // Define column widths carefully for measurement table
  const firstColsWidth = [25, 25, 25, 55, 65]; // Approx widths for Size, BQty, BNo, Part, MeasPoint
  const dynamicColWidth =
    (pageWidth -
      firstColsWidth.reduce((a, b) => a + b, 0) -
      (sortedPcsHeaders.length > 0 ? (sortedPcsHeaders.length - 1) * 2 : 0)) /
    (sortedPcsHeaders.length || 1); // Remaining width / num dynamic cols, with some padding
  const columnStylesMeas = {
    0: { cellWidth: firstColsWidth[0] },
    1: { cellWidth: firstColsWidth[1] },
    2: { cellWidth: firstColsWidth[2] },
    3: { cellWidth: firstColsWidth[3] },
    4: { cellWidth: firstColsWidth[4], overflow: "linebreak" }
  };
  sortedPcsHeaders.forEach((_, i) => {
    columnStylesMeas[5 + i] = {
      cellWidth: Math.max(dynamicColWidth, 20),
      halign: "center"
    };
  }); // Min width for dynamic cols

  autoTable(pdf, {
    // Corrected: pass pdf instance
    startY: currentY,
    head: [measurementTableHeaders],
    body: measurementTableBody,
    theme: "grid",
    styles: {
      fontSize: 5,
      cellPadding: 1,
      halign: "center",
      overflow: "hidden",
      cellWidth: "auto"
    }, // tiny font
    headStyles: {
      fillColor: [220, 220, 220],
      textColor: 20,
      fontStyle: "bold",
      fontSize: 5.5
    }, // tiny head font
    columnStyles: columnStylesMeas,
    margin: { left: pageMargin, right: pageMargin },
    tableWidth: "wrap", // Or 'auto'
    didDrawPage: function (data) {
      pdf.setFontSize(8);
      pdf.text(
        "Page " + pdf.internal.getNumberOfPages(),
        data.settings.margin.left,
        pageHeight - 10
      );
    }
  });
  currentY = pdf.lastAutoTable.finalY + sectionSpacing * 0.8;

  // Section 5: Fabric Defects Table
  checkAndAddPage(40);
  currentY = addText(
    t("cutting.fabricDefectsTitle", "Fabric Defects"),
    pageMargin,
    currentY,
    { fontSize: 11, fontStyle: "bold" }
  );
  currentY += lineSpacing * 0.4;
  const defectTableHeaders = [
    t("cutting.size"),
    t("cutting.bundleNo"),
    t("cutting.partName"),
    t("cutting.defectDetails")
  ];
  const defectTableBody = [];
  reportData.inspectionData.forEach((sizeData) => {
    sizeData.bundleInspectionData.forEach((bundle) => {
      bundle.measurementInsepctionData.forEach((part) => {
        let defectDetailsText = "";
        let hasDefectsForPart = false;
        part.fabricDefects.forEach((locDef) => {
          locDef.defectData.forEach((pcsDef) => {
            if (pcsDef.totalDefects > 0 && pcsDef.defects) {
              hasDefectsForPart = true;
              defectDetailsText += `${pcsDef.pcsName}: `;
              defectDetailsText += pcsDef.defects
                .map(
                  (d) =>
                    `${getDefectDisplayNamePDF(
                      d.defectName,
                      fabricDefectsMasterData,
                      currentLang
                    )} (${d.defectQty || 0})`
                )
                .join(", ");
              defectDetailsText += "\n";
            }
          });
        });
        if (hasDefectsForPart) {
          defectTableBody.push([
            sizeData.inspectedSize,
            bundle.bundleNo,
            getPdfLocalizedText(
              part.partName,
              part.partNameKhmer,
              part.partNameChinese,
              currentLang
            ),
            defectDetailsText.trim()
          ]);
        }
      });
    });
  });
  if (defectTableBody.length > 0) {
    autoTable(pdf, {
      // Corrected: pass pdf instance
      startY: currentY,
      head: [defectTableHeaders],
      body: defectTableBody,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: tableCellPadding - 1, valign: "top" },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 20,
        fontStyle: "bold",
        fontSize: 7
      },
      columnStyles: { 3: { cellWidth: "auto", overflow: "linebreak" } },
      margin: { left: pageMargin, right: pageMargin }
    });
    currentY = pdf.lastAutoTable.finalY + sectionSpacing * 0.8;
  } else {
    currentY = addText(
      t("cutting.noFabricDefectsReported", "No fabric defects reported."),
      pageMargin,
      currentY,
      { fontSize: 8 }
    );
  }

  // Section 6: Cutting Issues
  checkAndAddPage(40);
  currentY = addText(
    t("cutting.cuttingIssuesTitle", "Cutting Issues"),
    pageMargin,
    currentY,
    { fontSize: 11, fontStyle: "bold" }
  );
  currentY += lineSpacing * 0.4;
  const cuttingIssuesHeaders = [
    t("cutting.size"),
    t("cutting.defectName"),
    t("cutting.remarks"),
    t("cutting.evidence")
  ];
  const cuttingIssuesBody = [];
  let hasAnyCuttingIssues = false;
  reportData.inspectionData.forEach((sizeEntry) => {
    if (sizeEntry.cuttingDefects?.issues?.length > 0) {
      hasAnyCuttingIssues = true;
      sizeEntry.cuttingDefects.issues.forEach((issue) => {
        cuttingIssuesBody.push([
          sizeEntry.inspectedSize,
          getPdfLocalizedText(
            issue.cuttingdefectName,
            issue.cuttingdefectNameKhmer,
            issue.cuttingdefectNameChinese,
            currentLang
          ),
          issue.remarks || "",
          issue.imageData?.length > 0
            ? t("common.imageAttached", "See Attached")
            : t("common.noImage", "N/A")
        ]);
      });
    }
  });
  if (hasAnyCuttingIssues) {
    autoTable(pdf, {
      // Corrected: pass pdf instance
      startY: currentY,
      head: [cuttingIssuesHeaders],
      body: cuttingIssuesBody,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: tableCellPadding - 1, valign: "top" },
      headStyles: {
        fillColor: [220, 220, 220],
        textColor: 20,
        fontStyle: "bold",
        fontSize: 7
      },
      columnStyles: { 2: { cellWidth: "auto" }, 3: { cellWidth: 50 } },
      margin: { left: pageMargin, right: pageMargin }
    });
    currentY = pdf.lastAutoTable.finalY + lineSpacing * 0.7;
  } else {
    currentY = addText(
      t(
        "cutting.noSpecificIssuesReportedOverall",
        "No specific cutting issues reported."
      ),
      pageMargin,
      currentY,
      { fontSize: 8 }
    );
  }
  reportData.inspectionData.forEach((sizeEntry) => {
    if (
      sizeEntry.cuttingDefects?.additionalComments ||
      sizeEntry.cuttingDefects?.additionalImages?.length > 0
    ) {
      checkAndAddPage(25);
      currentY = addText(
        `${t("cutting.additionalInfoForSize", "Additional Info for Size")}: ${
          sizeEntry.inspectedSize
        }`,
        pageMargin,
        currentY,
        { fontSize: 9, fontStyle: "bold" }
      );
      if (sizeEntry.cuttingDefects.additionalComments) {
        currentY = addText(
          `${t("cutting.additionalComments")}:`,
          pageMargin,
          currentY,
          { fontSize: 7, fontStyle: "italic" }
        );
        currentY = addText(
          sizeEntry.cuttingDefects.additionalComments,
          pageMargin + 5,
          currentY,
          { fontSize: 7, maxWidth: pageWidth - 10 }
        );
      }
      if (sizeEntry.cuttingDefects.additionalImages?.length > 0) {
        currentY = addText(
          `${t("cutting.additionalImages")}: ${t(
            "common.seeNoteImagesSeparate",
            "(Images handled separately)"
          )}`,
          pageMargin,
          currentY,
          { fontSize: 7 }
        );
      }
      currentY += lineSpacing * 0.7;
    }
  });

  // Add final page number if not already added by a table
  if (
    !pdf.internal.getPageNumberInfo ||
    pdf.internal.getPageNumberInfo().pageNumber ===
      pdf.internal.getNumberOfPages()
  ) {
    pdf.setFontSize(8);
    pdf.text(
      "Page " + pdf.internal.getNumberOfPages(),
      pageWidth + pageMargin - 30,
      pageHeight - 15,
      { align: "right" }
    );
  }

  const fileName = `Cutting_Report_${reportData.moNo}_${reportData.tableNo}.pdf`;
  pdf.save(fileName);
  console.log("PDF generation complete:", fileName);
};
