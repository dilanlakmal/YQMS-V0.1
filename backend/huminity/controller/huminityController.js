import { log } from "console";
import { ymProdConnection, HumidityReport } from "../../controller/MongoDB/dbConnectionController.js";
import { transformReitmansHistory, getReitmansReports, createReitmansReport, updateReitmansReport } from "./ReimansController.js";
import ExcelJS from "exceljs";
export const getHumidityData = async (req, res) => {
  try {
    const { limit, q } = req.query;
    const col = ymProdConnection.db.collection("humidity_data");
    const query = q
      ? {
        $or: [
          { factoryStyleNo: { $regex: q, $options: "i" } },
          { buyerStyle: { $regex: q, $options: "i" } },
          { customer: { $regex: q, $options: "i" } },
          { moNo: { $regex: q, $options: "i" } },
          { style: { $regex: q, $options: "i" } }
        ]
      }
      : {};

    const cursor = col.find(query).sort({ createdAt: -1 });
    if (limit && Number(limit) > 0) cursor.limit(Number(limit));
    const docs = await cursor.toArray();
    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error("Error fetching humidity_data:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch humidity data" });
  }
};

// GET /api/humidity-data/:moNo
export const getHumidityDataByMoNo = async (req, res) => {
  try {
    const { moNo } = req.params;
    if (!moNo) return res.status(400).json({ success: false, message: "moNo is required" });

    const col = ymProdConnection.db.collection("humidity_data");
    const exactQuery = {
      $or: [{ moNo: moNo }, { factoryStyleNo: moNo }, { style: moNo }, { buyerStyle: moNo }]
    };

    let doc = await col.findOne(exactQuery);
    if (!doc) {
      const regex = new RegExp(moNo, "i");
      doc = await col.findOne({
        $or: [
          { moNo: { $regex: regex } },
          { factoryStyleNo: { $regex: regex } },
          { style: { $regex: regex } },
          { buyerStyle: { $regex: regex } }
        ]
      });
    }

    if (!doc) {
      try {
        const ordersCol = ymProdConnection.db.collection("yorksys_orders");
        const order = await ordersCol.findOne({
          $or: [{ moNo: moNo }, { style: moNo }, { factoryStyleNo: moNo }]
        });
        if (order) {
          return res.json({
            success: true,
            data: { fallbackOrder: order, note: "humidity_data not found — returned yorksys_orders fallback" }
          });
        }
      } catch (errOrder) {
        console.error("Error fetching yorksys_orders fallback:", errOrder);
      }

      return res.status(404).json({ success: false, message: "No humidity data found for this moNo" });
    }

    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error("Error fetching humidity data by moNo:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch humidity data" });
  }
};

// GET /api/humidity-data/:moNo/summary
export const getHumiditySummaryByMoNo = async (req, res) => {
  try {
    const { moNo } = req.params;
    if (!moNo) return res.status(400).json({ success: false, message: "moNo is required" });
    const col = ymProdConnection.db.collection("humidity_data");
    const regex = new RegExp(`^${moNo}$`, "i");
    let doc = await col.findOne({
      $or: [{ moNo: moNo }, { factoryStyleNo: moNo }, { style: moNo }, { buyerStyle: moNo }]
    });
    if (!doc) {
      doc = await col.findOne({
        $or: [
          { moNo: { $regex: regex } },
          { factoryStyleNo: { $regex: regex } },
          { style: { $regex: regex } },
          { buyerStyle: { $regex: regex } }
        ]
      });
    }

    const ordersCol = ymProdConnection.db.collection("yorksys_orders");
    const order = await ordersCol.findOne({ $or: [{ moNo: moNo }, { style: moNo }] });

    let totalQty = 0;
    if (order && Array.isArray(order.MOSummary) && order.MOSummary.length > 0) {
      totalQty = order.MOSummary[0].TotalQty || 0;
    } else if (order && Array.isArray(order.SKUData)) {
      totalQty = order.SKUData.reduce((s, it) => s + (it.Qty || 0), 0);
    }

    const skuColors = (order && Array.isArray(order.SKUData))
      ? [...new Set(order.SKUData.map(s => s.Color).filter(Boolean))]
      : [];
    const colorName = skuColors.join(", ");
    const product = order?.product || "";
    const purchaseOrder = order?.SKUData?.[0]?.POLine || "";

    const fabricsDef = (order && Array.isArray(order.FabricContent) ? order.FabricContent : []);
    const fabrics = fabricsDef.map(f => {
      const pct = Number(f.percentageValue) || 0;
      const decimal = (totalQty * pct) / 100;
      return {
        fabricName: f.fabricName || f.fabric || '',
        percentage: pct,
        allocatedDecimal: decimal,
        allocatedRounded: Math.round(decimal),
        allocatedFloor: Math.floor(decimal)
      };
    });

    const inspectionRecords = doc && Array.isArray(doc.inspectionRecords) ? doc.inspectionRecords : [];
    const totalInspections = inspectionRecords.length;
    const sectionPass = { top: 0, middle: 0, bottom: 0 };
    const sectionFail = { top: 0, middle: 0, bottom: 0 };
    let recordPassAll = 0;
    let recordFailAny = 0;

    inspectionRecords.forEach(r => {
      const top = r.top || {};
      const middle = r.middle || {};
      const bottom = r.bottom || {};
      if (top.pass) sectionPass.top++;
      if (middle.pass) sectionPass.middle++;
      if (bottom.pass) sectionPass.bottom++;
      if (top.fail) sectionFail.top++;
      if (middle.fail) sectionFail.middle++;
      if (bottom.fail) sectionFail.bottom++;

      if (top.pass && middle.pass && bottom.pass) recordPassAll++;
      if (top.fail || middle.fail || bottom.fail) recordFailAny++;
    });

    const recordPassAllocation = fabrics.map(f => {
      const proportion = f.percentage / 100;
      const passDecimal = recordPassAll * proportion;
      return {
        fabricName: f.fabricName,
        percentage: f.percentage,
        passDecimal,
        passRounded: Math.round(passDecimal),
        passFloor: Math.floor(passDecimal)
      };
    });

    const note = !doc ? "No humidity_data found — summary derived from yorksys_orders (no inspections available)" : undefined;

    return res.json({
      success: true,
      data: {
        moNo,
        totalQty,
        fabrics,
        inspectionSummary: {
          totalInspections,
          sectionPass,
          sectionFail,
          recordPassAll,
          recordFailAny
        },
        recordPassAllocation,
        product,
        purchaseOrder,
        colorName,
        note
      }
    });
  } catch (err) {
    console.error("Error computing humidity summary:", err);
    return res.status(500).json({ success: false, message: "Failed to compute humidity summary" });
  }
};


// GET /api/humidity-reports
export const getHumidityReports = async (req, res) => {
  try {
    const { limit, start, end, factoryStyleNo, customer, buyerStyle } = req.query;
    const model = HumidityReport;
    const query = {};

    if (factoryStyleNo) {
      query.factoryStyleNo = { $regex: factoryStyleNo, $options: "i" };
    }
    if (customer) {
      query.customer = { $regex: customer, $options: "i" };
    }
    if (buyerStyle) {
      query.buyerStyle = { $regex: buyerStyle, $options: "i" };
    }

    if (start || end) {
      query.createdAt = {};
      if (start) {
        const s = new Date(start);
        // start of day
        s.setHours(0, 0, 0, 0);
        query.createdAt.$gte = s;
      }
      if (end) {
        const e = new Date(end);
        // end of day
        e.setHours(23, 59, 59, 999);
        query.createdAt.$lte = e;
      }
    }

    let humidityDocs = await HumidityReport.find(query).sort({ createdAt: -1 }).limit(limit ? Number(limit) : 1000).exec();
    let reitmansDocs = await getReitmansReports(query, limit);

    // Combine and sort
    let allDocs = [...humidityDocs, ...reitmansDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (limit && Number(limit) > 0) allDocs = allDocs.slice(0, Number(limit));

    return res.json({ success: true, data: allDocs });
  } catch (err) {
    console.error("Error fetching humidity reports:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch humidity reports" });
  }
};

// GET /api/humidity-reports/export
export const exportHumidityReportsXlsx = async (req, res) => {
  try {
    const { start, end, factoryStyleNo, customer, buyerStyle } = req.query;
    const model = HumidityReport;
    const query = {};

    if (factoryStyleNo) query.factoryStyleNo = { $regex: factoryStyleNo, $options: "i" };
    if (customer) query.customer = { $regex: customer, $options: "i" };
    if (buyerStyle) query.buyerStyle = { $regex: buyerStyle, $options: "i" };

    if (start || end) {
      query.createdAt = {};
      if (start) {
        const s = new Date(start);
        s.setHours(0, 0, 0, 0);
        query.createdAt.$gte = s;
      }
      if (end) {
        const e = new Date(end);
        e.setHours(23, 59, 59, 999);
        query.createdAt.$lte = e;
      }
    }

    const humDocs = await HumidityReport.find(query).sort({ createdAt: -1 }).exec();
    const reitDocs = await getReitmansReports(query);
    const docs = [...humDocs, ...reitDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "YQMS";
    workbook.created = new Date();
    const sheet = workbook.addWorksheet("Humidity Reports", {
      views: [{ state: "frozen", ySplit: 6 }],
    });

    // page setup
    sheet.pageSetup.orientation = "landscape";
    sheet.pageSetup.paperSize = 9; // A4
    sheet.pageSetup.horizontalCentered = true;
    sheet.pageSetup.fitToPage = true;
    sheet.pageSetup.fitToWidth = 1;
    sheet.pageMargins = { left: 0.3, right: 0.3, top: 0.3, bottom: 0.3, header: 0.3, footer: 0 };

    // add logo if exists (look in public/img/header.png)
    try {
      const logoPath = "./public/IMG/header.png";
      const fs = await import("fs");
      if (fs.existsSync(logoPath)) {
        const imageId = workbook.addImage({
          filename: logoPath,
          extension: "png",
        });
        sheet.addImage(imageId, "B1:D5");
      }
    } catch (e) {
      // ignore logo errors
      console.warn("Logo not added:", e.message || e);
    }

    // Title header (merge)
    sheet.mergeCells("B1:R2");
    const titleCell = sheet.getCell("B1");
    titleCell.value = "YORKMARS (CAMBODIA) GARMENTS MFG CO.,LTD - Humidity Inspection Record";
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleCell.font = { size: 14, bold: true };

    // Column headers
    const columns = [
      { header: "ID", key: "_id", width: 20 },
      { header: "FactorySty", key: "factoryStyleNo", width: 14 },
      { header: "buyerSty", key: "buyerStyle", width: 16 },
      { header: "customer", key: "customer", width: 16 },
      { header: "inspectionType", key: "inspectionType", width: 12 },
      { header: "fabrication", key: "fabrication", width: 18 },
      { header: "aquaboySpec(Body)", key: "aquaboySpecBody", width: 15 },
      { header: "aquaboySpec(Ribs)", key: "aquaboySpecRibs", width: 15 },
      { header: "colorName", key: "colorName", width: 14 },
      { header: "beforeDryRoom", key: "beforeDryRoom", width: 12 },
      { header: "afterDryRoom", key: "afterDryRoom", width: 12 },
      { header: "date", key: "date", width: 12 },
      { header: "generalRemark", key: "generalRemark", width: 30 },
      { header: "inspectorSignature", key: "inspectorSignature", width: 18 },
      { header: "qamSignature", key: "qamSignature", width: 18 },
      { header: "createdAt", key: "createdAt", width: 18 },
      { header: "inspectionRecords", key: "inspectionRecords", width: 60 },
    ];

    sheet.columns = columns;

    // header styling row (row 6-ish)
    const headerRow = sheet.getRow(6);
    headerRow.values = columns.map(c => c.header);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    headerRow.eachCell(cell => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE5E7EB" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // start writing data after header row (row 7)
    let rowIndex = 7;
    for (const d of docs) {
      const inspections = Array.isArray(d.inspectionRecords) && d.inspectionRecords.length > 0 ? d.inspectionRecords : [{}];
      for (const rec of inspections) {
        const top = rec.top || {};
        const middle = rec.middle || {};
        const bottom = rec.bottom || {};

        const row = sheet.getRow(rowIndex++);
        row.values = [
          d._id ? String(d._id) : "",
          d.factoryStyleNo || "",
          d.buyerStyle || "",
          d.customer || "",
          d.inspectionType || "",
          d.fabrication || "",
          d.aquaboySpecBody || "",
          d.aquaboySpecRibs || "",
          rec.colorName || d.colorName || "",
          rec.beforeDryRoom || rec.beforeDryRoomTime || d.beforeDryRoom || "",
          rec.afterDryRoom || rec.afterDryRoomTime || d.afterDryRoom || "",
          rec.date || d.date || "",
          d.generalRemark || "",
          d.inspectorSignature || "",
          d.qamSignature || "",
          d.createdAt ? d.createdAt.toISOString().slice(0, 19).replace("T", " ") : "",
          top.body || "",
          top.ribs || "",
          top.fail ? "Fail" : (top.pass ? "Pass" : ""),
          middle.body || "",
          middle.ribs || "",
          middle.fail ? "Fail" : (middle.pass ? "Pass" : ""),
          bottom.body || "",
          bottom.ribs || "",
          bottom.fail ? "Fail" : (bottom.pass ? "Pass" : ""),
        ];

        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

          const colIdx = colNumber;
          if ([18, 21, 24].includes(colIdx)) {
            const val = (cell.value || "").toString().toLowerCase();
            if (val === "fail" || val.includes("b/r") || val.includes("br")) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFDECEA" },
              };
              cell.font = { color: { argb: "FFB02020" }, bold: true };
            }
          }
        });
      }
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const filename = `humidity-reports-${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Error exporting humidity reports to XLSX:", err);
    return res.status(500).json({ success: false, message: "Failed to export humidity reports" });
  }
};

// GET /api/humidity-reports/export-paper
export const exportHumidityReportsPaper = async (req, res) => {
  try {
    const { type, date, month, factoryStyleNo, customer, buyerStyle } = req.query;
    const model = HumidityReport;
    const query = {};

    if (factoryStyleNo) query.factoryStyleNo = { $regex: factoryStyleNo, $options: "i" };
    if (customer) query.customer = { $regex: customer, $options: "i" };
    if (buyerStyle) query.buyerStyle = { $regex: buyerStyle, $options: "i" };

    if (type === "day" && date) {
      const s = new Date(date);
      s.setHours(0, 0, 0, 0);
      const e = new Date(date);
      e.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: s, $lte: e };
    } else if (type === "month" && month) {
      const parts = String(month).split("-");
      if (parts.length === 2) {
        const y = Number(parts[0]);
        const m = Number(parts[1]) - 1;
        const s = new Date(y, m, 1, 0, 0, 0, 0);
        const e = new Date(y, m + 1, 0, 23, 59, 59, 999);
        query.createdAt = { $gte: s, $lte: e };
      }
    }

    const humDocs = await HumidityReport.find(query).sort({ createdAt: -1 }).exec();
    const reitDocs = await getReitmansReports(query);
    const docs = [...humDocs, ...reitDocs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // simple HTML generator per report (similar to frontend preview)
    const renderReportHtml = (data) => {
      const recs = Array.isArray(data.inspectionRecords) ? data.inspectionRecords : [];
      const hasRibs = data.ribsAvailable !== false; // Default to true if undefined
      const rows = recs.map(r => {
        const dateVal = r.date || data.date || "";
        const color = r.colorName || data.colorName || "";
        const before = r.beforeDryRoom || r.beforeDryRoomTime || "";
        const after = r.afterDryRoom || r.afterDryRoomTime || "";
        const sec = (s) => {
          const secObj = r[s] || {};
          const body = secObj.body || "";
          const ribs = secObj.ribs || "";
          const status = secObj.fail ? `<span style="color:#b02020;font-weight:600;border:2px solid #d9534f;padding:4px;display:inline-block;min-width:40px;">Fail</span>` : (secObj.pass ? "Pass" : "");
          return `<td>${body}</td>${hasRibs ? `<td>${ribs}</td>` : ''}<td>${status}</td>`;
        };
        return `<tr>
          <td>${dateVal}</td>
          <td style="text-align:left">${color}</td>
          <td>${before}</td>
          <td>${after}</td>
          ${sec("top")}
          ${sec("middle")}
          ${sec("bottom")}
        </tr>`;
      }).join("\n") || `<tr><td colspan="${hasRibs ? 13 : 10}">No inspection records</td></tr>`;

      return `
        <div style="page-break-after:always;margin-bottom:12px;">
          <div style="text-align:center;font-weight:800">YORKMARS (CAMBODIA) GARMENTS MFG CO.,LTD</div>
          <h2 style="text-align:center;margin:6px 0">Humidity Inspection Record</h2>
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:8px;">
            <div style="width:48%;">
              <div><strong>Buyer style#:</strong> ${data.buyerStyle || ""}</div>
              <div><strong>Factory style no:</strong> ${data.factoryStyleNo || ""}</div>
              <div><strong>Fabrication:</strong> ${data.fabrication || ""}</div>
              <div><strong>Aquaboy spec (Body):</strong> ${data.aquaboySpec || ""}</div>
              ${hasRibs ? `<div><strong>Aquaboy spec (Ribs):</strong> ${data.aquaboySpecRibs || ""}</div>` : ""}
            </div>
            <div style="width:48%;text-align:right;">
              <div><strong>Customer:</strong> ${data.customer || ""}</div>
              <div><strong>Inspection Type:</strong> ${data.inspectionType || ""}</div>
              <div><strong>Date:</strong> ${data.date || ""}</div>
              <div><strong>Color:</strong> ${data.colorName || ""}</div>
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;">
            <thead>
              <tr>
                <th style="border:1px solid #666;padding:6px">Date</th>
                <th style="border:1px solid #666;padding:6px">Color name</th>
                <th style="border:1px solid #666;padding:6px">Before dry room</th>
                <th style="border:1px solid #666;padding:6px">After dry room</th>
                <th style="border:1px solid #666;padding:6px" colspan="${hasRibs ? 3 : 2}">Top</th>
                <th style="border:1px solid #666;padding:6px" colspan="${hasRibs ? 3 : 2}">Middle</th>
                <th style="border:1px solid #666;padding:6px" colspan="${hasRibs ? 3 : 2}">Bottom</th>
              </tr>
              <tr>
                <th style="border:1px solid #666;padding:6px"></th><th style="border:1px solid #666;padding:6px"></th><th style="border:1px solid #666;padding:6px"></th><th style="border:1px solid #666;padding:6px"></th>
                <th style="border:1px solid #666;padding:6px">Body</th>${hasRibs ? '<th style="border:1px solid #666;padding:6px">Ribs</th>' : ''}<th style="border:1px solid #666;padding:6px">Pass/Fail</th>
                <th style="border:1px solid #666;padding:6px">Body</th>${hasRibs ? '<th style="border:1px solid #666;padding:6px">Ribs</th>' : ''}<th style="border:1px solid #666;padding:6px">Pass/Fail</th>
                <th style="border:1px solid #666;padding:6px">Body</th>${hasRibs ? '<th style="border:1px solid #666;padding:6px">Ribs</th>' : ''}<th style="border:1px solid #666;padding:6px">Pass/Fail</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="margin-top:12px;border-top:1px solid #444;padding-top:8px;"><strong>Remark:</strong> <div style="min-height:40px;margin-top:6px;">${data.generalRemark || ""}</div></div>
          <div style="display:flex;justify-content:space-between;margin-top:28px;"><div style="width:45%;border-top:1px solid #444;padding-top:6px;text-align:center;">Inspector</div><div style="width:45%;border-top:1px solid #444;padding-top:6px;text-align:center;">QAM / Supervisor</div></div>
        </div>
      `;
    };
    const allHtml = `
      <html><head><meta charset="utf-8"><title>Exported Humidity Reports</title></head><body>
        ${docs.map(d => renderReportHtml(d)).join("\n")}
      </body></html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `attachment; filename="humidity-reports-${new Date().toISOString().slice(0, 10)}.html"`);
    return res.send(allHtml);
  } catch (err) {
    console.error("Error exporting humidity reports (paper):", err);
    return res.status(500).json({ success: false, message: "Failed to export reports" });
  }
};

// POST /api/humidity-reports
export const createHumidityReport = async (req, res) => {
  try {
    console.log("createHumidityReport hehe");
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    // Validate required field
    if (!payload.factoryStyleNo) {
      return res.status(400).json({ success: false, message: "factoryStyleNo is required" });
    }

    const isReitmans = (payload.customer || '').toLowerCase() === 'reitmans' || payload.customer === 'Reitmans_Form';

    // Transform inspectionRecords into history entry format
    let history = [];
    if (isReitmans) {
      history = transformReitmansHistory(payload);
    } else {
      history = (Array.isArray(payload.inspectionRecords) ? payload.inspectionRecords : []).map(record => {
        const entry = {
          date: payload.date || new Date().toISOString(),
          beforeDryRoom: payload.beforeDryRoom || '',
          afterDryRoom: payload.afterDryRoom || '',
          colorName: payload.colorName || '',
          generalRemark: payload.generalRemark || payload.remark || '',

          top: {
            body: record.top?.body || '',
            bodyStatus: record.top?.bodyStatus || (record.top?.pass ? 'pass' : (record.top?.fail ? 'fail' : '')),
            ribs: record.top?.ribs || '',
            ribsStatus: record.top?.ribsStatus || (record.top?.pass ? 'pass' : (record.top?.fail ? 'fail' : '')),
            status: record.top?.status || (record.top?.pass ? 'pass' : (record.top?.fail ? 'fail' : ''))
          },
          middle: {
            body: record.middle?.body || '',
            bodyStatus: record.middle?.bodyStatus || (record.middle?.pass ? 'pass' : (record.middle?.fail ? 'fail' : '')),
            ribs: record.middle?.ribs || '',
            ribsStatus: record.middle?.ribsStatus || (record.middle?.pass ? 'pass' : (record.middle?.fail ? 'fail' : '')),
            status: record.middle?.status || (record.middle?.pass ? 'pass' : (record.middle?.fail ? 'fail' : ''))
          },
          bottom: {
            body: record.bottom?.body || '',
            bodyStatus: record.bottom?.bodyStatus || (record.bottom?.pass ? 'pass' : (record.bottom?.fail ? 'fail' : '')),
            ribs: record.bottom?.ribs || '',
            ribsStatus: record.bottom?.ribsStatus || (record.bottom?.pass ? 'pass' : (record.bottom?.fail ? 'fail' : '')),
            status: record.bottom?.status || (record.bottom?.pass ? 'pass' : (record.bottom?.fail ? 'fail' : ''))
          },

          images: Array.isArray(record.images) ? record.images : [],

          saveTime: new Date().toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        };
        return entry;
      });
    }

    // Determine status: if all sections in ALL history records are 'pass', set status to 'Passed'
    let finalStatus = 'Failed';
    if (history.length > 0) {
      const latest = history[history.length - 1];
      if (latest.top?.status === 'pass' &&
        latest.middle?.status === 'pass' &&
        latest.bottom?.status === 'pass') {
        finalStatus = 'Passed';
      }
    }

    let doc;
    if (isReitmans) {
      doc = await createReitmansReport(payload, history, finalStatus);
    } else {
      doc = new HumidityReport({
        ...payload,
        status: finalStatus,
        history: history
      });
      await doc.save();
    }

    return res.json({ success: true, message: "Report saved successfully!", data: doc });
  } catch (err) {
    console.error("Error creating humidity report:", err);
    if (err.name === 'ValidationError') {
      console.error("Validation Error Details:", JSON.stringify(err.errors, null, 2));
      return res.status(400).json({ success: false, message: "Validation failed", errors: err.errors });
    }
    return res.status(500).json({ success: false, message: "Failed to create report", error: err.message });
  }
};

// GET /api/humidity-data/aggregate?customers=Costco,MWW,ANF,Aritzia
export const getAggregatedByCustomers = async (req, res) => {
  try {
    const customersParam = req.query.customers || "Costco,MWW,ANF,Aritzia";
    const customers = customersParam.split(",").map((c) => c.trim()).filter(Boolean);

    const ordersCol = ymProdConnection.db.collection("yorksys_orders");
    const humidityCol = ymProdConnection.db.collection("humidity_data");

    const resultObj = {};

    for (const cust of customers) {
      const key = cust.toLowerCase();

      // Fabric aggregation from yorksys_orders
      const fabricAgg = await ordersCol
        .aggregate([
          { $match: { buyer: { $regex: `^${cust}$`, $options: "i" } } },
          { $unwind: { path: "$FabricContent", preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: {
                $ifNull: ["$FabricContent.fabricName", "$FabricContent.fabric", ""]
              },
              count: { $sum: 1 }
            }
          },
          { $project: { name: "$_id", value: { $toString: "$count" }, _id: 0 } },
          { $sort: { value: -1 } }
        ])
        .toArray();

      // Body / ribs counts from humidity_data
      const docs = await humidityCol.find({ customer: { $regex: `^${cust}$`, $options: "i" } }).toArray();
      const bodyCounts = { top: 0, middle: 0, bottom: 0, total: 0 };
      const ribsCounts = { top: 0, middle: 0, bottom: 0, total: 0 };

      docs.forEach((doc) => {
        const inspectionRecords = Array.isArray(doc.inspectionRecords) ? doc.inspectionRecords : [];
        inspectionRecords.forEach((r) => {
          ["top", "middle", "bottom"].forEach((section) => {
            const sec = r[section] || {};
            if (sec.body !== undefined && sec.body !== null && String(sec.body).trim() !== "") {
              bodyCounts[section]++;
              bodyCounts.total++;
            }
            if (sec.ribs !== undefined && sec.ribs !== null && String(sec.ribs).trim() !== "") {
              ribsCounts[section]++;
              ribsCounts.total++;
            }
          });
        });
      });

      resultObj[key] = {
        fabrics: fabricAgg,
        bodyCounts,
        ribsCounts
      };
    }

    return res.json({ success: true, data: [{ _id: new Date().toISOString(), ...resultObj }] });
  } catch (err) {
    console.error("Error aggregating customer data:", err);
    return res.status(500).json({ success: false, message: "Failed to aggregate customer data" });
  }
};

// GET /api/humidity-data/fabric-values?buyer=ANF or ?moNo=GPAF6092
export const getFabricValuesByBuyer = async (req, res) => {
  try {
    const { buyer, moNo } = req.query;
    const ordersCol = ymProdConnection.db.collection("yorksys_orders");
    const humidityCol = ymProdConnection.db.collection("humidity_data");

    let fabricNames = [];
    let buyerName = buyer ? String(buyer).trim() : null;

    if (moNo) {
      const order = await ordersCol.findOne({ $or: [{ moNo: moNo }, { style: moNo }, { factoryStyleNo: moNo }] });
      if (!order) return res.status(404).json({ success: false, message: "Order not found for moNo" });
      buyerName = buyerName || (order.buyer ? String(order.buyer).trim() : null);
      if (Array.isArray(order.FabricContent)) {
        fabricNames = order.FabricContent.map(f => (f.fabricName || f.fabric || "").trim()).filter(Boolean);
      }
    } else if (buyerName) {
      const orders = await ordersCol.find({ buyer: { $regex: `^${buyerName}$`, $options: "i" } }).toArray();
      orders.forEach(o => {
        if (Array.isArray(o.FabricContent)) {
          o.FabricContent.forEach(f => {
            const name = (f.fabricName || f.fabric || "").trim();
            if (name) fabricNames.push(name);
          });
        }
      });
      fabricNames = [...new Set(fabricNames)];
    } else {
      return res.status(400).json({ success: false, message: "Provide either buyer or moNo query param" });
    }

    // lowercase buyer for matching
    const buyerMatch = buyerName ? String(buyerName).toLowerCase() : null;

    const results = [];
    for (const fname of fabricNames) {
      const regex = new RegExp(fname.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
      const query = {
        ...(buyerMatch ? { customer: { $regex: `^${buyerMatch}$`, $options: "i" } } : {}),
        fabrication: { $regex: regex }
      };
      const count = await humidityCol.countDocuments(query);
      results.push({ name: fname, value: String(count) });
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error("Error computing fabric values by buyer:", err);
    return res.status(500).json({ success: false, message: "Failed to compute fabric values" });
  }
};

// POST /api/humidity-reports/:id/approve
export const approveHumidityReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { empId, engName } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Report ID is required" });
    }

    if (!empId || !engName) {
      return res.status(400).json({ success: false, message: "Approver information is required" });
    }

    const model = HumidityReport;
    const report = await model.findById(id);

    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    // Check if already approved
    if (report.approvalStatus === 'approved') {
      return res.status(400).json({ success: false, message: "Report is already approved" });
    }

    // Update the report with approval details
    report.approvalStatus = 'approved';
    report.approvedBy = { empId, engName };
    report.approvedAt = new Date();

    await report.save();

    return res.json({ success: true, data: report, message: "Report approved successfully" });
  } catch (err) {
    console.error("Error approving humidity report:", err);
    return res.status(500).json({ success: false, message: "Failed to approve report" });
  }
};

// PUT /api/humidity-reports/:id
export const updateHumidityReport = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Report ID is required" });
    }

    const isReitmans = (payload.customer || '').toLowerCase() === 'reitmans' || payload.customer === 'Reitmans_Form';

    let updatedDoc;
    if (isReitmans) {
      updatedDoc = await updateReitmansReport(id, payload);
    } else {
      const model = HumidityReport;

      // Remove _id from payload to avoid immutable field error
      delete payload._id;

      // Remove immutable fields if present
      delete payload.createdAt;
      delete payload.updatedAt;

      // Recalculate top-level status based on the latest history entry
      if (Array.isArray(payload.history) && payload.history.length > 0) {
        const latest = payload.history[payload.history.length - 1];
        if (latest.top?.status === 'pass' &&
          latest.middle?.status === 'pass' &&
          latest.bottom?.status === 'pass') {
          payload.status = 'Passed';
        } else {
          payload.status = 'Failed';
        }
      }

      updatedDoc = await model.findByIdAndUpdate(
        id,
        { $set: payload },
        { new: true }
      );
    }

    if (!updatedDoc) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }

    return res.json({ success: true, data: updatedDoc, message: "Report updated successfully" });
  } catch (err) {
    console.error("Error updating humidity report:", err);
    return res.status(500).json({ success: false, message: "Failed to update report" });
  }
};

