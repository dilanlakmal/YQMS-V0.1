import sql from "mssql"; // Import mssql for SQL Server connection
import cron from "node-cron"; // Import node-cron for scheduling
import {
  InlineOrders,
  CutPanelOrders,
  QCWorkers,
  DtOrder,
  QC1Sunrise,
  // CuttingInlineOrders
} from "../MongoDB/dbConnectionController.js";


/* ------------------------------
   YM DataSore SQL
------------------------------ */

// SQL Server Configuration for YMDataStore
const sqlConfig = {
  user: "ymdata",
  password: "Kzw15947",
  server: "192.167.1.13",
  port: 1433,
  database: "YMDataStore",
  options: {
    encrypt: false, // Use true if SSL is required
    trustServerCertificate: true // For self-signed certificates
  },
  requestTimeout: 3000000, // Set timeout to 5 minutes (300,000 ms)
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

/* ------------------------------
   YMCE_SYSTEM SQL
------------------------------ */

// SQL Server Configuration for YMCE_SYSTEM
const sqlConfigYMCE = {
  user: "visitor",
  password: "visitor",
  server: "192.167.1.240", //"ymws-150",
  //port: 1433,
  database: "YMCE_SYSTEM",
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  requestTimeout: 300000,
  connectionTimeout: 300000, // Increase connection timeout to 300 seconds
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

/* ------------------------------
   FC_SYSTEM & DTrade_CONN SQL Configuration (Consolidated)
------------------------------ */

const sqlConfigFCSystem = {
  user: "user01",
  password: "Ur@12323",
  server: "192.167.1.14", //"YM-WHSYS",
  // Database will be specified in the query
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  // Use the longer of the two timeouts to be safe
  requestTimeout: 21000000,
  connectionTimeout: 21000000,
  pool: { max: 10, min: 2, idleTimeoutMillis: 60000 }
};

// Create connection pools
const poolYMDataStore = new sql.ConnectionPool(sqlConfig);
const poolYMCE = new sql.ConnectionPool(sqlConfigYMCE);
const poolFCSystem = new sql.ConnectionPool(sqlConfigFCSystem);

// MODIFICATION: Add a status tracker for SQL connections
const sqlConnectionStatus = {
  YMDataStore: false,
  YMCE_SYSTEM: false,
  FCSystem: false,
};

// Function to connect to a pool, now it updates the status tracker
async function connectPool(pool, poolName) {
  try {
    // Close existing connection if any
    if (pool.connected || pool.connecting) {
      try {
        await pool.close();
      } catch (closeErr) {
        console.warn(`Warning closing existing ${poolName} connection:`, closeErr.message);
      }
    }

    await pool.connect();
    console.log(
      `✅ Successfully connected to ${poolName} pool at ${pool.config.server}`
    );
    sqlConnectionStatus[poolName] = true; // Set status to true on success

    // Listen for errors on the pool to detect disconnections
    pool.on("error", (err) => {
      console.error(`SQL Pool Error for ${poolName}:`, err);
      sqlConnectionStatus[poolName] = false; // Set status to false on error
    });
  } catch (err) {
    console.error(`❌ FAILED to connect to ${poolName} pool:`, err.message);
    sqlConnectionStatus[poolName] = false; // Ensure status is false on failure
    // We throw the error so Promise.allSettled can catch it
    throw new Error(`Failed to connect to ${poolName}`);
  }
}

// MODIFICATION: This function is now more critical for on-demand reconnections.
async function ensurePoolConnected(pool, poolName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check if pool is connected and status is true
      if (pool.connected && sqlConnectionStatus[poolName]) {
        return; // Connection is good
      }

      console.log(`Attempt ${attempt}/${maxRetries}: Reconnecting to ${poolName}...`);
      
      // Close existing connection if in bad state
      if (pool.connected || pool.connecting) {
        try {
          await pool.close();
        } catch (closeErr) {
          console.warn(`Warning during close for ${poolName}:`, closeErr.message);
        }
      }

      // Wait a bit before retry (except first attempt)
      if (attempt > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }

      await connectPool(pool, poolName);
      return; // Success

    } catch (reconnectErr) {
      console.error(`Attempt ${attempt}/${maxRetries} failed for ${poolName}:`, reconnectErr.message);
      
      if (attempt === maxRetries) {
        sqlConnectionStatus[poolName] = false;
        throw new Error(`Failed to reconnect to ${poolName} after ${maxRetries} attempts: ${reconnectErr.message}`);
      }
    }
  }
}

// Drop the conflicting St_No_1 index if it exists
async function dropConflictingIndex() {
  try {
    const indexes = await InlineOrders.collection.getIndexes();
    if (indexes["St_No_1"]) {
      await InlineOrders.collection.dropIndex("St_No_1");
      console.log("Dropped conflicting St_No_1 index.");
    } else {
      console.log("St_No_1 index not found, no need to drop.");
    }
  } catch (err) {
    console.error("Error dropping St_No_1 index:", err);
  }
}

/* ------------------------------
   Initialize Pools and Run Initial Syncs
------------------------------ */

// MODIFICATION: Rewritten initializePools and server startup logic
async function initializeServer() {
  console.log("--- Initializing Server ---");

  // 1. Handle MongoDB Index
  await dropConflictingIndex();

  // 2. Attempt to connect to all SQL pools without crashing
  console.log("Initializing SQL connection pools...");
  const connectionPromises = [
    connectPool(poolYMDataStore, "YMDataStore"),
    connectPool(poolYMCE, "YMCE_SYSTEM"),
    connectPool(poolFCSystem, "FCSystem"),
  ];

  // Promise.allSettled will not short-circuit. It waits for all promises.
  const results = await Promise.allSettled(connectionPromises);

  results.forEach((result) => {
    if (result.status === "rejected") {
      // The error is already logged in connectPool, but we can add a summary here.
      console.warn(
        `Initialization Warning: ${result.reason.message}. Dependent services will be unavailable.`
      );
    }
  });

  console.log("Current SQL Connection Status:", sqlConnectionStatus);
  console.log(
    "SQL pool initialization complete. Server will continue regardless of failures."
  );

  // 3. Run initial data syncs. These functions will now check the connection status internally.
  console.log("Running initial data synchronizations...");
  await syncInlineOrders();
  await syncCutPanelOrders();
  await syncQC1SunriseData();
  await syncDTOrdersData();
  await syncQC1WorkerData();
  // await syncCuttingInlineOrders(); // Fetch all historical data on initial startup

  console.log("--- Server Initialization Complete ---");
}

// Start the server initialization
initializeServer().catch((err) => {
  // This catch is for any unexpected errors during the setup process itself.
  console.error("A critical error occurred during server initialization:", err);
  // still want to exit here if something truly fundamental fails.
  // process.exit(1);
});

/* ------------------------------
  Fetching RS18 Data from YMDataStore
------------------------------ */

// New Endpoint for RS18 Data (YMDataStore)
//api/sunrise/rs18
export const getSunriseRS18Data = async (req, res) => {
  if (!sqlConnectionStatus.YMDataStore) {
    return res.status(503).json({
      message:
        "Service Unavailable: The YMDataStore database is not connected.",
      error: "Database connection failed"
    });
  }
  try {
    await ensurePoolConnected(poolYMDataStore, "YMDataStore");
    const request = poolYMDataStore.request();
    //pool = await connectToSqlServerYMDataStore();
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

// New Endpoint for Sunrise Output Data (YMDataStore)
export const getSunriseOutputData =  async (req, res) => {
  if (!sqlConnectionStatus.YMDataStore) {
    return res.status(503).json({
      message:
        "Service Unavailable: The YMDataStore database is not connected.",
      error: "Database connection failed"
    });
  }
  try {
    await ensurePoolConnected(poolYMDataStore, "YMDataStore");
    const request = poolYMDataStore.request();
    //pool = await connectToSqlServerYMDataStore();
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
      error: err.message
    });
  }
};

/* ------------------------------
   QC1 Sunrise MongoDB
------------------------------ */

// Function to fetch RS18 data (defects) - Last 7 days only
const fetchRS18Data = async (res) => {
  if (!sqlConnectionStatus.YMDataStore) {
    return res.status(503).json({
      message:
        "Service Unavailable: The YMDataStore database is not connected.",
      error: "Database connection failed"
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
const fetchOutputData = async (res) => {
  if (!sqlConnectionStatus.YMDataStore) {
    return res.status(503).json({
      message:
        "Service Unavailable: The YMDataStore database is not connected.",
      error: "Database connection failed"
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

// Function to sync data to MongoDB - Only process last 7 days and update if modified
const syncQC1SunriseData = async () => {
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

// Endpoint to manually trigger QC1 Sunrise sync
///api/sunrise/sync-qc1
export const getSunriseQC1Sync = async (req, res) => {
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

// Schedule daily sync at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily QC1 Sunrise data sync...");
  try {
    await syncQC1SunriseData();
  } catch (err) {
    console.error("Error in daily QC1 Sunrise sync:", err);
  }
});

/* ------------------------------
   Fetch inline data from SQL to ym_prod
------------------------------ */

async function syncInlineOrders() {
  //MODIFICATION: Add connection status check
  if (!sqlConnectionStatus.YMCE_SYSTEM) {
    console.warn(
      "Skipping syncInlineOrders: YMCE_SYSTEM database is not connected."
    );
    return;
  }
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
}

// New API Endpoint to manually trigger the sync
//api/sync-inline-orders
export const getInlineOrdersSync = async (req, res) => {
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

// Schedule the sync to run every day at 11 AM
cron.schedule("0 11 * * *", async () => {
  console.log("Running scheduled inline_orders sync at 11 AM...");
  await syncInlineOrders();
});

// New Endpoint for YMCE_SYSTEM Data
//api/ymce-system-data
export const getYMCESystemData = async (req, res) => {
  // MODIFICATION: Add connection status check
  if (!sqlConnectionStatus.YMCE_SYSTEM) {
    return res.status(503).json({
      message:
        "Service Unavailable: The YMCE_SYSTEM database is not connected.",
      error: "Database connection failed"
    });
  }

  //let pool;
  try {
    await ensurePoolConnected(poolYMCE, "YMCE_SYSTEM");
    const request = poolYMCE.request();
    const query = `
      SELECT
        St_No,
        By_Style,
        Tg_No,
        Tg_Code,
        Ma_Code,
        ch_name,
        kh_name,
        Dept_Type,
        SUM(Tg_Pcs) AS PiecesQty,
        SUM(Tg_Price) AS OperationPrice,
        SUM(GST_SAM) AS GST
      FROM
        dbo.ViewTg vt
      WHERE
        Dept_Type = 'Sewing'
      GROUP BY
        St_No,
        By_Style,
        Tg_No,
        Tg_Code,
        Ma_Code,
        ch_name,
        kh_name,
        Dept_Type;
    `;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error("Error fetching YMCE_SYSTEM data:", err);
    res.status(500).json({
      message: "Failed to fetch YMCE_SYSTEM data",
      error: err.message
    });
  }
};

/* --------------------------------------------------------
   Cut Panel Orders Sync with GATEKEEPER to prevent deadlocks
-------------------------------------------------------- */

// *** 1. THE GATEKEEPER VARIABLE ***
let isCutPanelSyncRunning = false;

async function syncCutPanelOrders() {
  // *** 2. THE GATEKEEPER CHECK ***
  if (isCutPanelSyncRunning) {
    console.log(
      "[CutPanelOrders] Sync is already in progress. Skipping this run."
    );
    return;
  }

  try {
    isCutPanelSyncRunning = true; // Set the lock
    console.log("[CutPanelOrders] Starting sync at", new Date().toISOString());
    
    if (!sqlConnectionStatus.FCSystem) {
      console.warn(
        "[CutPanelOrders] Skipping sync: FCSystem database is not connected."
      );
      return;
    }

    let records = [];
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await ensurePoolConnected(poolFCSystem, "FCSystem");
        const request = poolFCSystem.request();
        const query = `
      DECLARE @StartDate DATE = CAST(DATEADD(DAY, -3, GETDATE()) AS DATE);
      -- The rest of your optimized SQL query...
      WITH
      LotData AS (
          SELECT v.Style, v.TableNo, STUFF((SELECT DISTINCT ', ' + v_inner.Lot FROM [FC_SYSTEM].[dbo].[ViewSpreading_ForQC] AS v_inner WHERE v_inner.Style = v.Style AND v_inner.TableNo = v.TableNo AND v_inner.Lot IS NOT NULL AND v_inner.Lot <> '' FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS LotNos
          FROM [FC_SYSTEM].[dbo].[ViewSpreading_ForQC] AS v INNER JOIN [FC_SYSTEM].[dbo].[ViewSpreading_Inv] AS inv_filter ON v.TxnNo = inv_filter.TxnNo
          WHERE v.Lot IS NOT NULL AND v.Lot <> '' AND inv_filter.Create_Date >= @StartDate
          GROUP BY v.Style, v.TableNo
      ),
      OrderData AS (
          SELECT Style, EngColor, Size1, Size2, Size3, Size4, Size5, Size6, Size7, Size8, Size9, Size10,
              OrderQty1, OrderQty2, OrderQty3, OrderQty4, OrderQty5, OrderQty6, OrderQty7, OrderQty8, OrderQty9, OrderQty10,
              TotalOrderQty, SUM(TotalOrderQty) OVER (PARTITION BY Style) AS TotalOrderQtyStyle
          FROM (
              SELECT o.Style, o.EngColor, MAX(o.Size1) AS Size1, MAX(o.Size2) AS Size2, MAX(o.Size3) AS Size3, MAX(o.Size4) AS Size4, MAX(o.Size5) AS Size5, MAX(o.Size6) AS Size6, MAX(o.Size7) AS Size7, MAX(o.Size8) AS Size8, MAX(o.Size9) AS Size9, MAX(o.Size10) AS Size10,
                  SUM(ISNULL(o.Qty1, 0)) AS OrderQty1, SUM(ISNULL(o.Qty2, 0)) AS OrderQty2, SUM(ISNULL(o.Qty3, 0)) AS OrderQty3, SUM(ISNULL(o.Qty4, 0)) AS OrderQty4, SUM(ISNULL(o.Qty5, 0)) AS OrderQty5, SUM(ISNULL(o.Qty6, 0)) AS OrderQty6, SUM(ISNULL(o.Qty7, 0)) AS OrderQty7, SUM(ISNULL(o.Qty8, 0)) AS OrderQty8, SUM(ISNULL(o.Qty9, 0)) AS OrderQty9, SUM(ISNULL(o.Qty10, 0)) AS OrderQty10,
                  SUM(ISNULL(o.Total, 0)) AS TotalOrderQty
              FROM [FC_SYSTEM].[dbo].[ViewOrderQty] AS o
              WHERE EXISTS (SELECT 1 FROM [FC_SYSTEM].[dbo].[ViewSpreading_Inv] vi WHERE vi.Style = o.Style AND vi.EngColor = o.EngColor AND vi.Create_Date >= @StartDate)
              GROUP BY o.Style, o.EngColor
          ) AS OrderColorAggregates
      )
      SELECT
          v.Style AS StyleNo, v.Create_Date AS TxnDate, v.TxnNo, CASE WHEN v.Buyer = 'ABC' THEN 'ANF' ELSE v.Buyer END AS Buyer, v.BuyerStyle,
          v.EngColor AS Color, v.ChnColor, v.ColorNo AS ColorCode, v.Fabric_Type AS FabricType, v.Material,
          CASE WHEN PATINDEX('%[_ ]%', v.PreparedBy) > 0 THEN LTRIM(SUBSTRING(v.PreparedBy, PATINDEX('%[_ ]%', v.PreparedBy) + 1, LEN(v.PreparedBy))) ELSE v.PreparedBy END AS SpreadTable,
          v.TableNo, v.RollQty, ROUND(v.SpreadYds, 3) AS SpreadYds, v.Unit, ROUND(v.GrossKgs, 3) AS GrossKgs, ROUND(v.NetKgs, 3) AS NetKgs,
          v.PlanLayer, v.ActualLayer, CAST(ISNULL(v.PlanLayer, 0) * (ISNULL(v.Ratio1, 0) + ISNULL(v.Ratio2, 0) + ISNULL(v.Ratio3, 0) + ISNULL(v.Ratio4, 0) + ISNULL(v.Ratio5, 0) + ISNULL(v.Ratio6, 0) + ISNULL(v.Ratio7, 0) + ISNULL(v.Ratio8, 0) + ISNULL(v.Ratio9, 0) + ISNULL(v.Ratio10, 0)) AS INT) AS TotalPcs,
          v.Pattern AS MackerNo, ROUND(v.MarkerLength, 3) AS MackerLength, ld.LotNos, od.OrderQty1, od.OrderQty2, od.OrderQty3, od.OrderQty4, od.OrderQty5,
          od.OrderQty6, od.OrderQty7, od.OrderQty8, od.OrderQty9, od.OrderQty10, od.TotalOrderQty, od.TotalOrderQtyStyle, v.Ratio1 AS CuttingRatio1,
          v.Ratio2 AS CuttingRatio2, v.Ratio3 AS CuttingRatio3, v.Ratio4 AS CuttingRatio4, v.Ratio5 AS CuttingRatio5, v.Ratio6 AS CuttingRatio6,
          v.Ratio7 AS CuttingRatio7, v.Ratio8 AS CuttingRatio8, v.Ratio9 AS CuttingRatio9, v.Ratio10 AS CuttingRatio10, v.Size1, v.Size2, v.Size3,
          v.Size4, v.Size5, v.Size6, v.Size7, v.Size8, v.Size9, v.Size10,
          NULL AS TotalTTLRoll, NULL AS TotalTTLQty, NULL AS TotalBiddingQty, NULL AS TotalBiddingRollQty,
          NULL AS SendFactory, NULL AS SendTxnDate, NULL AS SendTxnNo, NULL AS SendTotalQty
      FROM [FC_SYSTEM].[dbo].[ViewSpreading_Inv] AS v
      LEFT JOIN LotData AS ld ON v.Style = ld.Style AND v.TableNo = ld.TableNo
      LEFT JOIN OrderData AS od ON v.Style = od.Style AND v.EngColor = od.EngColor
      WHERE v.TableNo IS NOT NULL AND v.TableNo <> '' AND v.Create_Date >= @StartDate  AND v.Fabric_Type = 'A'
      ORDER BY v.Create_Date DESC;
    `;

        const result = await request.query(query);
        records = result.recordset;
        break; // Success, exit retry loop
      } catch (err) {
        if (err.number === 1205 && attempt < maxRetries) {
          const delay = Math.random() * 1000 + 1500; // Random delay 1.5-2.5 seconds
          console.warn(`[CutPanelOrders] Deadlock detected. Retrying in ${delay.toFixed(0)}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw err; // Re-throw if not a deadlock or max retries reached
        }
      }
    }

    if (records.length > 0) {
      console.log(`[CutPanelOrders] Fetched ${records.length} records from SQL Server.`);
      const bulkOps = records.map((row) => ({
        updateOne: {
          filter: { TxnNo: row.TxnNo },
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
              LotNos: row.LotNos
                ? row.LotNos.split(",").map((lot) => lot.trim())
                : [],
              TotalOrderQty: row.TotalOrderQty,
              TotalTTLRoll: row.TotalTTLRoll,
              TotalTTLQty: row.TotalTTLQty,
              TotalBiddingQty: row.TotalBiddingQty,
              TotalBiddingRollQty: row.TotalBiddingRollQty,
              TotalOrderQtyStyle: row.TotalOrderQtyStyle,
              MarkerRatio: Array.from({ length: 10 }, (_, k) => ({
                no: k + 1,
                size: row[`Size${k + 1}`],
                cuttingRatio: row[`CuttingRatio${k + 1}`],
                orderQty: row[`OrderQty${k + 1}`]
              }))
            }
          },
          upsert: true
        }
      }));
      await CutPanelOrders.bulkWrite(bulkOps);
      console.log(
        `[CutPanelOrders] Successfully synced ${bulkOps.length} documents.`
      );
    } else {
      console.log(
        "[CutPanelOrders] No new documents to sync in the last 3 days."
      );
    }
  } catch (err) {
    console.error("Error during cutpanelorders sync:", err);
  } finally {
    isCutPanelSyncRunning = false; // Release the lock
  }
}

// Schedule the syncCutPanelOrders function to run every 5 minutes
cron.schedule("*/30 * * * *", syncCutPanelOrders);
console.log("Scheduled cutpanelorders sync with deadlock protection.");

/* ------------------------------
   Manual Sync Endpoint & Server Start
------------------------------ */
//api/sync-cutpanel-orders
export const cutpanelOrdersSync = async (req, res) => {
  // This manual trigger will also respect the gatekeeper
  syncCutPanelOrders();
  res.status(202).json({
    message:
      "Cut panel orders sync initiated successfully. Check logs for progress."
  });
};

/* 

/*---------------------------------------------------------------------------------------

* ------------------------------
    Manual Sync Endpoint & Server Start
 ------------------------------ */

 const formatDateSQL = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,"0")}-${d.getDate().toString().padStart(2,"0")}`;
};

async function syncQC1WorkerData(startDate = "2025-07-01", endDate = new Date()) {
     console.log("🔄 Starting QC1 Worker Data sync...");
    
    // 1. Check connection status first
    if (!sqlConnectionStatus.YMDataStore) {
      console.warn("⚠️ YMDataStore is not connected. Attempting to reconnect...");
    }
    
    // 2. Ensure connection is available
    await ensurePoolConnected(poolYMDataStore, "YMDataStore");
    
    // 3. Verify connection is actually working
    if (!poolYMDataStore.connected) {
      throw new Error("YMDataStore pool is not connected after reconnection attempt");
    }
  const request = poolYMDataStore.request();

  // Output Data
  const outputQuery = `
    SELECT
      CONVERT(varchar, BillDate, 23) AS BillDate,
      EmpID,
      WorkLine,
      MONo,
      SeqNo,
      ColorNo,
      ColorName,
      SizeName,
      SUM(Qty) AS Qty
    FROM YMDataStore.SunRise_G.tWork2025
    WHERE TRY_CAST(SeqNo AS INT) IN (38,39)
      AND BillDate >= '${formatDateSQL(startDate)}'
      AND BillDate <= '${formatDateSQL(endDate)}'
     AND TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
    GROUP BY BillDate, EmpID, WorkLine, MONo, SeqNo, ColorNo, ColorName, SizeName
  `;
  const outputResult = await request.query(outputQuery);

  // Defect Data
  const defectQuery = `
    SELECT
      CONVERT(varchar, dDate, 23) AS dDate,
      EmpID_QC,
      WorkLine,
      MONo,
      ColorNo,
      ColorName,
      SizeName,
      ReworkCode,
      ReworkName,
      SUM(QtyRework) AS Defect_Qty
    FROM YMDataStore.SUNRISE.RS18
    WHERE dDate >= '${formatDateSQL(startDate)}'
      AND dDate <= '${formatDateSQL(endDate)}'
      AND TRY_CAST(WorkLine AS INT) BETWEEN 1 AND 30
  AND TRY_CAST(ReworkCode AS INT) BETWEEN 1 AND 44
    GROUP BY dDate, EmpID_QC, WorkLine, MONo,  ColorNo, ColorName, SizeName, ReworkCode, ReworkName
  `;
  const defectResult = await request.query(defectQuery);

  // Standardize field names for easier mapping
  const outputRows = outputResult.recordset.map(row => ({
    ...row,
    Inspection_date: row.BillDate,
    QC_ID: row.EmpID
  }));

  const defectRows = defectResult.recordset.map(row => ({
    ...row,
    Inspection_date: row.dDate,
    QC_ID: row.EmpID_QC
  }));

  // Use a unified key for both output and defect data
  function makeKey(row) {
    return [
      row.Inspection_date,
      row.QC_ID
    ].join("|");
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
    const outputRows = outputMap.get(key) || [];
    const defectRows = defectMap.get(key) || [];
    const [Inspection_date_str, QC_ID_raw] = key.split("|");

    // 1. QC_ID renaming
    const QC_ID = QC_ID_raw === "6335" ? "YM6335" : QC_ID_raw;

    // 2. Date as Date object, time 00:00:00
    const Inspection_date = new Date(Inspection_date_str + "T00:00:00Z");

    // Output grouping (group by line/mo/color/size)
    const outputGroup = {};
    for (const r of outputRows) {
      const oKey = [r.WorkLine, r.MONo, r.ColorName, r.SizeName].join("|");
      if (!outputGroup[oKey]) outputGroup[oKey] = [];
      outputGroup[oKey].push(r);
    }
    const Output_data = Object.values(outputGroup).map(rows => ({
      Line_no: rows[0].WorkLine,
      MONo: rows[0].MONo,
      Color: rows[0].ColorName,
      Size: rows[0].SizeName,
      Qty: rows.reduce((sum, r) => sum + Number(r.Qty), 0)
    }));
   // Group Output_data by (Line_no, MONo)
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

    // Defect grouping (group by line/mo/color/size)
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
            Defect_code: Number(d.ReworkCode),
            Defect_name: d.ReworkName,
            Qty: 0
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
        DefectDetails: Array.from(defectDetailsMap.values())
      };
    });
    // Group Defect_data by (Line_no, MONo)
      const defectSummaryMap = new Map();
      for (const d of Defect_data) {
        const key = `${d.Line_no}|${d.MONo}`;
        if (!defectSummaryMap.has(key)) {
          defectSummaryMap.set(key, { Line_no: d.Line_no, MONo: d.MONo, Defect_Qty: 0, Defect_Details: [] });
        }
        // Sum defect qty
        defectSummaryMap.get(key).Defect_Qty += d.Defect_qty;

        // Merge DefectDetails by code/name
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

    // 3. Add report_type
    docs.set(key, {
      Inspection_date,
      QC_ID,
      report_type: "Inline Sewing",
      Seq_No: [
        ...new Set(
          outputRows.map(r => Number(r.SeqNo))
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

  // Save to MongoDB
  const finalDocs = Array.from(docs.values());
  const bulkOps = finalDocs.map(doc => ({
    updateOne: {
      filter: {
        Inspection_date: doc.Inspection_date,
        QC_ID: doc.QC_ID
      },
      update: { $set: doc },
      upsert: true
    }
  }));
  if (bulkOps.length) {
    const result = await QCWorkers.bulkWrite(bulkOps);
    console.log(`QC1_Worker sync: Matched ${result.matchedCount}, Upserted ${result.upsertedCount}, Modified ${result.modifiedCount}`);
  }
}
/*--------------------------------------------------------------------------------*/

// 1. On server start, fetch all data from 2025-07-10 to today
// syncQC1WorkerData("2025-07-01", new Date())
//   .then(() => {
//     console.log("✅ Initial QC1 Worker Data Sync completed (all data).");
//   })
//   .catch((err) => {
//     console.error("❌ Initial QC1 Worker Data Sync failed:", err);
//   });

// Schedule to run every day at 11:00 PM
cron.schedule("0 23 * * *", async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 2); // last 3 days: today, yesterday, day before

  await syncQC1WorkerData(startDate, endDate)
    .then(() => {
      console.log("✅ QC1 Worker Data Sync completed (last 3 days, scheduled 11pm).");
    })
    .catch((err) => {
      console.error("❌ QC1 Worker Data Sync failed (last 3 days, scheduled 11pm):", err);
    });
});


// DT Orders Data Migration Function
async function syncDTOrdersData() {
  try {
    console.log("🔄 Starting DT Orders data migration...");
    
    // Ensure FCSystem connection (which covers both DTrade and FC_SYSTEM)
     try {
      await Promise.all([
        ensurePoolConnected(poolFCSystem, "FCSystem")
      ]);
    } catch (connErr) {
      console.error("❌ Failed to establish required connections:", connErr.message);
      throw connErr;
    }
    const request = poolFCSystem.request();

    // 1. Fetch Order Headers WITH actual size names AND Order Colors and Shipping in one query
    // console.log("📊 Fetching order headers with size names and shipping data...");
    const orderHeaderQuery = `
      SELECT 
        h.[SC_Heading], h.[Factory], h.[SalesTeamName], h.[Cust_Code], h.[ShortName],
        h.[EngName], h.[Order_No], h.[Ccy], h.[Style], h.[CustStyle], h.[NoOfCol],
        h.[Size_Seq10], h.[Size_Seq20], h.[Size_Seq30], h.[Size_Seq40], h.[Size_Seq50],
        h.[Size_Seq60], h.[Size_Seq70], h.[Size_Seq80], h.[Size_Seq90], h.[Size_Seq100],
        h.[Size_Seq110], h.[Size_Seq120], h.[Size_Seq130], h.[Size_Seq140], h.[Size_Seq150],
        h.[Size_Seq160], h.[Size_Seq170], h.[Size_Seq180], h.[Size_Seq190], h.[Size_Seq200],
        h.[Size_Seq210], h.[Size_Seq220], h.[Size_Seq230], h.[Size_Seq240], h.[Size_Seq250],
        h.[Size_Seq260], h.[Size_Seq270], h.[Size_Seq280], h.[Size_Seq290], h.[Size_Seq300],
        h.[Size_Seq310], h.[Size_Seq320], h.[Size_Seq330], h.[Size_Seq340], h.[Size_Seq350],
        h.[Size_Seq360], h.[Size_Seq370], h.[Size_Seq380], h.[Size_Seq390], h.[Size_Seq400],
        h.[OrderQuantity], h.[Det_ID]
      FROM [DTrade_CONN].[dbo].[vCustOrd_SzHdr] h
      ORDER BY h.[Order_No]
    `;
    const orderHeaderResult = await request.query(orderHeaderQuery);

    // 2. Fetch Size Names for each order (FIXED query)
    // console.log("📏 Fetching size names for each order...");
    const sizeNamesQuery = `
    -- =================================================================
    -- Query 1: Handle the special hard-coded case for a single Order_No
    -- =================================================================
    SELECT DISTINCT
        [Order_No],
        '2XS'    AS Size_10_Name,
        'XS'     AS Size_20_Name,
        'S'      AS Size_30_Name,
        'M'      AS Size_40_Name,
        'L'      AS Size_50_Name,
        'XL'     AS Size_60_Name,
        'XXL'    AS Size_70_Name,
        'XXXL'   AS Size_80_Name,
        -- For the remaining sizes, they are NULL for this specific order
        NULL AS Size_90_Name,   NULL AS Size_100_Name,  NULL AS Size_110_Name,  NULL AS Size_120_Name,
        NULL AS Size_130_Name,  NULL AS Size_140_Name,  NULL AS Size_150_Name,  NULL AS Size_160_Name,
        NULL AS Size_170_Name,  NULL AS Size_180_Name,  NULL AS Size_190_Name,  NULL AS Size_200_Name,
        NULL AS Size_210_Name,  NULL AS Size_220_Name,  NULL AS Size_230_Name,  NULL AS Size_240_Name,
        NULL AS Size_250_Name,  NULL AS Size_260_Name,  NULL AS Size_270_Name,  NULL AS Size_280_Name,
        NULL AS Size_290_Name,  NULL AS Size_300_Name,  NULL AS Size_310_Name,  NULL AS Size_320_Name,
        NULL AS Size_330_Name,  NULL AS Size_340_Name,  NULL AS Size_350_Name,  NULL AS Size_360_Name,
        NULL AS Size_370_Name,  NULL AS Size_380_Name,  NULL AS Size_390_Name,  NULL AS Size_400_Name
    FROM 
        [DTrade_CONN].[dbo].[vCustOrd_SzHdr]
    WHERE 
        [Order_No] = 'GPAF6117'

    UNION ALL

    -- =================================================================
    -- Query 2: Handle all other orders using the original logic
    -- =================================================================
    SELECT DISTINCT
        [Order_No],
        NULLIF([Size_Seq10], '') AS Size_10_Name,
        NULLIF([Size_Seq20], '') AS Size_20_Name,
        NULLIF([Size_Seq30], '') AS Size_30_Name,
        NULLIF([Size_Seq40], '') AS Size_40_Name,
        NULLIF([Size_Seq50], '') AS Size_50_Name,
        NULLIF([Size_Seq60], '') AS Size_60_Name,
        NULLIF([Size_Seq70], '') AS Size_70_Name,
        NULLIF([Size_Seq80], '') AS Size_80_Name,
        NULLIF([Size_Seq90], '') AS Size_90_Name,
        NULLIF([Size_Seq100], '') AS Size_100_Name,
        NULLIF([Size_Seq110], '') AS Size_110_Name,
        NULLIF([Size_Seq120], '') AS Size_120_Name,
        NULLIF([Size_Seq130], '') AS Size_130_Name,
        NULLIF([Size_Seq140], '') AS Size_140_Name,
        NULLIF([Size_Seq150], '') AS Size_150_Name,
        NULLIF([Size_Seq160], '') AS Size_160_Name,
        NULLIF([Size_Seq170], '') AS Size_170_Name,
        NULLIF([Size_Seq180], '') AS Size_180_Name,
        NULLIF([Size_Seq190], '') AS Size_190_Name,
        NULLIF([Size_Seq200], '') AS Size_200_Name,
        NULLIF([Size_Seq210], '') AS Size_210_Name,
        NULLIF([Size_Seq220], '') AS Size_220_Name,
        NULLIF([Size_Seq230], '') AS Size_230_Name,
        NULLIF([Size_Seq240], '') AS Size_240_Name,
        NULLIF([Size_Seq250], '') AS Size_250_Name,
        NULLIF([Size_Seq260], '') AS Size_260_Name,
        NULLIF([Size_Seq270], '') AS Size_270_Name,
        NULLIF([Size_Seq280], '') AS Size_280_Name,
        NULLIF([Size_Seq290], '') AS Size_290_Name,
        NULLIF([Size_Seq300], '') AS Size_300_Name,
        NULLIF([Size_Seq310], '') AS Size_310_Name,
        NULLIF([Size_Seq320], '') AS Size_320_Name,
        NULLIF([Size_Seq330], '') AS Size_330_Name,
        NULLIF([Size_Seq340], '') AS Size_340_Name,
        NULLIF([Size_Seq350], '') AS Size_350_Name,
        NULLIF([Size_Seq360], '') AS Size_360_Name,
        NULLIF([Size_Seq370], '') AS Size_370_Name,
        NULLIF([Size_Seq380], '') AS Size_380_Name,
        NULLIF([Size_Seq390], '') AS Size_390_Name,
        NULLIF([Size_Seq400], '') AS Size_400_Name
    FROM 
        [DTrade_CONN].[dbo].[vCustOrd_SzHdr]
    WHERE 
        [Order_No] <> 'GPAF6117'
        AND [Order_No] IS NOT NULL;
        `;
    const sizeNamesResult = await request.query(sizeNamesQuery);

    // 3. Fetch Order Colors and Shipping WITH Ship_ID
    // console.log("🎨 Fetching order colors and shipping data with Ship_ID...");
    const orderColorsQuery = `
    -- ========================================================================================
    -- Query 1: Handles ONLY the special case for Order_No = 'GPAF6117' by shifting the data
    -- ========================================================================================
      SELECT 
          -- Standard columns are selected as-is
          [Order_No], [ColorCode], [Color], [ChnColor], [Color_Seq], [ship_seq_no],
          [Ship_ID], [Mode], [Country], [Origin], [CustPORef],
          
          -- Here is the special data shifting logic
          0 AS [Size_Seq10],              -- Becomes 0 as requested
          [Size_Seq10] AS [Size_Seq20],   -- Original Seq10 value is now in Seq20
          [Size_Seq20] AS [Size_Seq30],   -- Original Seq20 value is now in Seq30
          [Size_Seq30] AS [Size_Seq40],   -- etc.
          [Size_Seq40] AS [Size_Seq50],
          [Size_Seq50] AS [Size_Seq60],
          [Size_Seq60] AS [Size_Seq70],
          0 AS [Size_Seq80],              -- Becomes 0/empty as requested
          
          -- All subsequent size columns are also set to 0
          0 AS [Size_Seq90],   0 AS [Size_Seq100],  0 AS [Size_Seq110],  0 AS [Size_Seq120],
          0 AS [Size_Seq130],  0 AS [Size_Seq140],  0 AS [Size_Seq150],  0 AS [Size_Seq160],
          0 AS [Size_Seq170],  0 AS [Size_Seq180],  0 AS [Size_Seq190],  0 AS [Size_Seq200],
          0 AS [Size_Seq210],  0 AS [Size_Seq220],  0 AS [Size_Seq230],  0 AS [Size_Seq240],
          0 AS [Size_Seq250],  0 AS [Size_Seq260],  0 AS [Size_Seq270],  0 AS [Size_Seq280],
          0 AS [Size_Seq290],  0 AS [Size_Seq300],  0 AS [Size_Seq310],  0 AS [Size_Seq320],
          0 AS [Size_Seq330],  0 AS [Size_Seq340],  0 AS [Size_Seq350],  0 AS [Size_Seq360],
          0 AS [Size_Seq370],  0 AS [Size_Seq380],  0 AS [Size_Seq390],  0 AS [Size_Seq400] 
      FROM 
          [DTrade_CONN].[dbo].[vBuyerPOColQty_BySz]
      WHERE 
          [Order_No] = 'GPAF6117'

      UNION ALL

      -- =================================================================
      -- Query 2: Handles all other orders, selecting data without changes
      -- =================================================================
      SELECT 
          [Order_No], [ColorCode], [Color], [ChnColor], [Color_Seq], [ship_seq_no],
          [Ship_ID], [Mode], [Country], [Origin], [CustPORef],
          [Size_Seq10], [Size_Seq20], [Size_Seq30], [Size_Seq40], [Size_Seq50], [Size_Seq60],
          [Size_Seq70], [Size_Seq80], [Size_Seq90], [Size_Seq100], [Size_Seq110], [Size_Seq120],
          [Size_Seq130], [Size_Seq140], [Size_Seq150], [Size_Seq160], [Size_Seq170], [Size_Seq180],
          [Size_Seq190], [Size_Seq200], [Size_Seq210], [Size_Seq220], [Size_Seq230], [Size_Seq240],
          [Size_Seq250], [Size_Seq260], [Size_Seq270], [Size_Seq280], [Size_Seq290], [Size_Seq300],
          [Size_Seq310], [Size_Seq320], [Size_Seq330], [Size_Seq340], [Size_Seq350], [Size_Seq360],
          [Size_Seq370], [Size_Seq380], [Size_Seq390], [Size_Seq400] 
      FROM 
          [DTrade_CONN].[dbo].[vBuyerPOColQty_BySz]
      WHERE 
          [Order_No] <> 'GPAF6117'

      -- The final ORDER BY is applied to the combined results of both queries
      ORDER BY 
          [Order_No], [ColorCode], [ship_seq_no];
    `;
    const orderColorsResult = await request.query(orderColorsQuery);

    // 4. Fetch Size Specifications
    // console.log("📏 Fetching size specifications...");
    const sizeSpecQuery = `
      SELECT 
        [JobNo], [SizeSpecId], [DetId], [Seq], [AtoZ], [Area],
        [ChineseArea], [EnglishRemark], [ChineseRemark], [AreaCode],
        [IsMiddleCalc], [Tolerance], [Tolerance2], [SpecMemo], [SizeSpecMeasUnit],
        [Size1], [Size2], [Size3], [Size4], [Size5], [Size6], [Size7], [Size8], [Size9], [Size10],
        [Size11], [Size12], [Size13], [Size14], [Size15], [Size16], [Size17], [Size18], [Size19], [Size20],
        [Size21], [Size22], [Size23], [Size24], [Size25], [Size26], [Size27], [Size28], [Size29], [Size30],
        [Size31], [Size32], [Size33], [Size34], [Size35], [Size36], [Size37], [Size38], [Size39], [Size40]
      FROM [DTrade_CONN].[dbo].[vTx_JobSizeSpec_Fty]
      ORDER BY [JobNo], [Seq]
    `;
    const sizeSpecResult = await request.query(sizeSpecQuery);

    // 5. Fetch Cut Quantity data from FC_SYSTEM
    // console.log("✂️ Fetching cut quantity data from FC_SYSTEM...");
    const cutQtyQuery = `
      SELECT 
        [BuyerStyle], [StyleNo], [ColorCode], [ChColor], [EngColor], [SIZE],
        SUM(CAST([PlanQty] AS INT)) as TotalPlanQty, 
        SUM(CAST([CutQty] AS INT)) as TotalCutQty
      FROM [FC_SYSTEM].[dbo].[ViewOrderPlanQty]
      WHERE [StyleNo] IS NOT NULL 
        AND [ColorCode] IS NOT NULL 
        AND [SIZE] IS NOT NULL
        AND [PlanQty] IS NOT NULL 
        AND [CutQty] IS NOT NULL
      GROUP BY [BuyerStyle], [StyleNo], [ColorCode], [ChColor], [EngColor], [SIZE]
      ORDER BY [StyleNo], [ColorCode], [SIZE]
    `;
    const cutQtyResult = await request.query(cutQtyQuery);

    // Create size mapping from database for each order
    const orderSizeMapping = new Map();
    sizeNamesResult.recordset.forEach(sizeRecord => {
      const orderNo = sizeRecord.Order_No;
      const sizeMapping = {};
      
      // Map size sequences to actual size names from database
      const sizeColumns = [
        '10', '20', '30', '40', '50', '60', '70', '80', '90', '100',
        '110', '120', '130', '140', '150', '160', '170', '180', '190', '200',
        '210', '220', '230', '240', '250', '260', '270', '280', '290', '300',
        '310', '320', '330', '340', '350', '360', '370', '380', '390', '400'
      ];
      sizeColumns.forEach(seq => {
        const sizeNameColumn = `Size_${seq}_Name`;
        if (sizeRecord[sizeNameColumn] && sizeRecord[sizeNameColumn] !== null) {
          // Use the actual size name from database (like "34B", "34C", etc.)
          sizeMapping[seq] = sizeRecord[sizeNameColumn].toString();
        }
      });
      orderSizeMapping.set(orderNo, sizeMapping);
    });

    // Process Cut Quantity data and create mapping
    // console.log("🔄 Processing cut quantity data...");
    const cutQtyMapping = new Map();
    cutQtyResult.recordset.forEach(record => {
      const styleNo = record.StyleNo;        // This should match Order_No in MongoDB
      const colorCode = record.ColorCode;    // This should match ColorCode in MongoDB
      const size = record.SIZE;              // Size like "XS", "S", "M", etc.
      const planQty = Number(record.TotalPlanQty) || 0;
      const cutQty = Number(record.TotalCutQty) || 0;
      
      // Create mapping key: StyleNo_ColorCode
      const key = `${styleNo}_${colorCode}`;
      
      if (!cutQtyMapping.has(key)) {
        cutQtyMapping.set(key, {});
      }
      
      const colorCutData = cutQtyMapping.get(key);
      
      // Set the aggregated quantities for this size
      colorCutData[size] = {
        PlanCutQty: planQty,
        ActualCutQty: cutQty
      };
    });

    // Helper Functions (keeping all existing helper functions)
    function extractSizeDataAsObject(record, prefix = 'Size_Seq', orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      const sizeObject = {};
      
      // Use all possible size columns
      const allSizeColumns = [
        '10', '20', '30', '40', '50', '60', '70', '80', '90', '100',
        '110', '120', '130', '140', '150', '160', '170', '180', '190', '200',
        '210', '220', '230', '240', '250', '260', '270', '280', '290', '300',
        '310', '320', '330', '340', '350', '360', '370', '380', '390', '400'
      ];
      allSizeColumns.forEach(seq => {
        const columnName = `${prefix}${seq}`;
        const quantity = record[columnName];

        // STEP 1: First, check if the column has any value at all (not null/undefined)
        if (quantity === null || quantity === undefined) {
          return; // Skip this size entirely if it's null or undefined
        }

        // STEP 2: Now, handle the zero-quantity logic
        if (quantity === 0) {
          // If the quantity is 0, we ONLY include it for our special order number
          if (orderNo !== "GPAF6117") {
            return; // For any other order, skip sizes with 0 quantity
          }
        }

        // If we've reached this point, the size is valid and should be included.
        const sizeName = sizeMapping[seq] || `Size${seq}`;

        // An extra check to make sure we have a valid size name before adding it
        if (sizeName) {
          sizeObject[sizeName] = Number(quantity);
        }
      });
      return sizeObject;

      //   const columnName = `${prefix}${seq}`;
      //   if (
      //     record[columnName] &&
      //     record[columnName] !== null &&
      //     (orderNo === "GPAF6117" || record[columnName] !== 0)
      //   ) {
      //     // Use the actual size name from database mapping
      //     const sizeName = sizeMapping[seq] || `Size${seq}`;
      //     sizeObject[sizeName] = Number(record[columnName]);
      //   }
      // });
      // return sizeObject;
    }

    function convertSizeObjectToArray(sizeObject, orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      
      // Create reverse mapping: sizeName -> sequence number
      const sizeToSeqMapping = {};
      Object.entries(sizeMapping).forEach(([seq, sizeName]) => {
        sizeToSeqMapping[sizeName] = parseInt(seq);
      });
      
      // Convert and sort by sequence number instead of alphabetically
      return Object.entries(sizeObject)
        .sort(([sizeNameA], [sizeNameB]) => {
          const seqA = sizeToSeqMapping[sizeNameA] || 999;
          const seqB = sizeToSeqMapping[sizeNameB] || 999;
          return seqA - seqB;
        })
        .map(([sizeName, qty]) => {
          const obj = {};
          obj[sizeName] = qty;
          return obj;
        });
    }

    function parseToleranceValue(toleranceStr) {
  if (!toleranceStr) return { fraction: '', decimal: 0 };
  
  let str = toleranceStr.toString().trim();
  let decimal = 0;
  
  // Clean up the string - remove extra quotes and spaces
  str = str.replace(/['"]/g, '').trim();
  
  // Replace all types of fraction slashes with regular slash
  str = str.replace(/[⁄∕／]/g, '/'); // Unicode: U+2044, U+2215, U+FF0F
  
  // Handle negative values
  let isNegative = false;
  if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1);
  }
  
  try {
    // Handle mixed numbers with various separators
    // Match patterns like: "12 3/4", "12-3/4", "12　3/4" (with different spaces)
    const mixedNumberPattern = /^(\d+(?:\.\d+)?)\s*[-\s　]\s*(\d+)\s*\/\s*(\d+)$/;
    const mixedMatch = str.match(mixedNumberPattern);
    
    if (mixedMatch) {
      const wholePart = parseFloat(mixedMatch[1]) || 0;
      const numerator = parseFloat(mixedMatch[2]) || 0;
      const denominator = parseFloat(mixedMatch[3]) || 1;
      decimal = wholePart + (numerator / denominator);
    }
    // Handle simple fractions like "3/4"
    else if (str.includes('/')) {
      const fractionPattern = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/;
      const fractionMatch = str.match(fractionPattern);
      
      if (fractionMatch) {
        const numerator = parseFloat(fractionMatch[1]) || 0;
        const denominator = parseFloat(fractionMatch[2]) || 1;
        decimal = numerator / denominator;
      } else {
        // Fallback: split by / and try to parse
        const parts = str.split('/');
        if (parts.length === 2) {
          const numerator = parseFloat(parts[0].trim()) || 0;
          const denominator = parseFloat(parts[1].trim()) || 1;
          decimal = numerator / denominator;
        } else {
          decimal = parseFloat(str) || 0;
        }
      }
    }
    // Handle whole numbers or decimals
    else {
      decimal = parseFloat(str) || 0;
    }
    
    // Apply negative sign if needed
    if (isNegative) {
      decimal = -decimal;
    }
    
  } catch (error) {
    console.error(`Error parsing tolerance value "${toleranceStr}":`, error);
    // Fallback: try to extract any numbers and make a reasonable guess
    const numbers = str.match(/\d+(?:\.\d+)?/g);
    if (numbers && numbers.length >= 1) {
      decimal = parseFloat(numbers[0]) || 0;
    } else {
      decimal = 0;
    }
  }
  
  // Ensure decimal is a valid number
  if (isNaN(decimal)) {
    decimal = 0;
  }
  
  return {
    fraction: toleranceStr.toString(),
    decimal: Math.round(decimal * 10000) / 10000 // Round to 4 decimal places
  };
}

// Enhanced extractSpecsDataAsArray function
function extractSpecsDataAsArray(record, orderNo) {
  const sizeMapping = orderSizeMapping.get(orderNo) || {};
  const specsArray = [];
  
  for (let i = 1; i <= 40; i++) {
    const sizeColumn = `Size${i}`;
    if (record[sizeColumn] && record[sizeColumn] !== null) {
      const value = record[sizeColumn].toString().trim();
      const seqNumber = (i * 10).toString();
      // Use actual size name from database mapping
      const sizeName = sizeMapping[seqNumber] || `Size${i}`;
      
      // Convert fraction to decimal using the enhanced parsing
      let decimal = 0;
      try {
        // Replace all types of fraction slashes with regular slash
        let cleanValue = value.replace(/[⁄∕／]/g, '/');
        
        // Handle mixed numbers with various separators
        const mixedNumberPattern = /^(\d+(?:\.\d+)?)\s*[-\s　]\s*(\d+)\s*\/\s*(\d+)$/;
        const mixedMatch = cleanValue.match(mixedNumberPattern);
        
        if (mixedMatch) {
          const wholePart = parseFloat(mixedMatch[1]) || 0;
          const numerator = parseFloat(mixedMatch[2]) || 0;
          const denominator = parseFloat(mixedMatch[3]) || 1;
          decimal = wholePart + (numerator / denominator);
        }
        // Handle simple fractions like "3/4"
        else if (cleanValue.includes('/')) {
          const fractionPattern = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/;
          const fractionMatch = cleanValue.match(fractionPattern);
          
          if (fractionMatch) {
            const numerator = parseFloat(fractionMatch[1]) || 0;
            const denominator = parseFloat(fractionMatch[2]) || 1;
            decimal = numerator / denominator;
          } else {
            // Fallback: split by / and try to parse
            const parts = cleanValue.split('/');
            if (parts.length === 2) {
              const numerator = parseFloat(parts[0].trim()) || 0;
              const denominator = parseFloat(parts[1].trim()) || 1;
              decimal = numerator / denominator;
            } else {
              decimal = parseFloat(cleanValue) || 0;
            }
          }
        }
        // Handle whole numbers or decimals
        else {
          decimal = parseFloat(cleanValue) || 0;
        }
      } catch (error) {
        console.error(`Error parsing spec value "${value}":`, error);
        // Fallback: try to extract any numbers and make a reasonable guess
        const numbers = value.match(/\d+(?:\.\d+)?/g);
        if (numbers && numbers.length >= 1) {
          decimal = parseFloat(numbers[0]) || 0;
        } else {
          decimal = 0;
        }
      }
      
      // Ensure decimal is a valid number
      if (isNaN(decimal)) {
        decimal = 0;
      }
      
      const specObject = {};
      specObject[sizeName] = {
        fraction: value,
        decimal: Math.round(decimal * 10000) / 10000 // Round to 4 decimal places
      };
      specsArray.push(specObject);
    }
  }
  return specsArray;
}

    function isEmptyOrContainsNumbers(value) {
      if (!value || value === null || value === undefined || value === '') {
        return true;
      }
      
      const str = value.toString().trim();
      if (str === '') {
        return true;
      }
      
      // Check if string contains any numbers (0-9)
      return /^\d+$/.test(str);
    }

    // Helper function to convert empty strings to null
    function convertEmptyToNull(value) {
      if (!value || value === null || value === undefined || value === '') {
        return null;
      }
      
      const str = value.toString().trim();
      return str === '' ? null : str;
    }

    // Process Data
    // console.log("🔄 Processing and organizing data...");
    const orderMap = new Map();

    // 1. Process Order Headers
    orderHeaderResult.recordset.forEach(header => {
      const orderNo = header.Order_No;
      if (!orderMap.has(orderNo)) {
        const sizeData = extractSizeDataAsObject(header, 'Size_Seq', orderNo);
        
        orderMap.set(orderNo, {
          SC_Heading: convertEmptyToNull(header.SC_Heading),
          Factory: convertEmptyToNull(header.Factory),
          SalesTeamName: convertEmptyToNull(header.SalesTeamName),
          Cust_Code: convertEmptyToNull(header.Cust_Code),
          ShortName: convertEmptyToNull(header.ShortName),
          EngName: convertEmptyToNull(header.EngName),
          Order_No: header.Order_No,
          Ccy: convertEmptyToNull(header.Ccy),
          Style: convertEmptyToNull(header.Style),
          CustStyle: convertEmptyToNull(header.CustStyle),
          TotalQty: Number(header.OrderQuantity) || 0,
          NoOfSize: Object.keys(sizeData).length,
          OrderColors: [],
          OrderColorShip: [],
          SizeSpec: []
        });
      }
    });

    // 2. Process Order Colors and Shipping
    const colorSummaryMap = new Map();
    const shipMap = new Map();
    orderColorsResult.recordset.forEach(record => {
      const orderNo = record.Order_No;
      const colorCode = record.ColorCode;
      const shipSeqNo = record.ship_seq_no;
      const shipId = record.Ship_ID; // Added Ship_ID
      
      if (orderMap.has(orderNo)) {
        const order = orderMap.get(orderNo);
        
        // Update order details from shipping data
        order.Mode = convertEmptyToNull(record.Mode);
        order.Country = convertEmptyToNull(record.Country);
        order.Origin = convertEmptyToNull(record.Origin);
        order.CustPORef = convertEmptyToNull(record.CustPORef);

        // Sum quantities for OrderColors
        const colorKey = `${orderNo}_${colorCode}`;
        if (!colorSummaryMap.has(colorKey)) {
          colorSummaryMap.set(colorKey, {
            ColorCode: record.ColorCode,
            Color: record.Color,
            ChnColor: record.ChnColor,
            ColorKey: Number(record.Color_Seq) || 0,
            sizeTotals: {}
          });
        }

        const colorSummary = colorSummaryMap.get(colorKey);
        const sizes = extractSizeDataAsObject(record, 'Size_Seq', orderNo);
        
        // Sum up quantities for each size
        Object.entries(sizes).forEach(([sizeName, qty]) => {
          if (!colorSummary.sizeTotals[sizeName]) {
            colorSummary.sizeTotals[sizeName] = 0;
          }
          colorSummary.sizeTotals[sizeName] += qty;
        });

        // Process OrderColorShip WITH Ship_ID
        const shipKey = `${orderNo}_${colorCode}`;
        if (!shipMap.has(shipKey)) {
          shipMap.set(shipKey, {
            ColorCode: record.ColorCode,
            Color: record.Color,
            ChnColor: record.ChnColor,
            ColorKey: Number(record.Color_Seq) || 0,
            ShipSeqNo: []
          });
        }

        const shipRecord = shipMap.get(shipKey);
        const existingSeq = shipRecord.ShipSeqNo.find(seq => seq.seqNo === shipSeqNo);
        if (!existingSeq && shipSeqNo) {
          // Convert sizes object to array format like OrderQty
          const sizesArray = convertSizeObjectToArray(sizes, orderNo);
          
          shipRecord.ShipSeqNo.push({
            seqNo: Number(shipSeqNo),
            Ship_ID: convertEmptyToNull(shipId), // Added Ship_ID here
            sizes: sizesArray  // Now this will be in format [{"XS": 44}, {"S": 130}, ...]
          });
        }
      }
    });

    // Convert color summaries to the desired format
    const colorMap = new Map();
    for (const [colorKey, colorSummary] of colorSummaryMap) {
      const orderNo = colorKey.split('_')[0]; // Extract order number from colorKey
      const orderQtyArray = convertSizeObjectToArray(colorSummary.sizeTotals, orderNo); // Pass orderNo
      
      colorMap.set(colorKey, {
        ColorCode: colorSummary.ColorCode,
        Color: colorSummary.Color,
        ChnColor: colorSummary.ChnColor,
        ColorKey: colorSummary.ColorKey,
        OrderQty: orderQtyArray, 
        CutQty: {} // Will be populated with cut quantity data
      });
    }

    // Add cut quantity data to colors
    // console.log("🔄 Mapping cut quantity data to orders...");
    let cutQtyMatchCount = 0;
    let totalColorProcessed = 0;
    
    for (const [orderNo, order] of orderMap) {
      for (const [colorKey, colorData] of colorMap) {
        if (colorKey.startsWith(orderNo + '_')) {
          totalColorProcessed++;
          const colorCode = colorData.ColorCode;
          
          // Create the mapping key: Order_No_ColorCode
          const cutKey = `${orderNo}_${colorCode}`;
          
          if (cutQtyMapping.has(cutKey)) {
            const cutData = cutQtyMapping.get(cutKey);
            
            // Clear existing CutQty data and set new data
            colorData.CutQty = {};
            
            // Set the cut data for each size
            Object.entries(cutData).forEach(([size, quantities]) => {
              colorData.CutQty[size] = {
                ActualCutQty: quantities.ActualCutQty,
                PlanCutQty: quantities.PlanCutQty
              };
            });
            
            cutQtyMatchCount++;
          }
        }
      }
    }

    // console.log(`📊 Cut quantity matching results:`);
    
    // Verify CutQty data is actually in the colorData objects
    // console.log("🔍 Verifying CutQty data in colorMap...");
    let colorsWithCutQty = 0;
    for (const [colorKey, colorData] of colorMap) {
      if (Object.keys(colorData.CutQty).length > 0) {
        colorsWithCutQty++;
    //     if (colorsWithCutQty <= 3) { // Log first 3 examples
    //       console.log(`✅ Color ${colorKey} has CutQty:`, colorData.CutQty);
        }
      }
    // }

    // Add colors and shipping to orders
    for (const [orderNo, order] of orderMap) {
      // Add OrderColors
      for (const [colorKey, colorData] of colorMap) {
        if (colorKey.startsWith(orderNo + '_')) {
          order.OrderColors.push(colorData);
        }
      }

      // Add OrderColorShip
      for (const [shipKey, shipData] of shipMap) {
        if (shipKey.startsWith(orderNo + '_')) {
                   order.OrderColorShip.push(shipData);
        }
      }
    }

    // 3. Process Size Specifications (keeping existing logic)
    sizeSpecResult.recordset.forEach(spec => {
      const jobNo = spec.JobNo;
      
      if (orderMap.has(jobNo)) {
        const order = orderMap.get(jobNo);
        
        try {
          // Use the fixed parseToleranceValue function
          const toleranceMinus = parseToleranceValue(spec.Tolerance);
          const tolerancePlus = parseToleranceValue(spec.Tolerance2);
          const specs = extractSpecsDataAsArray(spec, jobNo);
          
          // Handle ChineseName logic - DEFINE THE VARIABLES FIRST
          const chineseArea = convertEmptyToNull(spec.ChineseArea);
          const chineseRemark = convertEmptyToNull(spec.ChineseRemark);
          let chineseName = null;
          
          // If ChineseArea is null/empty/only numbers, use ChineseRemark
          if (isEmptyOrContainsNumbers(spec.ChineseArea)) {
            chineseName = chineseRemark;
          }
          // If ChineseRemark is null/empty/only numbers, use ChineseArea
          else if (isEmptyOrContainsNumbers(spec.ChineseRemark)) {
            chineseName = chineseArea;
          }
          // If both are valid, prefer ChineseArea
          else {
            chineseName = chineseArea;
          }
          
          const sizeSpecData = {
            Seq: Number(spec.Seq) || 0,
            AtoZ: convertEmptyToNull(spec.AtoZ),
            Area: convertEmptyToNull(spec.Area),
            ChineseArea: chineseArea,
            EnglishRemark: convertEmptyToNull(spec.EnglishRemark),
            ChineseRemark: chineseRemark,
            ChineseName: chineseName,
            AreaCode: convertEmptyToNull(spec.AreaCode),
            IsMiddleCalc: spec.IsMiddleCalc || null,
            ToleranceMinus: {
              fraction: toleranceMinus.fraction || '',
              decimal: toleranceMinus.decimal
            },
            TolerancePlus: {
              fraction: tolerancePlus.fraction || '',
              decimal: tolerancePlus.decimal
            },
            SpecMemo: convertEmptyToNull(spec.SpecMemo),
            SizeSpecMeasUnit: convertEmptyToNull(spec.SizeSpecMeasUnit),
            Specs: specs || []
          };
          
          order.SizeSpec.push(sizeSpecData);
          
        } catch (error) {
          console.error(`Error processing spec for job ${jobNo}, seq ${spec.Seq}:`, error.message); 
        }
      }
    });

    // 4. Save to MongoDB
    console.log("💾 Saving to MongoDB...");
    const finalDocs = Array.from(orderMap.values());
    
    // Clean and validate data before saving
    const cleanedDocs = finalDocs.map(doc => {
      if (doc.SizeSpec) {
        doc.SizeSpec = doc.SizeSpec.filter(spec => {
          return spec.Seq && !isNaN(spec.Seq) && 
                !isNaN(spec.ToleranceMinus.decimal) && 
                !isNaN(spec.TolerancePlus.decimal);
        });
      }
      return doc;
    });

    const bulkOps = cleanedDocs.map(doc => ({
      updateOne: {
        filter: { Order_No: doc.Order_No },
        update: { $set: doc },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      try {
        const result = await DtOrder.bulkWrite(bulkOps);
        
        console.log("✅ DT Orders data migration completed successfully!");
        
        return {
          success: true,
          totalOrders: finalDocs.length,
          // matched: result.matchedCount,
          // upserted: result.upsertedCount,
          modified: result.modifiedCount,
          cutQtyRecords: cutQtyResult.recordset.length,
          cutQtyMatchCount: cutQtyMatchCount,
          colorsWithCutQty: colorsWithCutQty
        };
        
      } catch (bulkError) {
        console.error("❌ Bulk operation failed:", bulkError);
        throw bulkError;
      }
    } else {
      console.log("⚠️ No data to sync");
      return { success: true, message: "No data to sync" };
    }
  } catch (error) {
    console.error("❌ DT Orders sync failed:", error);
    throw error;
  }
}

// Add API endpoint for manual sync
//api/sync-dt-orders
export const syncDtOrders = async (req, res) => {
  try {
    const result = await syncDTOrdersData();
    res.json({
      success: true,
      message: "DT Orders data sync completed successfully",
      data: result
    });
  } catch (error) {
    console.error("DT Orders sync API error:", error);
    res.status(500).json({
      success: false,
      message: "DT Orders data sync failed",
      error: error.message
    });
  }
};

// // Initial sync on server start (uncomment when ready)
// syncDTOrdersData()
//   .then((result) => {
//     console.log("✅ Initial DT Orders Data Sync completed:", result);
//   })
//   .catch((err) => {
//     console.error("❌ Initial DT Orders Data Sync failed:", err);
//   });

// Schedule to run every 15 minutes
  cron.schedule("0 */3 * * *", async () => {
   await syncDTOrdersData()
    .then((result) => {
      console.log("✅ DT Orders Data Sync completed ", result);
    })
    .catch((err) => {
      console.error("❌ DT Orders Data Sync failed", err);
    });
});


// /* ------------------------------
//    Cutting Inline Orders Sync with MongoDB
// ------------------------------ */

// // Gatekeeper to prevent multiple syncs
// let isCuttingInlineOrdersSyncRunning = false;

// const convertToMarkerRatioArray = (record) => {
//   const markerRatio = [];
//   // Process sizes 1-10
//   for (let i = 1; i <= 10; i++) {
//     const size = record[`Size${i}`];
//     const orderQty = record[`OrderQty${i}`];
//     const cuttingRatio = record[`CuttingRatio${i}`];

//     // Only add to array if size exists
//     if (size) {
//       markerRatio.push({
//         no: i,
//         size: size,
//         ratio: cuttingRatio || 0,
//         qty: orderQty || 0
//       });
//     }
//   }
//   return markerRatio;
// };

// /**
//  * Synchronizes cutting inline orders from the SQL server to MongoDB.
//  * @param {number | string} daysBack - The number of days of data to sync.
//  * If a non-numeric value (like 'all') is passed, it defaults to a very large number to sync all historical data.
//  * Defaults to 2 days if not provided.
//  */
// async function syncCuttingInlineOrders(daysBack = 2) {
//   // Gatekeeper check
//   if (isCuttingInlineOrdersSyncRunning) {
//     console.log("[CuttingInlineOrders] Sync is already in progress. Skipping this run.");
//     return;
//   }

//   const maxRetries = 3;
//   let attempt = 0;
//   let records = [];

//   // Safeguard: Ensure daysBack is a valid number for the SQL query.
//   // If 'all' or another non-numeric string is passed, use a large number to fetch all data.
//   let effectiveDaysBack;
//   if (daysBack === 'all') {
//     effectiveDaysBack = 9999; // A large number to signify all data
//     console.log(`[CuttingInlineOrders] Fetching all historical data as requested.`);
//   } else {
//     effectiveDaysBack = !isNaN(parseInt(daysBack)) ? parseInt(daysBack) : 2; // Default to 2 days on invalid input
//   }

//   try {
//     isCuttingInlineOrdersSyncRunning = true;
//     console.log("[CuttingInlineOrders] Starting sync at", new Date().toISOString());

//     // FIX 1: Check connection status *before* attempting to query.
//     if (!sqlConnectionStatus.FCSystem) {
//       console.warn(
//         "[CuttingInlineOrders] Skipping sync: FCSystem database is not connected."
//       );
//       isCuttingInlineOrdersSyncRunning = false; // Release the lock
//       return;
//     }

//     while (attempt < maxRetries) {
//       try {
//         // Ensure connection before each attempt
//         await ensurePoolConnected(poolFCSystem, "FCSystem");
//         const request = poolFCSystem.request();

//         const query = `
//            DECLARE @StartDate DATE = CAST(DATEADD(DAY, -${effectiveDaysBack}, GETDATE()) AS DATE);

//           -- ================================================
//           -- Optimized Spreading and Order Data Report
//           -- ================================================

//           WITH 
//           -- ------------------------------------------------
//           -- 1. Lot Data: Combine all Lot numbers by Style + Table
//           -- ------------------------------------------------
//           LotData AS (
//               SELECT 
//                   v.Style,
//                   v.TableNo,
//                   STUFF((
//                       SELECT DISTINCT ', ' + v_inner.Lot
//                       FROM [FC_SYSTEM].[dbo].[ViewSpreading_ForQC] AS v_inner
//                       WHERE 
//                           v_inner.Style = v.Style 
//                           AND v_inner.TableNo = v.TableNo
//                           AND v_inner.Lot IS NOT NULL 
//                           AND v_inner.Lot <> ''
//                       FOR XML PATH(''), TYPE
//                   ).value('.', 'NVARCHAR(MAX)'), 1, 2, '') AS LotNos
//               FROM 
//                   [FC_SYSTEM].[dbo].[ViewSpreading_ForQC] AS v
//                   INNER JOIN [FC_SYSTEM].[dbo].[ViewSpreading_Inv] AS inv_filter 
//                       ON v.TxnNo = inv_filter.TxnNo
//               WHERE 
//                   v.Lot IS NOT NULL 
//                   AND v.Lot <> '' 
//                   AND inv_filter.Create_Date >= @StartDate
//               GROUP BY 
//                   v.Style, v.TableNo
//           ),

//           -- ------------------------------------------------
//           -- 2. Order Data: Aggregate Order Quantities by Style + Color
//           -- ------------------------------------------------
//           OrderData AS (
//               SELECT 
//                   Style,
//                   EngColor,
//                   Size1, Size2, Size3, Size4, Size5, 
//                   Size6, Size7, Size8, Size9, Size10,
//                   OrderQty1, OrderQty2, OrderQty3, OrderQty4, OrderQty5,
//                   OrderQty6, OrderQty7, OrderQty8, OrderQty9, OrderQty10,
//                   TotalOrderQty,
//                   SUM(TotalOrderQty) OVER (PARTITION BY Style) AS TotalOrderQtyStyle
//               FROM (
//                   SELECT 
//                       o.Style,
//                       o.EngColor,
//                       MAX(o.Size1) AS Size1,
//                       MAX(o.Size2) AS Size2,
//                       MAX(o.Size3) AS Size3,
//                       MAX(o.Size4) AS Size4,
//                       MAX(o.Size5) AS Size5,
//                       MAX(o.Size6) AS Size6,
//                       MAX(o.Size7) AS Size7,
//                       MAX(o.Size8) AS Size8,
//                       MAX(o.Size9) AS Size9,
//                       MAX(o.Size10) AS Size10,
//                       SUM(ISNULL(o.Qty1, 0)) AS OrderQty1,
//                       SUM(ISNULL(o.Qty2, 0)) AS OrderQty2,
//                       SUM(ISNULL(o.Qty3, 0)) AS OrderQty3,
//                       SUM(ISNULL(o.Qty4, 0)) AS OrderQty4,
//                       SUM(ISNULL(o.Qty5, 0)) AS OrderQty5,
//                       SUM(ISNULL(o.Qty6, 0)) AS OrderQty6,
//                       SUM(ISNULL(o.Qty7, 0)) AS OrderQty7,
//                       SUM(ISNULL(o.Qty8, 0)) AS OrderQty8,
//                       SUM(ISNULL(o.Qty9, 0)) AS OrderQty9,
//                       SUM(ISNULL(o.Qty10, 0)) AS OrderQty10,
//                       SUM(ISNULL(o.Total, 0)) AS TotalOrderQty
//                   FROM 
//                       [FC_SYSTEM].[dbo].[ViewOrderQty] AS o
//                   WHERE 
//                       EXISTS (
//                           SELECT 1 
//                           FROM [FC_SYSTEM].[dbo].[ViewSpreading_Inv] vi 
//                           WHERE 
//                               vi.Style = o.Style 
//                               AND vi.EngColor = o.EngColor 
//                               AND vi.Create_Date >= @StartDate
//                       )
//                   GROUP BY 
//                       o.Style, o.EngColor
//               ) AS OrderColorAggregates
//           )

//           -- ------------------------------------------------
//           -- 3. Main Query: Combine Spreading, Lot, and Order Data
//           -- ------------------------------------------------
//           SELECT
//               v.SPBarcode AS Barcode, 
//               v.Style AS StyleNo,
//               v.Create_Date AS TxnDate,
//               v.TxnNo,
//               CASE WHEN v.Buyer = 'ABC' THEN 'ANF' ELSE v.Buyer END AS Buyer,
//               v.BuyerStyle,
//               v.EngColor AS Color,
//               v.ChnColor,
//               v.ColorNo AS ColorCode,
//               v.Fabric_Type AS FabricType,
//               v.Material,
//               CASE 
//                   WHEN PATINDEX('%[_ ]%', v.PreparedBy) > 0 
//                       THEN LTRIM(SUBSTRING(v.PreparedBy, PATINDEX('%[_ ]%', v.PreparedBy) + 1, LEN(v.PreparedBy)))
//                   ELSE v.PreparedBy 
//               END AS SpreadTable,
//               v.TableNo,
//               v.RollQty,
//               ROUND(v.SpreadYds, 3) AS SpreadYds,
//               v.Unit,
//               ROUND(v.GrossKgs, 3) AS GrossKgs,
//               ROUND(v.NetKgs, 3) AS NetKgs,
//               ROUND(v.PlanLayer,0) AS PlanLayer,
//               v.ActualLayer,
//               CAST(
//                   ISNULL(v.PlanLayer, 0) * (
//                       ISNULL(v.Ratio1, 0) + ISNULL(v.Ratio2, 0) + ISNULL(v.Ratio3, 0) + 
//                       ISNULL(v.Ratio4, 0) + ISNULL(v.Ratio5, 0) + ISNULL(v.Ratio6, 0) + 
//                       ISNULL(v.Ratio7, 0) + ISNULL(v.Ratio8, 0) + ISNULL(v.Ratio9, 0) + 
//                       ISNULL(v.Ratio10, 0)
//                   ) AS INT
//               ) AS TotalPcs,
//               v.Pattern AS MackerNo,
//               ROUND(v.MarkerLength, 3) AS MackerLength,
//               v.Edit_Width AS MackerWidth,
//               v.Relax_SetTime AS Standard_Relax_Time,
//               ld.LotNos,
//               od.OrderQty1, od.OrderQty2, od.OrderQty3, od.OrderQty4, od.OrderQty5,
//               od.OrderQty6, od.OrderQty7, od.OrderQty8, od.OrderQty9, od.OrderQty10,
//               od.TotalOrderQty,
//               od.TotalOrderQtyStyle,
//               v.Ratio1 AS CuttingRatio1, v.Ratio2 AS CuttingRatio2, v.Ratio3 AS CuttingRatio3,
//               v.Ratio4 AS CuttingRatio4, v.Ratio5 AS CuttingRatio5, v.Ratio6 AS CuttingRatio6,
//               v.Ratio7 AS CuttingRatio7, v.Ratio8 AS CuttingRatio8, v.Ratio9 AS CuttingRatio9,
//               v.Ratio10 AS CuttingRatio10,
//               v.Size1, v.Size2, v.Size3, v.Size4, v.Size5, v.Size6, v.Size7, v.Size8, v.Size9, v.Size10
//           FROM 
//               [FC_SYSTEM].[dbo].[ViewSpreading_Inv] AS v
//               LEFT JOIN LotData AS ld 
//                   ON v.Style = ld.Style 
//                   AND v.TableNo = ld.TableNo
//               LEFT JOIN OrderData AS od 
//                   ON v.Style = od.Style 
//                   AND v.EngColor = od.EngColor
//           WHERE 
//               v.Create_Date >= @StartDate
//               AND v.Fabric_Type = 'A'
//           ORDER BY 
//               v.Create_Date DESC;
//         `;

//         const result = await request.query(query);
//         records = result.recordset;
//         break; // If successful, break out of the retry loop

//       } catch (err) {
//         attempt++;
//         if (err.number === 1205 && attempt < maxRetries) {
//           const delay = Math.random() * 1000 + 1000; // Random delay 1-2 seconds
//           console.warn(`[CuttingInlineOrders] Deadlock detected. Retrying in ${delay.toFixed(0)}ms (attempt ${attempt}/${maxRetries})`);
//           await new Promise(resolve => setTimeout(resolve, delay));
//         } else {
//           // If it's not a deadlock or we've run out of retries, throw the error
//           throw err;
//         }
//       }
//     }

//     console.log(`[CuttingInlineOrders] Fetched ${records.length} records from SQL Server`);

//     if (records.length === 0) {
//       console.log("[CuttingInlineOrders] No records to process");
//       return;
//     }

//     // *** OPTIMIZATION: Use bulkWrite instead of one-by-one updates ***
//     const bulkOps = records.map(record => {
//       const markerRatio = convertToMarkerRatioArray(record);

//       const updateData = {
//         barcode: record.Barcode,
//         styleNo: record.StyleNo,
//         txnDate: record.TxnDate,
//         txnNo: record.TxnNo,
//         buyer: record.Buyer,
//         buyerStyle: record.BuyerStyle,
//         color: record.Color,
//         chnColor: record.ChnColor,
//         colorCode: record.ColorCode,
//         fabricType: record.FabricType,
//         material: record.Material,
//         spreadTable: record.SpreadTable,
//         tableNo: record.TableNo,
//         rollQty: record.RollQty,
//         spreadYds: record.SpreadYds,
//         unit: record.Unit,
//         grossKgs: record.GrossKgs,
//         netKgs: record.NetKgs,
//         planLayer: record.PlanLayer,
//         actualLayer: record.ActualLayer,
//         totalPcs: record.TotalPcs,
//         mackerNo: record.MackerNo,
//         mackerLength: record.MackerLength,
//         mackerWidth: record.MackerWidth,
//         standardRelaxTime: record.Standard_Relax_Time,
//         lotNos: record.LotNos,
//         totalOrderQty: record.TotalOrderQty,
//         totalOrderQtyStyle: record.TotalOrderQtyStyle,
//         markerRatio: markerRatio // Single array with all size data
//       };

//       return {
//         updateOne: {
//           filter: { barcode: record.Barcode },
//           update: { $set: updateData },
//           upsert: true
//         }
//       };
//     });

//     if (bulkOps.length > 0) {
//       // FIX 2: Added 'await' to ensure the database operation completes.
//       const bulkResult = await CuttingInlineOrders.bulkWrite(bulkOps); 
//       console.log(`[CuttingInlineOrders] MongoDB bulkWrite result: Matched: ${bulkResult.matchedCount}, Upserted: ${bulkResult.upsertedCount}, Modified: ${bulkResult.modifiedCount}`);
//       return { total: records.length, saved: bulkResult.upsertedCount, updated: bulkResult.modifiedCount };
//     } else {
//       console.log("[CuttingInlineOrders] No operations to perform in bulkWrite.");
//       return { total: 0, saved: 0, updated: 0 };
//     }

//   } catch (error) {
//     console.error("[CuttingInlineOrders] Error during sync:", error);
//     throw error;
//   } finally {
//     isCuttingInlineOrdersSyncRunning = false;
//   }
// }

// // Manual sync endpoint for Cutting Inline Orders
// // api/sync-cutting-inline-orders
// export const syncCuttingInlineOrdersData = async (req, res) => {
//   try {
//     const result = await syncCuttingInlineOrders();
//     res.json({
//       success: true,
//       message: "Cutting Inline Orders sync completed successfully",
//       data: result
//     });
//   } catch (error) {
//     console.error("Cutting Inline Orders sync API error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Cutting Inline Orders sync failed",
//       error: error.message
//     });
//   }
// };

// cron.schedule("*/10 * * * *", async () => {
//   console.log("Running scheduled Cutting Inline Orders sync...");
//   try {
//     await syncCuttingInlineOrders(2); // Sync only the last 2 days for regular scheduled runs.
//   } catch (error) {
//     console.error("Error in scheduled Cutting Inline Orders sync:", error);
//   }
// });

// console.log("Scheduled Cutting Inline Orders sync every 4 minutes.");

export async function closeSQLPools() {
    try {
        await Promise.all([
            poolYMDataStore.close(),
            poolYMCE.close(),
            poolFCSystem.close()
        ]);
        console.log("SQL connection pools closed.");
    } catch (err) {
        console.error("Error closing SQL connection pools:", err);
        throw err; // Re-throw to allow calling function to handle
    }
}
