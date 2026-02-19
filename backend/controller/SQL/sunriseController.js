import cron from "node-cron";
import {
  poolYMDataStore,
  sqlConnectionStatus,
  ensurePoolConnected,
} from "./sqlConnectionManager.js";
import { QC1Sunrise, QCWorkers } from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   Fetching RS18 Data from YMDataStore
------------------------------ */

// api/sunrise/rs18
export const getSunriseRS18Data = async (req, res) => {
  if (!sqlConnectionStatus.YMDataStore) {
    return res.status(503).json({
      message:
        "Service Unavailable: The YMDataStore database is not connected.",
      error: "Database connection failed",
    });
  }
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
        AND CAST(dDate AS DATE) > '2022-12-31'
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
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching RS18 data:", err);
    res
      .status(500)
      .json({ message: "Failed to fetch RS18 data", error: err.message });
  }
};

/* ------------------------------
   Fetching Sunrise Output Data from YMDataStore
------------------------------ */

// api/sunrise/output
export const getSunriseOutputData = async (req, res) => {
  if (!sqlConnectionStatus.YMDataStore) {
    return res.status(503).json({
      message:
        "Service Unavailable: The YMDataStore database is not connected.",
      error: "Database connection failed",
    });
  }
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
      GROUP BY
        CAST(BillDate AS DATE),
        WorkLine,
        MONo,
        SizeName,
        ColorNo,
        ColorName;
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching Sunrise Output data:", err);
    res.status(500).json({
      message: "Failed to fetch Sunrise Output data",
      error: err.message,
    });
  }
};

/* ------------------------------
   QC1 Sunrise MongoDB Sync
------------------------------ */

// Function to fetch RS18 data (defects) - Last 7 days only
const fetchRS18Data = async () => {
  if (!sqlConnectionStatus.YMDataStore) {
    throw new Error("YMDataStore database is not connected.");
  }
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
      `Fetched ${result.recordset.length} RS18 records from the last 7 days`,
    );
    return result.recordset;
  } catch (err) {
    console.error("Error fetching RS18 data:", err);
    throw err;
  }
};

// Function to fetch Output data - Last 7 days only
const fetchOutputData = async () => {
  if (!sqlConnectionStatus.YMDataStore) {
    throw new Error("YMDataStore database is not connected.");
  }
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
      `Fetched ${result.recordset.length} Output records from the last 7 days`,
    );
    return result.recordset;
  } catch (err) {
    console.error("Error fetching Output data:", err);
    throw err;
  }
};

// Helper function to determine Buyer based on MONo
const determineBuyer = (MONo) => {
  if (!MONo) return "Other";
  if (MONo.includes("CO")) return "Costco";
  if (MONo.includes("AR")) return "Aritzia";
  if (MONo.includes("RT")) return "Reitmans";
  if (MONo.includes("AF")) return "ANF";
  if (MONo.includes("NT")) return "STORI";
  return "Other";
};

// Function to sync data to MongoDB
export const syncQC1SunriseData = async () => {
  try {
    console.log("Starting QC1 Sunrise data sync at", new Date().toISOString());

    const [rs18Data, outputData] = await Promise.all([
      fetchRS18Data(),
      fetchOutputData(),
    ]);

    if (outputData.length === 0) {
      console.log(
        "No output data fetched from SQL Server for the last 7 days. Sync aborted.",
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
        defectQty: defect.DefectsQty,
      });
    });
    console.log(`Defect Map contains ${defectMap.size} entries with defects`);

    // Prepare MongoDB documents starting from output data
    const documents = [];
    outputData.forEach((output) => {
      const key = `${output.InspectionDate}-${output.WorkLine}-${output.MONo}-${output.SizeName}-${output.ColorNo}-${output.ColorName}`;
      const defectArray = defectMap.get(key) || [];

      const totalDefectsQty = defectArray.reduce(
        (sum, defect) => sum + defect.defectQty,
        0,
      );
      const checkedQty = Math.max(
        output.TotalQtyT38 || 0,
        output.TotalQtyT39 || 0,
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
        DefectArray: defectArray,
        totalDefectsQty: totalDefectsQty,
      };
      documents.push(doc);
    });
    console.log(`Prepared ${documents.length} documents for MongoDB`);

    // Fetch existing documents from MongoDB for comparison (only for the last 7 days)
    const existingDocs = await QC1Sunrise.find({
      inspectionDate: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 7))
          .toISOString()
          .split("T")[0],
      },
    }).lean();

    const existingDocsMap = new Map();
    existingDocs.forEach((doc) => {
      const key = `${doc.inspectionDate}-${doc.lineNo}-${doc.MONo}-${doc.Size}-${doc.ColorNo}`;
      existingDocsMap.set(key, doc);
    });
    console.log(
      `Fetched ${existingDocsMap.size} existing documents from qc1_sunrise for comparison`,
    );

    // Filter documents to only include those that are new or have changed
    const documentsToUpdate = [];
    for (const doc of documents) {
      const key = `${doc.inspectionDate}-${doc.lineNo}-${doc.MONo}-${doc.Size}-${doc.ColorNo}`;
      const existingDoc = existingDocsMap.get(key);

      if (!existingDoc) {
        documentsToUpdate.push(doc);
      } else {
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
      `Filtered down to ${documentsToUpdate.length} documents that are new or modified`,
    );

    // Bulk upsert into MongoDB
    const bulkOps = documentsToUpdate.map((doc) => ({
      updateOne: {
        filter: {
          inspectionDate: doc.inspectionDate,
          lineNo: doc.lineNo,
          MONo: doc.MONo,
          Size: doc.Size,
          ColorNo: doc.ColorNo,
        },
        update: { $set: doc },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      const result = await QC1Sunrise.bulkWrite(bulkOps);
      console.log(
        `Bulk write result: Matched: ${result.matchedCount}, Modified: ${result.modifiedCount}, Upserted: ${result.upsertedCount}`,
      );
      console.log(
        `Successfully synced ${bulkOps.length} documents to qc1_sunrise.`,
      );
    } else {
      console.log("No new or modified documents to upsert");
      console.log("Successfully synced 0 documents to qc1_sunrise.");
    }

    const collectionCount = await QC1Sunrise.countDocuments();
    console.log(
      `Total documents in qc1_sunrise collection: ${collectionCount}`,
    );

    console.log(
      `Successfully completed QC1 Sunrise sync with ${documentsToUpdate.length} new or modified records`,
    );
  } catch (err) {
    console.error("Error syncing QC1 Sunrise data:", err);
    throw err;
  }
};

// Endpoint to manually trigger QC1 Sunrise sync
// api/sunrise/sync-qc1
export const getSunriseQC1Sync = async (req, res) => {
  try {
    await syncQC1SunriseData();
    res.json({ message: "QC1 Sunrise data synced successfully" });
  } catch (err) {
    console.error("Error in /api/sunrise/sync-qc1 endpoint:", err);
    res.status(500).json({
      message: "Failed to sync QC1 Sunrise data",
      error: err.message,
    });
  }
};

// Schedule daily sync at midnight
cron.schedule("0 0 * * *", async () => {
  if (!sqlConnectionStatus.YMDataStore) {
    console.warn("⚠️ Skipping QC1 Sunrise cron: YMDataStore not connected");
    return;
  }
  console.log("Running daily QC1 Sunrise data sync...");
  try {
    await syncQC1SunriseData();
  } catch (err) {
    console.error("Error in daily QC1 Sunrise sync:", err);
  }
});

/* ------------------------------
   QC1 Worker Data Sync
------------------------------ */

const formatDateSQL = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
};

export async function syncQC1WorkerData(
  startDate = "2025-07-01",
  endDate = new Date(),
) {
  console.log("🔄 Starting QC1 Worker Data sync...");

  if (!sqlConnectionStatus.YMDataStore) {
    console.warn("⚠️ YMDataStore is not connected. Attempting to reconnect...");
  }

  await ensurePoolConnected(poolYMDataStore, "YMDataStore");

  if (!poolYMDataStore.connected) {
    throw new Error(
      "YMDataStore pool is not connected after reconnection attempt",
    );
  }
  const request = poolYMDataStore.request();

  // Paste the outputQuery from original syncQC1WorkerData (contains ${formatDateSQL(startDate)} and ${formatDateSQL(endDate)} interpolations)
  const outputQuery = `SQL Query`;
  const outputResult = await request.query(outputQuery);

  // Paste the defectQuery from original syncQC1WorkerData (contains ${formatDateSQL(startDate)} and ${formatDateSQL(endDate)} interpolations)
  const defectQuery = `SQL Query`;
  const defectResult = await request.query(defectQuery);

  // Standardize field names for easier mapping
  const outputRows = outputResult.recordset.map((row) => ({
    ...row,
    Inspection_date: row.BillDate,
    QC_ID: row.EmpID,
  }));

  const defectRows = defectResult.recordset.map((row) => ({
    ...row,
    Inspection_date: row.dDate,
    QC_ID: row.EmpID_QC,
  }));

  // Use a unified key for both output and defect data
  function makeKey(row) {
    return [row.Inspection_date, row.QC_ID].join("|");
  }

  // Build outputMap
  const outputMap = new Map();
  for (const row of outputRows) {
    const key = makeKey(row);
    if (!outputMap.has(key)) outputMap.set(key, []);
    outputMap.get(key).push(row);
  }

  // Build defectMap
  const defectMap = new Map();
  for (const row of defectRows) {
    const key = makeKey(row);
    if (!defectMap.has(key)) defectMap.set(key, []);
    defectMap.get(key).push(row);
  }

  // Merge and Build Documents
  const docs = new Map();
  const allKeys = new Set([...outputMap.keys(), ...defectMap.keys()]);

  for (const key of allKeys) {
    const keyOutputRows = outputMap.get(key) || [];
    const keyDefectRows = defectMap.get(key) || [];
    const [Inspection_date_str, QC_ID_raw] = key.split("|");

    // QC_ID renaming
    const QC_ID = QC_ID_raw === "6335" ? "YM6335" : QC_ID_raw;

    // Date as Date object, time 00:00:00
    const Inspection_date = new Date(Inspection_date_str + "T00:00:00Z");

    // Output grouping (group by line/mo/color/size)
    const outputGroup = {};
    for (const r of keyOutputRows) {
      const oKey = [r.WorkLine, r.MONo, r.ColorName, r.SizeName].join("|");
      if (!outputGroup[oKey]) outputGroup[oKey] = [];
      outputGroup[oKey].push(r);
    }
    const Output_data = Object.values(outputGroup).map((rows) => ({
      Line_no: rows[0].WorkLine,
      MONo: rows[0].MONo,
      Color: rows[0].ColorName,
      Size: rows[0].SizeName,
      Qty: rows.reduce((sum, r) => sum + Number(r.Qty), 0),
    }));

    // Group Output_data by (Line_no, MONo)
    const outputSummaryMap = new Map();
    for (const o of Output_data) {
      const sKey = `${o.Line_no}|${o.MONo}`;
      if (!outputSummaryMap.has(sKey)) {
        outputSummaryMap.set(sKey, {
          Line: o.Line_no,
          MONo: o.MONo,
          Qty: 0,
        });
      }
      outputSummaryMap.get(sKey).Qty += o.Qty;
    }
    const Output_data_summary = Array.from(outputSummaryMap.values());

    const TotalOutput = Output_data_summary.reduce((sum, o) => sum + o.Qty, 0);

    // Defect grouping (group by line/mo/color/size)
    const defectGroup = {};
    for (const d of keyDefectRows) {
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
            Defect_code: Number(d.ReworkCode),
            Defect_name: d.ReworkName,
            Qty: 0,
          });
        }
        defectDetailsMap.get(ddKey).Qty += Number(d.Defect_Qty);
        TotalDefect += Number(d.Defect_Qty);
      }
      const [Line_no, MONo, Color, Size] = dKey.split("|");
      return {
        Line_no,
        MONo,
        Color,
        Size,
        Defect_qty: TotalDefect,
        DefectDetails: Array.from(defectDetailsMap.values()),
      };
    });

    // Group Defect_data by (Line_no, MONo)
    const defectSummaryMap = new Map();
    for (const d of Defect_data) {
      const sKey = `${d.Line_no}|${d.MONo}`;
      if (!defectSummaryMap.has(sKey)) {
        defectSummaryMap.set(sKey, {
          Line_no: d.Line_no,
          MONo: d.MONo,
          Defect_Qty: 0,
          Defect_Details: [],
        });
      }
      defectSummaryMap.get(sKey).Defect_Qty += d.Defect_qty;

      const detailsMap = new Map(
        defectSummaryMap
          .get(sKey)
          .Defect_Details.map((dd) => [
            `${dd.Defect_code}|${dd.Defect_name}`,
            { ...dd },
          ]),
      );
      for (const dd of d.DefectDetails) {
        const ddKey = `${dd.Defect_code}|${dd.Defect_name}`;
        if (!detailsMap.has(ddKey)) {
          detailsMap.set(ddKey, { ...dd });
        } else {
          detailsMap.get(ddKey).Qty += dd.Qty;
        }
      }
      defectSummaryMap.get(sKey).Defect_Details = Array.from(
        detailsMap.values(),
      );
    }
    const Defect_data_summary = Array.from(defectSummaryMap.values());

    const TotalDefect = Defect_data_summary.reduce(
      (sum, d) => sum + d.Defect_Qty,
      0,
    );

    docs.set(key, {
      Inspection_date,
      QC_ID,
      report_type: "Inline Sewing",
      Seq_No: [...new Set(keyOutputRows.map((r) => Number(r.SeqNo)))],
      TotalOutput,
      TotalDefect,
      Output_data,
      Output_data_summary,
      Defect_data,
      Defect_data_summary,
    });
  }

  // Save to MongoDB
  const finalDocs = Array.from(docs.values());
  const bulkOps = finalDocs.map((doc) => ({
    updateOne: {
      filter: {
        Inspection_date: doc.Inspection_date,
        QC_ID: doc.QC_ID,
      },
      update: { $set: doc },
      upsert: true,
    },
  }));
  if (bulkOps.length) {
    const result = await QCWorkers.bulkWrite(bulkOps);
    console.log(
      `QC1_Worker sync: Matched ${result.matchedCount}, Upserted ${result.upsertedCount}, Modified ${result.modifiedCount}`,
    );
  }
}

// Schedule to run every day at 11:00 PM
cron.schedule("0 23 * * *", async () => {
  if (!sqlConnectionStatus.YMDataStore) {
    console.warn("⚠️ Skipping QC1 Worker cron: YMDataStore not connected");
    return;
  }
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 2);

  try {
    await syncQC1WorkerData(startDate, endDate);
    console.log("✅ QC1 Worker Data Sync completed");
  } catch (err) {
    console.error("❌ QC1 Worker Data Sync failed:", err);
  }
});
