import {
  poolYMDataStore,
  poolYMCE,
  poolYMWHSYS2,
  ensurePoolConnected,
} from "../../Config/sqldb.js";
import {
  QC1Sunrise,
  InlineOrders,
  CuttingOrders,
  CutPanelOrders,
} from "../../Config/mongodb.js"; // Assuming MongoDB models are correctly exported

// Helper function to determine Buyer based on MONo (moved here)
export const determineBuyer = (MONo) => {
  if (!MONo) return "Other";
  if (MONo.includes("CO")) return "Costco";
  if (MONo.includes("AR")) return "Aritzia";
  if (MONo.includes("RT")) return "Reitmans";
  if (MONo.includes("AF")) return "ANF";
  if (MONo.includes("NT")) return "STORI";
  return "Other";
};

// Function to fetch RS18 data (defects) - Last 7 days only
const fetchRS18Data = async () => {
  try {
    await ensurePoolConnected(poolYMDataStore, "YMDataStore");
    const request = poolYMDataStore.request();
    const query = `
      SELECT
        FORMAT(CAST(dDate AS DATE), 'MM-dd-yyyy') AS InspectionDate,
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName,
        ReworkCode,
        CASE ReworkCode
          WHEN '1' THEN N'សំរុងវែងខ្លីមិនស្មើគ្នា(ខោ ដៃអាវ) / 左右長短(裤和袖长) / Uneven leg/sleeve length'
          WHEN '2' THEN N'មិនមែនកែដេរ / 非本位返工 / Non-defective'
          WHEN '3' THEN N'ដេររមួល / 扭 / Twisted'
          WHEN '4' THEN N'ជ្រួញនិងទឹករលក និងប៉ោងសាច់ / 起皺/波浪/起包 / Puckering/ Wavy/ Fullness'
          WHEN '5' THEN N'ដាច់អំបោះ / 斷線 / Broken stitches'
          WHEN '6' THEN N'លោតអំបោះ / 跳線 / Skipped stitches'
          WHEN '7' THEN N'ប្រឡាក់ប្រេង / 油漬 / Oil stain'
          WHEN '8' THEN N'ធ្លុះរន្ធ / 破洞 (包括針洞) / Hole/ Needle hole'
          WHEN '9' THEN N'ខុសពណ៏ / 色差 / Color shading'
          WHEN '10' THEN N'ផ្លាកដេរខុសសេរីនិងដេរខុសផ្លាក / 嘜頭錯碼/車錯嘜頭 / Label sewn wrong size/style/po'
          WHEN '11' THEN N'ប្រឡាក់ / 髒污 / Dirty stain'
          WHEN '12' THEN N'រហែកថ្នេរ / 爆縫 / Open seam'
          WHEN '13' THEN N'អត់បានដេរ / 漏車縫/漏空 / Missed sewing'
          WHEN '14' THEN N'ព្រុយ / 線頭 / Untrimmed thread ends'
          WHEN '15' THEN N'ខូចសាច់ក្រណាត់(មិនអាចកែ) / 布疵（改不了） / Fabric defect (unrepairable)'
          WHEN '16' THEN N'គៀបសាច់ / 打折 / Pleated'
          WHEN '17' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់ / 燙畫/印花/繡花 / Heat transfer/ Printing/ EMB defect'
          WHEN '18' THEN N'អាវកែផ្សេងៗ / 其它返工 / Others'
          WHEN '19' THEN N'អ៊ុតអត់ជាប់ / 熨燙不良 / Insecure of Heat transfer'
          WHEN '20' THEN N'ទំហំទទឺងតូចធំមិនស្មើគ្នា / 左右大小不均匀 / Uneven width'
          WHEN '21' THEN N'គំលាតម្ជុល តឹង និង ធូរអំបោះពេក / 針距: 線緊/線鬆 / Stitch density tight/loose'
          WHEN '22' THEN N'សល់ជាយ និង ព្រុយខាងៗ / 毛邊 止口 / Fray edge / Raw edge'
          WHEN '23' THEN N'ជ្រលក់ពណ៏ខុស រឺក៏ ខូច / 染色不正確 - 次品/廢品 / Incorrect dying'
          WHEN '24' THEN N'ប្រឡាក់ប្រេង2 / 油漬2 / Oil stain 2'
          WHEN '25' THEN N'ខុសពណ៏2 / 色差2 / Color variation 2'
          WHEN '26' THEN N'ប្រឡាក់2 / 髒污2 / Dirty stain 2'
          WHEN '27' THEN N'ឆ្នូតក្រណាត់2 / 布疵2 / Fabric defect 2'
          WHEN '28' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់2 / 燙畫 / 印花 /繡花 2 / Heat transfer/ Printing/ EMB defect 2'
          WHEN '29' THEN N'ដេរអត់ជាប់ / 不牢固 / Insecure'
          WHEN '30' THEN N'ដេរធ្លាក់ទឹក / 落坑 / Run off stitching'
          WHEN '31' THEN N'ខូចទ្រង់ទ្រាយ / 形状不良 / Poor shape'
          WHEN '32' THEN N'បញ្ហាក្រណាត់ចូលអំបោះ ទាក់សាច់(កែបាន) / 布有飞纱，勾纱(可修) / Fabric fly yarn / snagging (repairable)'
          WHEN '33' THEN N'មិនចំគ្នា / 不对称（骨位，间条） / Mismatched'
          WHEN '34' THEN N'បញ្ហាដេរផ្លាក៖ ខុសទីតាំង បញ្ច្រាស់ តូចធំ វៀច / 车标问题:错位置,反,高低,歪斜 / Label: misplace,invert,uneven,slant'
          WHEN '35' THEN N'ស្មាមម្ជុល / 针孔 / Needle Mark'
          WHEN '36' THEN N'បញ្ហាអាវដេរខុសសេរី(ខុសផ្ទាំង ចង្កេះ -ល-) / 衣服錯碼(某部位/裁片) / Wrong size of garment(cut panel/part)'
          WHEN '37' THEN N'ផ្សេងៗ / 其它-做工不良 / Others - Poor Workmanship (Spare) 2'
          WHEN '38' THEN N'បញ្ហាបោកទឹក / ជ្រលក់ពណ៌ / 洗水 / 染色不正确 / Improper Washing Dyeing'
          WHEN '39' THEN N'បញ្ហាអ៊ុត- ឡើងស / ស្នាម / ខ្លោច -ល- / 烫工不良:起镜 / 压痕 / 烫焦 / Improper Ironing: Glazing / Mark / Scorch, etc…'
          WHEN '40' THEN N'បញ្ហាអ៊ុត: ខូចទ្រង់ទ្រាយ / ខូចរាង / 烫工不良:变形 / 外观不良 / Improper Ironing: Off Shape / Poor Appearance'
          WHEN '41' THEN N'ឆ្វេងស្តាំខ្ពស់ទាបមិនស្មើគ្នា / 左右高低 / Asymmetry / Hi-Low'
          WHEN '42' THEN N'ថ្នេរដេរមិនត្រួតគ្នា តូចធំមិនស្មើគ្នា / 车线不重叠 大小不均匀 / Uneven / Misalign stitches'
          WHEN '43' THEN N'បញ្ហាលើសខ្នាត(+) / 尺寸问题 (+大) / Measurement issue positive'
          WHEN '44' THEN N'បញ្ហាខ្វះខ្នាត(-) / 尺寸问题 (-小) / Measurement issue negative'
          ELSE NULL
        END AS ReworkName,
        SUM(QtyRework) AS DefectsQty
      FROM
        YMDataStore.SUNRISE.RS18 r
      WHERE
        TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
        AND SeqNo <> 700
        AND TRY_CAST(ReworkCode AS INT) BETWEEN 1 AND 44
        AND CAST(dDate AS DATE) >= DATEADD(DAY, -7, GETDATE())
        AND CAST(dDate AS DATE) < DATEADD(DAY, 1, GETDATE())
      GROUP BY
        CAST(dDate AS DATE),
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName,
        ReworkCode
      HAVING
        CASE ReworkCode
          WHEN '1' THEN N'សំរុងវែងខ្លីមិនស្មើគ្នា(ខោ ដៃអាវ) / 左右長短(裤和袖长) / Uneven leg/sleeve length'
          WHEN '2' THEN N'មិនមែនកែដេរ / 非本位返工 / Non-defective'
          WHEN '3' THEN N'ដេររមួល / 扭 / Twisted'
          WHEN '4' THEN N'ជ្រួញនិងទឹករលក និងប៉ោងសាច់ / 起皺/波浪/起包 / Puckering/ Wavy/ Fullness'
          WHEN '5' THEN N'ដាច់អំបោះ / 斷線 / Broken stitches'
          WHEN '6' THEN N'លោតអំបោះ / 跳線 / Skipped stitches'
          WHEN '7' THEN N'ប្រឡាក់ប្រេង / 油漬 / Oil stain'
          WHEN '8' THEN N'ធ្លុះរន្ធ / 破洞 (包括針洞) / Hole/ Needle hole'
          WHEN '9' THEN N'ខុសពណ៏ / 色差 / Color shading'
          WHEN '10' THEN N'ផ្លាកដេរខុសសេរីនិងដេរខុសផ្លាក / 嘜頭錯碼/車錯嘜頭 / Label sewn wrong size/style/po'
          WHEN '11' THEN N'ប្រឡាក់ / 髒污 / Dirty stain'
          WHEN '12' THEN N'រហែកថ្នេរ / 爆縫 / Open seam'
          WHEN '13' THEN N'អត់បានដេរ / 漏車縫/漏空 / Missed sewing'
          WHEN '14' THEN N'ព្រុយ / 線頭 / Untrimmed thread ends'
          WHEN '15' THEN N'ខូចសាច់ក្រណាត់(មិនអាចកែ) / 布疵（改不了） / Fabric defect (unrepairable)'
          WHEN '16' THEN N'គៀបសាច់ / 打折 / Pleated'
          WHEN '17' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់ / 燙畫/印花/繡花 / Heat transfer/ Printing/ EMB defect'
          WHEN '18' THEN N'អាវកែផ្សេងៗ / 其它返工 / Others'
          WHEN '19' THEN N'អ៊ុតអត់ជាប់ / 熨燙不良 / Insecure of Heat transfer'
          WHEN '20' THEN N'ទំហំទទឺងតូចធំមិនស្មើគ្នា / 左右大小不均匀 / Uneven width'
          WHEN '21' THEN N'គំលាតម្ជុល តឹង និង ធូរអំបោះពេក / 針距: 線緊/線鬆 / Stitch density tight/loose'
          WHEN '22' THEN N'សល់ជាយ និង ព្រុយខាងៗ / 毛邊 止口 / Fray edge / Raw edge'
          WHEN '23' THEN N'ជ្រលក់ពណ៏ខុស រឺក៏ ខូច / 染色不正確 - 次品/廢品 / Incorrect dying'
          WHEN '24' THEN N'ប្រឡាក់ប្រេង2 / 油漬2 / Oil stain 2'
          WHEN '25' THEN N'ខុសពណ៏2 / 色差2 / Color variation 2'
          WHEN '26' THEN N'ប្រឡាក់2 / 髒污2 / Dirty stain 2'
          WHEN '27' THEN N'ឆ្នូតក្រណាត់2 / 布疵2 / Fabric defect 2'
          WHEN '28' THEN N'បញ្ហាផ្លាកអ៊ុត ព្រីននិងប៉ាក់2 / 燙畫 / 印花 /繡花 2 / Heat transfer/ Printing/ EMB defect 2'
          WHEN '29' THEN N'ដេរអត់ជាប់ / 不牢固 / Insecure'
          WHEN '30' THEN N'ដេរធ្លាក់ទឹក / 落坑 / Run off stitching'
          WHEN '31' THEN N'ខូចទ្រង់ទ្រាយ / 形状不良 / Poor shape'
          WHEN '32' THEN N'បញ្ហាក្រណាត់ចូលអំបោះ ទាក់សាច់(កែបាន) / 布有飞纱，勾纱(可修) / Fabric fly yarn / snagging (repairable)'
          WHEN '33' THEN N'មិនចំគ្នា / 不对称（骨位，间条） / Mismatched'
          WHEN '34' THEN N'បញ្ហាដេរផ្លាក៖ ខុសទីតាំង បញ្ច្រាស់ តូចធំ វៀច / 车标问题:错位置,反,高低,歪斜 / Label: misplace,invert,uneven,slant'
          WHEN '35' THEN N'ស្មាមម្ជុល / 针孔 / Needle Mark'
          WHEN '36' THEN N'បញ្ហាអាវដេរខុសសេរី(ខុសផ្ទាំង ចង្កេះ -ល-) / 衣服錯碼(某部位/裁片) / Wrong size of garment(cut panel/part)'
          WHEN '37' THEN N'ផ្សេងៗ / 其它-做工不良 / Others - Poor Workmanship (Spare) 2'
          WHEN '38' THEN N'បញ្ហាបោកទឹក / ជ្រលក់ពណ៌ / 洗水 / 染色不正确 / Improper Washing Dyeing'
          WHEN '39' THEN N'បញ្ហាអ៊ុត- ឡើងស / ស្នាម / ខ្លោច -ល- / 烫工不良:起镜 / 压痕 / 烫焦 / Improper Ironing: Glazing / Mark / Scorch, etc…'
          WHEN '40' THEN N'បញ្ហាអ៊ុត: ខូចទ្រង់ទ្រាយ / ខូចរាង / 烫工不良:变形 / 外观不良 / Improper Ironing: Off Shape / Poor Appearance'
          WHEN '41' THEN N'ឆ្វេងស្តាំខ្ពស់ទាបមិនស្មើគ្នា / 左右高低 / Asymmetry / Hi-Low'
          WHEN '42' THEN N'ថ្នេរដេរមិនត្រួតគ្នា តូចធំមិនស្មើគ្នា / 车线不重叠 大小不均匀 / Uneven / Misalign stitches'
          WHEN '43' THEN N'បញ្ហាលើសខ្នាត(+) / 尺寸问题 (+大) / Measurement issue positive'
          WHEN '44' THEN N'បញ្ហាខ្វះខ្នាត(-) / 尺寸问题 (-小) / Measurement issue negative'
          ELSE NULL
        END IS NOT NULL;
    `;
    const result = await request.query(query);
    console.log(
      `Fetched ${result.recordset.length} RS18 records from the last 7 days`
    );
    return result.recordset;
  } catch (err) {
    console.error("Error fetching RS18 data:", err);
    throw err;
  }
};

// Function to fetch Output data - Last 7 days only
const fetchOutputData = async () => {
  try {
    await ensurePoolConnected(poolYMDataStore, "YMDataStore");
    const request = poolYMDataStore.request();
    const query = `
      SELECT
        FORMAT(CAST(BillDate AS DATE), 'MM-dd-yyyy') AS InspectionDate,
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName,
        SUM(CASE WHEN SeqNo = 38 THEN Qty ELSE 0 END) AS TotalQtyT38,
        SUM(CASE WHEN SeqNo = 39 THEN Qty ELSE 0 END) AS TotalQtyT39
      FROM
      (
        SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2023
        UNION ALL
        SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2024
        UNION ALL
        SELECT BillDate, WorkLine, MONo, SizeName, ColorNo, ColorName, SeqNo, Qty FROM YMDataStore.SunRise_G.tWork2025
      ) AS CombinedData
      WHERE
        SeqNo IN (38, 39)
        AND TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
        AND CAST(BillDate AS DATE) >= DATEADD(DAY, -7, GETDATE())
        AND CAST(BillDate AS DATE) < DATEADD(DAY, 1, GETDATE())
      GROUP BY
        CAST(BillDate AS DATE),
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName;
    `;
    const result = await request.query(query);
    console.log(
      `Fetched ${result.recordset.length} Output records from the last 7 days`
    );
    return result.recordset;
  } catch (err) {
    console.error("Error fetching Output data:", err);
    throw err;
  }
};

// Function to sync data to MongoDB - Only process last 7 days and update if modified
export const syncQC1SunriseData = async () => {
  try {
      console.log("Starting QC1 Sunrise data sync at", new Date().toISOString());
  
      // Fetch data from both sources (last 7 days only)
      const [rs18Data, outputData] = await Promise.all([
        fetchRS18Data(),
        fetchOutputData()
      ]);
  
      if (outputData.length === 0) {
        console.log(
          "No output data fetched from SQL Server for the last 7 days. Sync aborted."
        );
        return;
      }
  
      // Create a map for defect data for quick lookup
      const defectMap = new Map();
      rs18Data.forEach((defect) => {
        const key = `${defect.InspectionDate}-${defect.WorkLine}-${defect.MONo}-${defect.SizeName}-${defect.ColorNo}-${defect.ColorName}`;
        if (!defectMap.has(key)) {
          defectMap.set(key, []);
        }
        defectMap.get(key).push({
          defectCode: defect.ReworkCode,
          defectName: defect.ReworkName,
          defectQty: defect.DefectsQty
        });
      });
      console.log(`Defect Map contains ${defectMap.size} entries with defects`);
  
      // Prepare MongoDB documents starting from output data
      const documents = [];
      outputData.forEach((output) => {
        const key = `${output.InspectionDate}-${output.WorkLine}-${output.MONo}-${output.SizeName}-${output.ColorNo}-${output.ColorName}`;
        const defectArray = defectMap.get(key) || []; // Empty array if no defects
  
        const totalDefectsQty = defectArray.reduce(
          (sum, defect) => sum + defect.defectQty,
          0
        );
        const checkedQty = Math.max(
          output.TotalQtyT38 || 0,
          output.TotalQtyT39 || 0
        );
  
        const doc = {
          inspectionDate: output.InspectionDate,
          lineNo: output.WorkLine,
          MONo: output.MONo,
          Size: output.SizeName,
          Color: output.ColorName,
          ColorNo: output.ColorNo,
          Buyer: determineBuyer(output.MONo),
          CheckedQtyT38: output.TotalQtyT38 || 0,
          CheckedQtyT39: output.TotalQtyT39 || 0,
          CheckedQty: checkedQty,
          DefectArray: defectArray, // Will be empty if no defects
          totalDefectsQty: totalDefectsQty
        };
        documents.push(doc);
      });
      console.log(`Prepared ${documents.length} documents for MongoDB`);
  
      // Log a sample document
      if (documents.length > 0) {
        console.log("Sample Document:", documents[0]);
      }
  
      // Fetch existing documents from MongoDB for comparison (only for the last 7 days)
      const existingDocs = await QC1Sunrise.find({
        inspectionDate: {
          $gte: new Date(new Date().setDate(new Date().getDate() - 7))
            .toISOString()
            .split("T")[0]
        }
      }).lean();
      const existingDocsMap = new Map();
      existingDocs.forEach((doc) => {
        const key = `${doc.inspectionDate}-${doc.lineNo}-${doc.MONo}-${doc.Size}-${doc.ColorNo}`;
        existingDocsMap.set(key, doc);
      });
      console.log(
        `Fetched ${existingDocsMap.size} existing documents from qc1_sunrise for comparison`
      );
  
      // Filter documents to only include those that are new or have changed
      const documentsToUpdate = [];
      for (const doc of documents) {
        const key = `${doc.inspectionDate}-${doc.lineNo}-${doc.MONo}-${doc.Size}-${doc.ColorNo}`;
        const existingDoc = existingDocsMap.get(key);
  
        if (!existingDoc) {
          // New document, include it
          documentsToUpdate.push(doc);
        } else {
          // Compare fields to check for changes
          const hasChanged =
            existingDoc.CheckedQtyT38 !== doc.CheckedQtyT38 ||
            existingDoc.CheckedQtyT39 !== doc.CheckedQtyT39 ||
            existingDoc.CheckedQty !== doc.CheckedQty ||
            existingDoc.totalDefectsQty !== doc.totalDefectsQty ||
            JSON.stringify(existingDoc.DefectArray) !==
              JSON.stringify(doc.DefectArray);
  
          if (hasChanged) {
            documentsToUpdate.push(doc);
          }
        }
      }
      console.log(
        `Filtered down to ${documentsToUpdate.length} documents that are new or modified`
      );
  
      // Bulk upsert into MongoDB
      const bulkOps = documentsToUpdate.map((doc) => ({
        updateOne: {
          filter: {
            inspectionDate: doc.inspectionDate,
            lineNo: doc.lineNo,
            MONo: doc.MONo,
            Size: doc.Size,
            ColorNo: doc.ColorNo
          },
          update: { $set: doc },
          upsert: true
        }
      }));
  
      if (bulkOps.length > 0) {
        const result = await QC1Sunrise.bulkWrite(bulkOps);
        console.log(
          `Bulk write result: Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`
        );
        console.log(
          `Successfully synced ${bulkOps.length} documents to qc1_sunrise.`
        );
      } else {
        console.log("No new or modified documents to upsert");
        console.log("Successfully synced 0 documents to qc1_sunrise.");
      }
  
      // Verify collection contents
      const collectionCount = await QC1Sunrise.countDocuments();
      console.log(
        `Total documents in qc1_sunrise collection: ${collectionCount}`
      );
  
      console.log(
        `Successfully completed QC1 Sunrise sync with ${documentsToUpdate.length} new or modified records`
      );
    } catch (err) {
      console.error("Error syncing QC1 Sunrise data:", err);
      throw err;
    }
  };

export const syncInlineOrders = async () => {
  try {
    console.log("Starting inline_orders sync at", new Date().toISOString());
    await ensurePoolConnected(poolYMCE, "YMCE_SYSTEM");

    const request = poolYMCE.request();

    console.log(
      "Using connection to:",
      poolYMCE.config.server,
      "database:",
      poolYMCE.config.database
    );

    const query = `
      SELECT 
        St_No,
        By_Style,
        Tg_No,
        Tg_Code, 
        Ma_Code,
        ch_name,
        kh_name,
        Dept_Type
      FROM 
        dbo.ViewTg vt
      WHERE 
        Dept_Type = 'Sewing';
    `;

    const result = await request.query(query);
    const data = result.recordset;

    if (data.length === 0) {
      console.log("No data to sync to inline_orders.");
      return;
    }

    // Group data by St_No, By_Style, and Dept_Type
    const groupedData = data.reduce((acc, row) => {
      const key = `${row.St_No}_${row.By_Style}_${row.Dept_Type}`;
      if (!acc[key]) {
        acc[key] = {
          St_No: row.St_No,
          By_Style: row.By_Style,
          Dept_Type: row.Dept_Type,
          orderData: []
        };
      }
      acc[key].orderData.push({
        Tg_No: row.Tg_No,
        Tg_Code: row.Tg_Code,
        Ma_Code: row.Ma_Code,
        ch_name: row.ch_name,
        kh_name: row.kh_name,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return acc;
    }, {});

    const documents = Object.values(groupedData);

    // Use bulkWrite with upsert to update or insert documents
    const bulkOps = documents.map((doc) => ({
      updateOne: {
        filter: {
          St_No: doc.St_No,
          By_Style: doc.By_Style,
          Dept_Type: doc.Dept_Type
        },
        update: {
          $set: {
            St_No: doc.St_No,
            By_Style: doc.By_Style,
            Dept_Type: doc.Dept_Type,
            orderData: doc.orderData,
            updatedAt: new Date()
          },
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        upsert: true
      }
    }));

    await InlineOrders.bulkWrite(bulkOps);
    console.log(
      `Successfully synced ${documents.length} documents to inline_orders.`
    );

    // Optional: Remove documents that no longer exist in the source data
    const existingKeys = documents.map(
      (doc) => `${doc.St_No}_${doc.By_Style}_${doc.Dept_Type}`
    );
    await InlineOrders.deleteMany({
      $and: [
        { St_No: { $exists: true } },
        { By_Style: { $exists: true } },
        { Dept_Type: { $exists: true } },
        {
          $expr: {
            $not: {
              $in: [
                { $concat: ["$St_No", "_", "$By_Style", "_", "$Dept_Type"] },
                existingKeys
              ]
            }
          }
        }
      ]
    });
    console.log("Removed outdated documents from inline_orders.");
  } catch (err) {
    console.error("Error during inline_orders sync:", err);
    throw err;
  }
};

export const syncCuttingOrders = async () => {
  try {
    console.log("Starting cuttingOrders sync at", new Date().toISOString());
    await ensurePoolConnected(poolYMWHSYS2, "YMWHSYS2");

    // Define SQL queries
    const query1 = `
      SELECT 
        StyleNo, 
        Batch AS LotNo
      FROM [YMWHSYS2].[dbo].[tbSpreading]
      GROUP BY StyleNo, Batch
      ORDER BY StyleNo, Batch;
    `;

    const query2 = `
      SELECT DISTINCT 
        StyleNo, 
        Buyer, 
        BuyerStyle, 
        EngColor, 
        ChColor, 
        ColorCode, 
        Size1, 
        Size2, 
        Size3, 
        Size4, 
        Size5, 
        Size6, 
        Size7, 
        Size8, 
        Size9, 
        Size10
      FROM [YMWHSYS2].[dbo].[ViewCuttingOrderReport]
      WHERE FabricType = 'A'
      ORDER BY StyleNo, Buyer, BuyerStyle, EngColor, ChColor, ColorCode;
    `;

    const query3 = `
      SELECT 
        StyleNo, 
        Buyer, 
        BuyerStyle, 
        EngColor, 
        ChColor, 
        ColorCode, 
        SUM(Qty1) AS Sum_Qty1,
        SUM(Qty2) AS Sum_Qty2,
        SUM(Qty3) AS Sum_Qty3,
        SUM(Qty4) AS Sum_Qty4,
        SUM(Qty5) AS Sum_Qty5,
        SUM(Qty6) AS Sum_Qty6,
        SUM(Qty7) AS Sum_Qty7,
        SUM(Qty8) AS Sum_Qty8,
        SUM(Qty9) AS Sum_Qty9,
        SUM(Qty10) AS Sum_Qty10
      FROM [YMWHSYS2].[dbo].[ViewCuttingOrderReport]
      WHERE FabricType = 'A'
      GROUP BY 
        StyleNo, 
        Buyer, 
        BuyerStyle, 
        EngColor, 
        ChColor, 
        ColorCode
      ORDER BY 
        StyleNo, 
        Buyer, 
        BuyerStyle, 
        EngColor, 
        ChColor, 
        ColorCode;
    `;

    const query4 = `
      SELECT 
        StyleNo, 
        Buyer, 
        BuyerStyle, 
        EngColor, 
        ChColor, 
        ColorCode, 
        TableNo, 
        MackerNo, 
        MAX(PlanLayer) AS PlanLayer,
        MAX(PlanPcs) AS PlanPcs,
        MAX(ActualLayer) AS ActualLayer,
        MAX(RollQty) AS RollQty,
        MAX(Ratio1) AS Ratio1,
        MAX(Ratio2) AS Ratio2,
        MAX(Ratio3) AS Ratio3,
        MAX(Ratio4) AS Ratio4,
        MAX(Ratio5) AS Ratio5,
        MAX(Ratio6) AS Ratio6,
        MAX(Ratio7) AS Ratio7,
        MAX(Ratio8) AS Ratio8,
        MAX(Ratio9) AS Ratio9,
        MAX(Ratio10) AS Ratio10
      FROM [YMWHSYS2].[dbo].[ViewCuttingDetailReport]
      WHERE FabricType = 'A' 
      GROUP BY 
        StyleNo, 
        Buyer, 
        BuyerStyle, 
        EngColor, 
        ChColor, 
        ColorCode, 
        TableNo, 
        MackerNo
      ORDER BY 
        StyleNo, 
        Buyer, 
        BuyerStyle, 
        EngColor, 
        ChColor, 
        ColorCode, 
        TableNo, 
        MackerNo;
    `;

    // Fetch data concurrently
    const [lotNumbersResult, sizesResult, orderQtyResult, markersResult] =
      await Promise.all([
        poolYMWHSYS2.request().query(query1),
        poolYMWHSYS2.request().query(query2),
        poolYMWHSYS2.request().query(query3),
        poolYMWHSYS2.request().query(query4)
      ]);

    // Process lot numbers into a map
    const lotNumbersMap = {};
    lotNumbersResult.recordset.forEach((row) => {
      if (!lotNumbersMap[row.StyleNo]) {
        lotNumbersMap[row.StyleNo] = new Set();
      }
      lotNumbersMap[row.StyleNo].add(row.LotNo);
    });

    //Process sizes into a map
    const sizesMap = {};
    sizesResult.recordset.forEach((row) => {
      const key = `${row.StyleNo}|${row.Buyer}|${row.BuyerStyle}|${row.EngColor}|${row.ChColor}|${row.ColorCode}`;
      sizesMap[key] = {
        Size1: row.Size1,
        Size2: row.Size2,
        Size3: row.Size3,
        Size4: row.Size4,
        Size5: row.Size5,
        Size6: row.Size6,
        Size7: row.Size7,
        Size8: row.Size8,
        Size9: row.Size9,
        Size10: row.Size10
      };
    });

    // Process order quantities into a map
    const orderQtyMap = {};
    orderQtyResult.recordset.forEach((row) => {
      const key = `${row.StyleNo}|${row.Buyer}|${row.BuyerStyle}|${row.EngColor}|${row.ChColor}|${row.ColorCode}`;
      orderQtyMap[key] = {
        Sum_Qty1: row.Sum_Qty1,
        Sum_Qty2: row.Sum_Qty2,
        Sum_Qty3: row.Sum_Qty3,
        Sum_Qty4: row.Sum_Qty4,
        Sum_Qty5: row.Sum_Qty5,
        Sum_Qty6: row.Sum_Qty6,
        Sum_Qty7: row.Sum_Qty7,
        Sum_Qty8: row.Sum_Qty8,
        Sum_Qty9: row.Sum_Qty9,
        Sum_Qty10: row.Sum_Qty10
      };
    });

    // Process markers into a map
    const markersMap = {};
    markersResult.recordset.forEach((row) => {
      const key = `${row.StyleNo}|${row.Buyer}|${row.BuyerStyle}|${row.EngColor}|${row.ChColor}|${row.ColorCode}`;
      if (!markersMap[key]) {
        markersMap[key] = [];
      }
      markersMap[key].push({
        TableNo: row.TableNo,
        MackerNo: row.MackerNo,
        PlanLayer: row.PlanLayer, // Include PlanLayer
        PlanPcs: row.PlanPcs, // Include PlanPcs
        ActualLayer: row.ActualLayer, // Include ActualLayer
        Ratio1: row.Ratio1,
        Ratio2: row.Ratio2,
        Ratio3: row.Ratio3,
        Ratio4: row.Ratio4,
        Ratio5: row.Ratio5,
        Ratio6: row.Ratio6,
        Ratio7: row.Ratio7,
        Ratio8: row.Ratio8,
        Ratio9: row.Ratio9,
        Ratio10: row.Ratio10
      });
    });

    // Build MongoDB documents
    const documents = [];
    for (const key in sizesMap) {
      const [StyleNo, Buyer, BuyerStyle, EngColor, ChColor, ColorCode] =
        key.split("|");
      const sizes = sizesMap[key];
      const orderQtys = orderQtyMap[key] || {};
      const markers = markersMap[key] || [];
      const lotNumbers = lotNumbersMap[StyleNo]
        ? Array.from(lotNumbersMap[StyleNo])
        : [];

      // Build lotNo array
      const lotNoArray = lotNumbers.map((lotName, index) => ({
        No: index + 1,
        LotName: lotName
      }));

      // Build cuttingData array
      const cuttingData = markers.map((marker) => {
        const markerData = [];
        for (let i = 1; i <= 10; i++) {
          markerData.push({
            No: i,
            size: sizes[`Size${i}`] || null,
            orderQty: orderQtys[`Sum_Qty${i}`] || null,
            markerRatio: marker[`Ratio${i}`] || null
          });
        }
        return {
          tableNo: marker.TableNo,
          markerNo: marker.MackerNo,
          planLayerQty: marker.PlanLayer || 0, // Map PlanLayer to planLayerQty
          totalPlanPcs: marker.PlanPcs || 0, // Map PlanPcs to totalPlanPcs
          actualLayers: marker.ActualLayer || 0, // Map ActualLayer to actualLayers
          markerData
        };
      });

      // Calculate totalOrderQty
      let totalOrderQty = 0;
      for (let i = 1; i <= 10; i++) {
        totalOrderQty += orderQtys[`Sum_Qty${i}`] || 0;
      }

      // Create document
      documents.push({
        StyleNo,
        Buyer,
        BuyerStyle,
        EngColor,
        ChColor,
        ColorCode,
        lotNo: lotNoArray,
        cuttingData,
        totalOrderQty
      });
    }

    // Sync to MongoDB
    await CuttingOrders.deleteMany({});
    await CuttingOrders.insertMany(documents);
    console.log(
      `Successfully synced ${documents.length} documents to cuttingOrders.`
    );
  } catch (err) {
    console.error("Error during cuttingOrders sync:", err);
    throw err;
  }
};

export const syncCutPanelOrders = async () => {
 try {
    console.log("Starting cutpanelorders sync at", new Date().toISOString());

    await ensurePoolConnected(poolYMWHSYS2, "YMWHSYS2");

    const query = `
    WITH AggregatedQty AS (
    SELECT 
        StyleNo,
        SUM(ISNULL(Qty1, 0) + ISNULL(Qty2, 0) + ISNULL(Qty3, 0) + ISNULL(Qty4, 0) +
            ISNULL(Qty5, 0) + ISNULL(Qty6, 0) + ISNULL(Qty7, 0) + ISNULL(Qty8, 0) +
            ISNULL(Qty9, 0) + ISNULL(Qty10, 0)) AS TotalOrderQtyStyle
    FROM 
        [YMWHSYS2].[dbo].[tbOrderQty]
    WHERE 
        Dept = 'YMCUTTING' AND FabricType = 'A'
    GROUP BY 
        StyleNo
),
OrderAggregates AS (
    SELECT 
        StyleNo,
        EngColor,
        SUM(TTLRoll) AS TotalTTLRoll,
        SUM(TTLQty) AS TotalTTLQty,
        SUM(BiddingQty) AS TotalBiddingQty,
        SUM(BiddingRollQty) AS TotalBiddingRollQty,
        COALESCE(SUM(Qty1), 0) AS OrderQty1,
        COALESCE(SUM(Qty2), 0) AS OrderQty2,
        COALESCE(SUM(Qty3), 0) AS OrderQty3,
        COALESCE(SUM(Qty4), 0) AS OrderQty4,
        COALESCE(SUM(Qty5), 0) AS OrderQty5,
        COALESCE(SUM(Qty6), 0) AS OrderQty6,
        COALESCE(SUM(Qty7), 0) AS OrderQty7,
        COALESCE(SUM(Qty8), 0) AS OrderQty8,
        COALESCE(SUM(Qty9), 0) AS OrderQty9,
        COALESCE(SUM(Qty10), 0) AS OrderQty10,
        COALESCE(SUM(Qty1), 0) + COALESCE(SUM(Qty2), 0) + COALESCE(SUM(Qty3), 0) + 
        COALESCE(SUM(Qty4), 0) + COALESCE(SUM(Qty5), 0) + COALESCE(SUM(Qty6), 0) + 
        COALESCE(SUM(Qty7), 0) + COALESCE(SUM(Qty8), 0) + COALESCE(SUM(Qty9), 0) + 
        COALESCE(SUM(Qty10), 0) AS TotalOrderQty
    FROM 
        [YMWHSYS2].[dbo].[ViewCuttingOrderReport]
    WHERE 
        StyleNo IS NOT NULL AND EngColor IS NOT NULL
    GROUP BY 
        StyleNo, 
        EngColor
)
SELECT 
    v.StyleNo,
    v.TxnDate,
    v.TxnNo,
    CASE WHEN v.Buyer = 'ABC' THEN 'ANF' ELSE v.Buyer END AS Buyer,
    v.EngColor AS Color,
    REPLACE(v.PreparedBy, 'SPREAD ', '') AS SpreadTable,
    v.TableNo,
    v.BuyerStyle,
    v.ChColor,
    v.ColorCode,
    v.FabricType,
    v.Material,
    v.RollQty,
    ROUND(v.SpreadYds, 3) AS SpreadYds,
    v.Unit,
    ROUND(v.GrossKgs, 3) AS GrossKgs,
    ROUND(v.NetKgs, 3) AS NetKgs,
    v.AMackerNo AS MackerNo,
    ROUND(v.MackerLength, 3) AS MackerLength,
    v.SendFactory,
    v.SendTxnDate,
    v.SendTxnNo,
    v.SendTotalQty,
    v.Ratio1 AS CuttingRatio1,
    v.Ratio2 AS CuttingRatio2,
    v.Ratio3 AS CuttingRatio3,
    v.Ratio4 AS CuttingRatio4,
    v.Ratio5 AS CuttingRatio5,
    v.Ratio6 AS CuttingRatio6,
    v.Ratio7 AS CuttingRatio7,
    v.Ratio8 AS CuttingRatio8,
    v.Ratio9 AS CuttingRatio9,
    v.Ratio10 AS CuttingRatio10,
    MAX(v.PlanLayer) AS PlanLayer,
    MAX(v.ActualLayer) AS ActualLayer,
    MAX(v.PlanPcs) AS TotalPcs,
    STUFF((
        SELECT DISTINCT ', ' + CAST(s2.Batch AS VARCHAR)
        FROM [YMWHSYS2].[dbo].[tbSpreading] s2
        WHERE s2.StyleNo = v.StyleNo
          AND s2.PreparedBy = v.PreparedBy
          AND s2.Batch IS NOT NULL
        FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS LotNos,
    t.Size1,
    t.Size2,
    t.Size3,
    t.Size4,
    t.Size5,
    t.Size6,
    t.Size7,
    t.Size8,
    t.Size9,
    t.Size10,
    t.OrderQty1,
    t.OrderQty2,
    t.OrderQty3,
    t.OrderQty4,
    t.OrderQty5,
    t.OrderQty6,
    t.OrderQty7,
    t.OrderQty8,
    t.OrderQty9,
    t.OrderQty10,
    t.TotalOrderQty,
    t.TotalTTLRoll,
    t.TotalTTLQty,
    t.TotalBiddingQty,
    t.TotalBiddingRollQty,
    agg.TotalOrderQtyStyle
FROM 
    [YMWHSYS2].[dbo].[ViewCuttingDetailReport] v
    LEFT JOIN [YMWHSYS2].[dbo].[tbSpreading] s
        ON v.StyleNo = s.StyleNo
        AND v.PreparedBy = s.PreparedBy
    LEFT JOIN (
        SELECT DISTINCT
            t.StyleNo,
            t.EngColor AS Color,
            t.Size1,
            t.Size2,
            t.Size3,
            t.Size4,
            t.Size5,
            t.Size6,
            t.Size7,
            t.Size8,
            t.Size9,
            t.Size10,
            agg.OrderQty1,
            agg.OrderQty2,
            agg.OrderQty3,
            agg.OrderQty4,
            agg.OrderQty5,
            agg.OrderQty6,
            agg.OrderQty7,
            agg.OrderQty8,
            agg.OrderQty9,
            agg.OrderQty10,
            agg.TotalOrderQty,
            agg.TotalTTLRoll,
            agg.TotalTTLQty,
            agg.TotalBiddingQty,
            agg.TotalBiddingRollQty
        FROM 
            [YMWHSYS2].[dbo].[ViewCuttingOrderReport] t
            LEFT JOIN OrderAggregates agg
                ON t.StyleNo = agg.StyleNo
                AND t.EngColor = agg.EngColor
        WHERE 
            t.StyleNo IS NOT NULL
            AND t.EngColor IS NOT NULL
    ) t
        ON v.StyleNo = t.StyleNo
        AND v.EngColor = t.Color
    LEFT JOIN AggregatedQty agg
        ON v.StyleNo = agg.StyleNo
WHERE 
    v.TableNo IS NOT NULL 
    AND v.TableNo <> '' 
    AND v.TxnDate >= CAST(DATEADD(DAY, -7, GETDATE()) AS DATE)
GROUP BY 
    v.StyleNo,
    v.TxnDate,
    v.TxnNo,
    v.Buyer,
    v.EngColor,
    v.PreparedBy,
    v.TableNo,
    v.BuyerStyle,
    v.ChColor,
    v.ColorCode,
    v.FabricType,
    v.Material,
    v.RollQty,
    v.SpreadYds,
    v.Unit,
    v.GrossKgs,
    v.NetKgs,
    v.AMackerNo,
    v.MackerLength,
    v.SendFactory,
    v.SendTxnDate,
    v.SendTxnNo,
    v.SendTotalQty,
    v.Ratio1,
    v.Ratio2,
    v.Ratio3,
    v.Ratio4,
    v.Ratio5,
    v.Ratio6,
    v.Ratio7,
    v.Ratio8,
    v.Ratio9,
    v.Ratio10,
    t.Size1,
    t.Size2,
    t.Size3,
    t.Size4,
    t.Size5,
    t.Size6,
    t.Size7,
    t.Size8,
    t.Size9,
    t.Size10,
    t.OrderQty1,
    t.OrderQty2,
    t.OrderQty3,
    t.OrderQty4,
    t.OrderQty5,
    t.OrderQty6,
    t.OrderQty7,
    t.OrderQty8,
    t.OrderQty9,
    t.OrderQty10,
    t.TotalOrderQty,
    t.TotalTTLRoll,
    t.TotalTTLQty,
    t.TotalBiddingQty,
    t.TotalBiddingRollQty,
    agg.TotalOrderQtyStyle
ORDER BY 
    v.TxnDate DESC;
    `;

    const result = await poolYMWHSYS2.request().query(query);

    const bulkOps = result.recordset.map((row) => {
      const markerRatio = [];

      for (let i = 1; i <= 10; i++) {
        markerRatio.push({
          no: i,
          size: row[`Size${i}`],
          cuttingRatio: row[`CuttingRatio${i}`],
          orderQty: row[`OrderQty${i}`]
        });
      }

      const lotNos = row.LotNos
        ? row.LotNos.split(",").map((lot) => lot.trim())
        : [];

      return {
        updateOne: {
          filter: { StyleNo: row.StyleNo, TxnNo: row.TxnNo },
          update: {
            $set: {
              StyleNo: row.StyleNo,
              TxnDate: row.TxnDate ? new Date(row.TxnDate) : null,
              TxnNo: row.TxnNo,
              Buyer: row.Buyer,
              Color: row.Color,
              SpreadTable: row.SpreadTable,
              TableNo: row.TableNo,
              BuyerStyle: row.BuyerStyle,
              ChColor: row.ChColor,
              ColorCode: row.ColorCode,
              FabricType: row.FabricType,
              Material: row.Material,
              RollQty: row.RollQty,
              SpreadYds: row.SpreadYds,
              Unit: row.Unit,
              GrossKgs: row.GrossKgs,
              NetKgs: row.NetKgs,
              MackerNo: row.MackerNo,
              MackerLength: row.MackerLength,
              SendFactory: row.SendFactory,
              SendTxnDate: row.SendTxnDate ? new Date(row.SendTxnDate) : null,
              SendTxnNo: row.SendTxnNo,
              SendTotalQty: row.SendTotalQty,
              PlanLayer: row.PlanLayer,
              ActualLayer: row.ActualLayer,
              TotalPcs: row.TotalPcs,
              LotNos: lotNos,
              TotalOrderQty: row.TotalOrderQty,
              TotalTTLRoll: row.TotalTTLRoll,
              TotalTTLQty: row.TotalTTLQty,
              TotalBiddingQty: row.TotalBiddingQty,
              TotalBiddingRollQty: row.TotalBiddingRollQty,
              TotalOrderQtyStyle: row.TotalOrderQtyStyle,
              MarkerRatio: markerRatio
            }
          },
          upsert: true
        }
      };
    });

    await CutPanelOrders.bulkWrite(bulkOps);
    console.log(
      `Successfully synced ${bulkOps.length} documents to cutpanelorders.`
    );
  } catch (err) {
    console.error("Error during cutpanelorders sync:", err);
    throw err;
  }
};

// Schedule the syncCutPanelOrders function to run every 5 minutes
// cron.schedule('*/5 * * * *', syncCutPanelOrders);
// console.log("Scheduled cutpanelorders sync every 5 minutes.");



// Manual trigger handlers
export const triggerQC1SunriseSync = async (req, res) => {
  try {
    await syncQC1SunriseData();
    res.json({ message: "QC1 Sunrise data synced successfully" });
  } catch (err) {
    console.error("Error in /api/sunrise/sync-qc1 endpoint:", err);
    res
      .status(500)
      .json({ message: "Failed to sync QC1 Sunrise data", error: err.message });
  }
};

export const triggerInlineOrdersSync = async (req, res) => {
   try {
    await syncInlineOrders();
    res
      .status(200)
      .json({ message: "Inline orders sync completed successfully." });
  } catch (err) {
    console.error("Error in /api/sync-inline-orders endpoint:", err);
    res.status(500).json({
      message: "Failed to sync inline orders",
      error: err.message
    });
  }
};

export const triggerCuttingOrdersSync = async (req, res) => {
  try {
    await syncCuttingOrders();
    res
      .status(200)
      .json({ message: "Cutting orders sync completed successfully." });
  } catch (err) {
    console.error("Error in /api/sync-cutting-orders endpoint:", err);
    res.status(500).json({
      message: "Failed to sync cutting orders",
      error: err.message
    });
  }
};