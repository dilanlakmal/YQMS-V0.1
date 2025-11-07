import { 
  QC2OlderDefect,
  QCWorkers,
  QCWashingQtyOld,
 } from "../MongoDB/dbConnectionController.js";


// Key function
  function makeKey(row) {
    return [
      row.Inspection_date || '',
      row.QC_ID || ''
    ].join("|");
  }

  export const  saveqc2UploadData = async (req, res) => {
    try {
        const { outputData, defectData } = req.body;
        
        // Define washing line identifiers
        const washingLineIdentifiers = [
          'Washing', 'WASHING', 'washing',
          'Wash', 'WASH', 'wash',
        ];
        
        // Function to check if a line is washing-related
        const isWashingLine = (lineName) => {
          if (!lineName) return false;
          return washingLineIdentifiers.includes(lineName.trim());
        };
    
        const allDefects = await QC2OlderDefect.find({}).lean();
        const allDefectsArr = allDefects.map(d => ({
          defectName: (d.defectName || '').trim().toLowerCase(),
          defectCode: d.defectCode,
          English: (d.English || '').trim().toLowerCase(),
          Khmer: (d.Khmer || '').trim().toLowerCase(),
          Chinese: (d.Chinese || '').trim().toLowerCase(),
        }));
    
        // Standardize field names and filter out invalid records
        const outputRows = outputData
          .map(row => ({
            ...row,
            Inspection_date: row['日期'] || row['BillDate'] || '',
            QC_ID: row['工号'] || row['EmpID'] || '',
            WorkLine: row['打菲组别'] || row['Batch Group'] || row['组名'] || row['WorkLine'] || '',
            MONo: row['款号'] || row['ModelNo'] || row['MoNo'] || row['StyleNo'] || row['Style_No'] || row['型号'] || '',
            SeqNo: row['工序号'] || row['SeqNo'] || '',
            ColorNo: row['颜色'] || row['ColorNo'] || '',
            ColorName: row['颜色'] || row['ColorName'] || '',
            SizeName: row['尺码'] || row['SizeName'] || '',
            Qty: row['数量'] || row['Qty'] || 0,
          }))
          .filter(row => {
            // Filter out records without required fields
            return row.Inspection_date && row.QC_ID && row.MONo;
          });
    
        const defectRows = defectData
          .map(row => {
            const defectNameRaw = (row['疵点名称'] || row['ReworkName'] || '').trim().toLowerCase();
            let found = allDefectsArr.find(d =>
              defectNameRaw === d.defectName ||
              (d.English && defectNameRaw.includes(d.English)) ||
              (d.Khmer && defectNameRaw.includes(d.Khmer)) ||
              (d.Chinese && defectNameRaw.includes(d.Chinese)) ||
              (d.English && d.English.includes(defectNameRaw)) ||
              (d.Khmer && d.Khmer.includes(defectNameRaw)) ||
              (d.Chinese && d.Chinese.includes(defectNameRaw))
            );
    
            let defectCode = found ? found.defectCode : '';
    
            return {
              ...row,
              Inspection_date: row['日期'] || row['dDate'] || '',
              QC_ID: row['工号'] || row['EmpID_QC'] || '',
              WorkLine: row['组名'] || row['WorkLine'] || 'N/A',
              MONo: row['款号'] || row['ModelNo'] || row['MoNo'] || row['StyleNo'] || row['Style_No'] || row['型号'] || '',
              ColorNo: row['颜色'] || row['ColorNo'] || '',
              ColorName: row['颜色'] || row['ColorName'] || '',
              SizeName: row['尺码'] || row['SizeName'] || '',
              ReworkCode: defectCode, 
              ReworkName: defectNameRaw,
              Defect_Qty: row['数量'] || row['Defect_Qty'] || 0,
            };
          })
          .filter(row => {
            // Filter out records without required fields
            return row.Inspection_date && row.QC_ID && row.MONo;
          });
    
        // Build outputMap and defectMap
        const outputMap = new Map();
        for (const row of outputRows) {
          const key = makeKey(row);
          if (!outputMap.has(key)) outputMap.set(key, []);
          outputMap.get(key).push(row);
        }
    
        const defectMap = new Map();
        for (const row of defectRows) {
          const key = makeKey(row);
          if (!defectMap.has(key)) defectMap.set(key, []);
          defectMap.get(key).push(row);
        }
    
        // Merge and Build Documents
        const docs = new Map();
        const washingQtyData = new Map();
    
        const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);
    
        for (const key of allKeys) {
          const outputRows = outputMap.get(key) || [];
          const defectRows = defectMap.get(key) || [];
          const [Inspection_date_str, QC_ID_raw] = key.split("|");
          const QC_ID = QC_ID_raw === "6335" ? "YM6335" : QC_ID_raw;
          const Inspection_date = Inspection_date_str ? new Date(Inspection_date_str + "T00:00:00Z") : null;
    
          // Skip if essential data is missing
          if (!Inspection_date || !QC_ID) {
            continue;
          }
    
          // Output grouping
          const outputGroup = {};
          for (const r of outputRows) {
            const oKey = [r.WorkLine, r.MONo, r.ColorName, r.SizeName].join("|");
            if (!outputGroup[oKey]) outputGroup[oKey] = [];
            outputGroup[oKey].push(r);
          }
    
          const Output_data = Object.values(outputGroup).map(rows => ({
            Line_no: rows[0]?.WorkLine || '',
            MONo: rows[0]?.MONo || '',
            Color: rows[0]?.ColorName || '',
            Size: rows[0]?.SizeName || '',
            Qty: rows.reduce((sum, r) => sum + Number(r.Qty || 0), 0)
          }));
    
          // Output summary
          const outputSummaryMap = new Map();
          for (const o of Output_data) {
            const key = `${o.Line_no}|${o.MONo}`;
            if (!outputSummaryMap.has(key)) {
              outputSummaryMap.set(key, { Line: o.Line_no, MONo: o.MONo, Qty: 0 });
            }
            outputSummaryMap.get(key).Qty += o.Qty;
          }
    
          const Output_data_summary = Array.from(outputSummaryMap.values());
          const TotalOutput = Output_data_summary.reduce((sum, o) => sum + o.Qty, 0);
    
          // Washing quantity data structure
          for (const o of Output_data) {
            // Only process if this is a washing line and has required data
            if (isWashingLine(o.Line_no) && o.MONo) {
              const washKey = `${Inspection_date_str}|${o.MONo}|${o.Color}`;
              
              if (!washingQtyData.has(washKey)) {
                washingQtyData.set(washKey, {
                  Inspection_date: Inspection_date,
                  Style_No: o.MONo,
                  Color: o.Color,
                  Total_Wash_Qty: 0,
                  WorkerWashQty: new Map()
                });
              }
    
              const washData = washingQtyData.get(washKey);
              washData.Total_Wash_Qty += o.Qty;
              
              // Add or update worker quantity
              if (washData.WorkerWashQty.has(QC_ID)) {
                washData.WorkerWashQty.set(QC_ID, washData.WorkerWashQty.get(QC_ID) + o.Qty);
              } else {
                washData.WorkerWashQty.set(QC_ID, o.Qty);
              }
            }
          }
    
          // Rest of the existing code for defects processing...
          const defectGroup = {};
          for (const d of defectRows) {
            const dKey = [d.WorkLine, d.MONo, d.ColorName, d.SizeName].join("|");
            if (!defectGroup[dKey]) defectGroup[dKey] = [];
            defectGroup[dKey].push(d);
          }
    
          const Defect_data = Object.entries(defectGroup).map(([dKey, rows]) => {
            let TotalDefect = 0;
            const defectDetailsMap = new Map();
    
            for (const d of rows) {
              const ddKey = d.ReworkCode + "|" + d.ReworkName;
              if (!defectDetailsMap.has(ddKey)) {
                defectDetailsMap.set(ddKey, {
                  Defect_code: d.ReworkCode || '',
                  Defect_name: d.ReworkName || '',
                  Qty: 0
                });
              }
              defectDetailsMap.get(ddKey).Qty += Number(d.Defect_Qty || 0);
              TotalDefect += Number(d.Defect_Qty || 0);
            }
    
            const [Line_no, MONo, Color, Size] = dKey.split("|");
            return {
              Line_no: Line_no || '',
              MONo: MONo || '',
              Color: Color || '',
              Size: Size || '',
              Defect_qty: TotalDefect,
              DefectDetails: Array.from(defectDetailsMap.values())
            };
          });
    
          // Defect summary
          const defectSummaryMap = new Map();
          for (const d of Defect_data) {
            const key = `${d.Line_no}|${d.MONo}`;
            if (!defectSummaryMap.has(key)) {
              defectSummaryMap.set(key, { Line_no: d.Line_no, MONo: d.MONo, Defect_Qty: 0, Defect_Details: [] });
            }
            defectSummaryMap.get(key).Defect_Qty += d.Defect_qty;
    
            const detailsMap = new Map(defectSummaryMap.get(key).Defect_Details.map(dd => [
              `${dd.Defect_code}|${dd.Defect_name}`, { ...dd }
            ]));
    
            for (const dd of d.DefectDetails) {
              const ddKey = `${dd.Defect_code}|${dd.Defect_name}`;
              if (!detailsMap.has(ddKey)) {
                detailsMap.set(ddKey, { ...dd });
              } else {
                detailsMap.get(ddKey).Qty += dd.Qty;
              }
            }
    
            defectSummaryMap.get(key).Defect_Details = Array.from(detailsMap.values());
          }
    
          const Defect_data_summary = Array.from(defectSummaryMap.values());
          const TotalDefect = Defect_data_summary.reduce((sum, d) => sum + d.Defect_Qty, 0);
    
          docs.set(key, {
            Inspection_date,
            QC_ID,
            report_type: "Inline Finishing",
            Seq_No: [
              ...new Set(
                outputRows.map(r => Number(r.SeqNo || 0))
              )
            ],
            TotalOutput,
            TotalDefect,
            Output_data,
            Output_data_summary,
            Defect_data,
            Defect_data_summary
          });
        }
    
        const finalDocs = Array.from(docs.values());
        
        // Convert washing quantity data to final format with validation
        const washingQtyDocs = Array.from(washingQtyData.values())
          .filter(washData => {
            // Only include records with required fields
            return washData.Inspection_date && washData.Style_No && washData.WorkerWashQty.size > 0;
          })
          .map(washData => ({
            Inspection_date: washData.Inspection_date,
            Style_No: washData.Style_No,
            Color: washData.Color,
            Total_Wash_Qty: washData.Total_Wash_Qty,
            WorkerWashQty: Array.from(washData.WorkerWashQty.entries()).map(([qc_id, qty]) => ({
              QC_ID: qc_id,
              Wash_Qty: qty
            }))
          }));
    
        res.json({ finalDocs, washingQtyDocs });
    
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to process and save QC2 data.' });
      }
  };

  export const saveManualqc2UploadData = async (req, res) => {
    try {
    const { finalDocs, washingQtyData } = req.body;

    // Validate QC data
    const validQCDocs = (finalDocs || []).filter((doc) => {
      return doc.Inspection_date && doc.QC_ID;
    });

    if (validQCDocs.length === 0) {
      return res.status(400).json({ error: "No valid QC data to save." });
    }

    // Validate washing quantity data
    const validWashingDocs = (washingQtyData || []).filter((doc) => {
      return (
        doc.Inspection_date &&
        doc.Style_No &&
        Array.isArray(doc.WorkerWashQty) &&
        doc.WorkerWashQty.length > 0 &&
        doc.WorkerWashQty.every((worker) => worker.QC_ID)
      );
    });

    // QC data bulk operations
    const bulkOps = validQCDocs.map((doc) => ({
      updateOne: {
        filter: {
          Inspection_date:
            doc.Inspection_date instanceof Date
              ? doc.Inspection_date
              : new Date(doc.Inspection_date),
          QC_ID: doc.QC_ID
        },
        update: { $set: doc },
        upsert: true
      }
    }));

    // Washing quantity data bulk operations
    let washingBulkOps = [];
    if (validWashingDocs.length > 0) {
      washingBulkOps = validWashingDocs.map((doc) => ({
        updateOne: {
          filter: {
            Inspection_date:
              doc.Inspection_date instanceof Date
                ? doc.Inspection_date
                : new Date(doc.Inspection_date),
            Style_No: doc.Style_No,
            Color: doc.Color
          },
          update: {
            $set: {
              Inspection_date:
                doc.Inspection_date instanceof Date
                  ? doc.Inspection_date
                  : new Date(doc.Inspection_date),
              Style_No: doc.Style_No,
              Color: doc.Color,
              Total_Wash_Qty: doc.Total_Wash_Qty,
              WorkerWashQty: doc.WorkerWashQty
            }
          },
          upsert: true
        }
      }));
    }

    // Execute both bulk operations
    const results = [];

    if (bulkOps.length > 0) {
      try {
        const qcResult = await QCWorkers.bulkWrite(bulkOps);
        results.push({ type: "QC", result: qcResult });
      } catch (qcError) {
        console.error("QC bulk write error:", qcError);
        return res.status(500).json({
          error: "Failed to save QC data",
          details: qcError.message
        });
      }
    }

    if (washingBulkOps.length > 0) {
      try {
        const washingResult = await QCWashingQtyOld.bulkWrite(washingBulkOps);
        results.push({ type: "Washing", result: washingResult });
      } catch (washingError) {
        console.error("Washing bulk write error:", washingError);
        return res.status(500).json({
          error: "Failed to save washing data",
          details: washingError.message
        });
      }
    }

    res.json({
      success: true,
      qcDataCount: bulkOps.length,
      washingQtyCount: washingBulkOps.length,
      skippedQCRecords: (finalDocs || []).length - validQCDocs.length,
      skippedWashingRecords:
        (washingQtyData || []).length - validWashingDocs.length,
      results: results
    });
  } catch (err) {
    console.error("Manual save error:", err);
    res.status(500).json({
      error: "Failed to manually save QC2 data.",
      details: err.message
    });
  }
  };

  export const getQC2WorkerData = async (req, res) => {
    try {
    const results = await QCWorkers.find({}).lean();
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch QC2 data." });
  }
  };

  export const getQCWashingOldData = async (req, res) => {
    try {
    const results = await QCWashingQtyOld.find({}).lean();
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch washing quantity data." });
  }
  };