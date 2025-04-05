/* ------------------------------
   Import Required Libraries/Models
------------------------------ */

import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import fs from "fs";
import https from "https"; // Import https for HTTPS server
//import http from "http"; // Import http for Socket.io
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { Server } from "socket.io"; // Import Socket.io
import { fileURLToPath } from "url";
import createIroningModel from "./models/Ironing.js";
import createRoleModel from "./models/Role.js";
//import createRoleManagmentModel from "./models/RoleManagment.js";
import createOPAModel from "./models/OPA.js";
import createPackingModel from "./models/Packing.js";
import createQC2DefectPrintModel from "./models/QC2DefectPrint.js";
import createRoleManagmentModel from "./models/RoleManagment.js";
import createUserModel from "./models/User.js";
import createWashingModel from "./models/Washing.js";
import createQCDataModel from "./models/qc1_data.js";
import createQc2OrderDataModel from "./models/qc2_orderdata.js";
import createQC2InspectionPassBundleModel from "./models/qc2_inspection.js";
import createQC2ReworksModel from "./models/qc2_rework.js";
import createQC2RepairTrackingModel from "./models/qc2_repair_tracking.js";
import createQCInlineRovingModel from "./models/QC_Inline_Roving.js";
import createCuttingOrdersModel from "./models/CuttingOrders.js"; // New model import
import createQC1SunriseModel from "./models/QC1Sunrise.js"; // New model import

import createCuttingInspectionModel from "./models/cutting_inspection.js"; // New model import
import createInlineOrdersModel from "./models/InlineOrders.js"; // Import the new model
import sql from "mssql"; // Import mssql for SQL Server connection
import cron from "node-cron"; // Import node-cron for scheduling

// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "./config.js";

/* ------------------------------
   Connection String
------------------------------ */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5001;

/* ------------------------------
   for HTTPS
------------------------------ */

// Load SSL certificates
const privateKey = fs.readFileSync(
  "C:/Users/USER/Downloads/YQMS-V0.1-main/YQMS-V0.1-main/192.167.12.14-key.pem",
  //"/Users/dilanlakmal/Downloads/YQMS-Latest-main/192.165.2.175-key.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "C:/Users/USER/Downloads/YQMS-V0.1-main/YQMS-V0.1-main/192.167.12.14.pem",
  //"/Users/dilanlakmal/Downloads/YQMS-Latest-main/192.165.2.175.pem",
  "utf8"
);

const credentials = {
  key: privateKey,
  cert: certificate
};

// Create HTTPS server
const server = https.createServer(credentials, app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "https://192.167.12.14:3001", //"https://192.165.2.175:3001", //"https://localhost:3001"
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use("/public", express.static(path.join(__dirname, "../public")));

//app.use(cors());
app.use(bodyParser.json());
app.use(
  cors({
    origin: "https://192.167.12.14:3001", //["http://localhost:3001", "https://localhost:3001"],
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.options("*", cors());

const ymProdConnection = mongoose.createConnection(
  "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_prod?authSource=admin"
  //"mongodb://localhost:27017/ym_prod"
);

const ymEcoConnection = mongoose.createConnection(
  "mongodb://admin:Yai%40Ym2024@192.167.1.10:29000/ym_eco_board?authSource=admin"
  //"mongodb://localhost:27017/ym_prod"
);

ymProdConnection.on("connected", () =>
  console.log("Connected to ym_prod database in 192.167.1.10:29000...")
);
ymProdConnection.on("error", (err) => console.error("unexpected error:", err));

ymEcoConnection.on("connected", () =>
  console.log("Connected to ym_eco_board database in 192.167.1.10:29000...")
);
ymEcoConnection.on("error", (err) => console.error("unexpected error:", err));

// Define model on connections

//const UserMain = createUserModel(ymProdConnection);
const UserMain = createUserModel(ymEcoConnection);
const Role = createRoleModel(ymProdConnection);
const QCData = createQCDataModel(ymProdConnection);
const QC2OrderData = createQc2OrderDataModel(ymProdConnection);
const Ironing = createIroningModel(ymProdConnection);
const Washing = createWashingModel(ymProdConnection);
const OPA = createOPAModel(ymProdConnection);
const Packing = createPackingModel(ymProdConnection);
const RoleManagment = createRoleManagmentModel(ymProdConnection);
const QC2DefectPrint = createQC2DefectPrintModel(ymProdConnection);
const QC2InspectionPassBundle =
  createQC2InspectionPassBundleModel(ymProdConnection);
const QC2Reworks = createQC2ReworksModel(ymProdConnection);
const QC2RepairTracking = createQC2RepairTrackingModel(ymProdConnection);
const QCInlineRoving = createQCInlineRovingModel(ymProdConnection);
const InlineOrders = createInlineOrdersModel(ymProdConnection); // Define the new model
const CuttingOrders = createCuttingOrdersModel(ymProdConnection); // New model
const CuttingInspection = createCuttingInspectionModel(ymProdConnection); // New model
const QC1Sunrise = createQC1SunriseModel(ymProdConnection); // Define the new model

// Set UTF-8 encoding for responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

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
  server: "ymws-150",
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
   YMWHSYS2 SQL Configuration
------------------------------ */

const sqlConfigYMWHSYS2 = {
  user: "user01",
  password: "user01",
  server: "YM-WHSYS",
  database: "YMWHSYS2",
  options: {
    encrypt: false,
    trustServerCertificate: true
  },
  requestTimeout: 300000,
  connectionTimeout: 300000,
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

// Create connection pools
const poolYMDataStore = new sql.ConnectionPool(sqlConfig);
const poolYMCE = new sql.ConnectionPool(sqlConfigYMCE);
const poolYMWHSYS2 = new sql.ConnectionPool(sqlConfigYMWHSYS2);

// Function to connect to a pool with reconnection logic
async function connectPool(pool, poolName) {
  let retries = 3;
  while (retries > 0) {
    try {
      await pool.connect();
      console.log(`Connected to ${poolName} pool at ${pool.config.server}`);
      return pool;
    } catch (err) {
      console.error(`Error connecting to ${poolName} pool:`, err);
      retries -= 1;
      if (retries === 0) {
        throw new Error(`Failed to connect to ${poolName} after 3 attempts`);
      }
      console.log(
        `Retrying ${poolName} connection (${retries} attempts left)...`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }
}

// Function to ensure pool is connected before querying
async function ensurePoolConnected(pool, poolName) {
  if (!pool.connected) {
    console.log(
      `${poolName} pool is not connected. Attempting to reconnect...`
    );
    await connectPool(pool, poolName);
  }
  return pool;
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

// Initialize pools and wait for connections
async function initializePools() {
  try {
    await Promise.all([
      connectPool(poolYMDataStore, "YMDataStore"),
      connectPool(poolYMCE, "YMCE_SYSTEM"),
      connectPool(poolYMWHSYS2, "YMWHSYS2")
    ]);
  } catch (err) {
    console.error("Failed to initialize SQL connection pools:", err);
    process.exit(1); // Exit if pools cannot be initialized
  }
}

/* ------------------------------
   Initialize Pools and Run Initial Syncs
------------------------------ */

// Call this before initializePools
dropConflictingIndex().then(() => {
  initializePools()
    .then(() => {
      console.log("All SQL connection pools initialized successfully.");
      syncInlineOrders().then(() =>
        console.log("Initial inline_orders sync completed.")
      );
      syncCuttingOrders().then(() =>
        console.log("Initial cuttingOrders sync completed.")
      );
      syncQC1SunriseData().then(() =>
        console.log("Initial QC1 Sunrise sync completed.")
      );
    })
    .catch((err) => {
      console.error("Failed to initialize SQL connection pools:", err);
      process.exit(1);
    });
});

// New Endpoint for RS18 Data (YMDataStore)
app.get("/api/sunrise/rs18", async (req, res) => {
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
});

// New Endpoint for Sunrise Output Data (YMDataStore)
app.get("/api/sunrise/output", async (req, res) => {
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
});

/* ------------------------------
   QC1 Sunrise MongoDB
------------------------------ */

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

// Endpoint to manually trigger QC1 Sunrise sync
app.get("/api/sunrise/sync-qc1", async (req, res) => {
  try {
    await syncQC1SunriseData();
    res.json({ message: "QC1 Sunrise data synced successfully" });
  } catch (err) {
    console.error("Error in /api/sunrise/sync-qc1 endpoint:", err);
    res
      .status(500)
      .json({ message: "Failed to sync QC1 Sunrise data", error: err.message });
  }
});

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
   API to fetch inline data from SQL to ym_prod
------------------------------ */

async function syncInlineOrders() {
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
app.post("/api/sync-inline-orders", async (req, res) => {
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
});

// Schedule the sync to run every day at 11 AM
cron.schedule("0 11 * * *", async () => {
  console.log("Running scheduled inline_orders sync at 11 AM...");
  await syncInlineOrders();
});

// Run the sync immediately on server start (optional, for testing)
syncInlineOrders().then(() => {
  console.log(
    "Initial inline_orders sync completed. Scheduler is now running..."
  );
});

// Updated Endpoint to Search MO Numbers (St_No) from inline_orders in MongoDB with partial matching
app.get("/api/inline-orders-mo-numbers", async (req, res) => {
  try {
    const searchTerm = req.query.search; // Get the search term from query params
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    // Use a case-insensitive regex to match the term anywhere in St_No
    const regexPattern = new RegExp(searchTerm, "i");

    // Query the inline_orders collection
    const results = await InlineOrders.find({
      St_No: { $regex: regexPattern }
    })
      .select("St_No") // Only return the St_No field (equivalent to .project({ St_No: 1, _id: 0 }))
      .limit(100) // Limit results to prevent overwhelming the UI
      .sort({ St_No: 1 }) // Sort alphabetically
      .exec();

    // Extract unique St_No values
    const uniqueMONos = [...new Set(results.map((r) => r.St_No))];

    res.json(uniqueMONos);
  } catch (err) {
    console.error("Error fetching MO numbers from inline_orders:", err);
    res.status(500).json({
      message: "Failed to fetch MO numbers from inline_orders",
      error: err.message
    });
  }
});

// New Endpoint to Fetch Inline Order Details for a given MO No (St_No)
app.get("/api/inline-orders-details", async (req, res) => {
  try {
    const stNo = req.query.stNo;
    if (!stNo) {
      return res.status(400).json({ error: "St_No is required" });
    }

    // Find the document where St_No matches
    const document = await InlineOrders.findOne({ St_No: stNo }).exec();

    if (!document) {
      return res.status(404).json({ error: "MO No not found" });
    }

    res.json(document);
  } catch (err) {
    console.error("Error fetching Inline Order details:", err);
    res.status(500).json({
      message: "Failed to fetch Inline Order details",
      error: err.message
    });
  }
});

// New Endpoint for YMCE_SYSTEM Data
app.get("/api/ymce-system-data", async (req, res) => {
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
});

/* ------------------------------
   Sync Cutting Orders Function
------------------------------ */

async function syncCuttingOrders() {
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

    // Process sizes into a map
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
}

/* ------------------------------
   Manual Sync Endpoint
------------------------------ */

app.post("/api/sync-cutting-orders", async (req, res) => {
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
});

/* ------------------------------
   Schedule Daily Sync
------------------------------ */

cron.schedule("0 7 * * *", async () => {
  console.log("Running scheduled cuttingOrders sync at 7 AM...");
  try {
    await syncCuttingOrders();
  } catch (err) {
    console.error("Scheduled cuttingOrders sync failed:", err);
  }
});

/* ------------------------------
   Updated Endpoints for Cutting.jsx
------------------------------ */

// Endpoint to Search MO Numbers (StyleNo) from cuttingOrders with partial matching
app.get("/api/cutting-orders-mo-numbers", async (req, res) => {
  try {
    const searchTerm = req.query.search;
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    // Use a case-insensitive regex to match the term anywhere in StyleNo
    const regexPattern = new RegExp(searchTerm, "i");

    // Query the cuttingOrders collection
    const results = await CuttingOrders.find({
      StyleNo: { $regex: regexPattern }
    })
      .select("StyleNo") // Only return the StyleNo field
      .limit(100) // Limit results to prevent overwhelming the UI
      .sort({ StyleNo: 1 }) // Sort alphabetically
      .exec();

    // Extract unique StyleNo values
    const uniqueMONos = [...new Set(results.map((r) => r.StyleNo))];

    res.json(uniqueMONos);
  } catch (err) {
    console.error("Error fetching MO numbers from cuttingOrders:", err);
    res.status(500).json({
      message: "Failed to fetch MO numbers from cuttingOrders",
      error: err.message
    });
  }
});

// Endpoint to Fetch Cutting Order Details for a given MO No (StyleNo)
app.get("/api/cutting-orders-details", async (req, res) => {
  try {
    const styleNo = req.query.styleNo;
    if (!styleNo) {
      return res.status(400).json({ error: "StyleNo is required" });
    }

    // Find all documents where StyleNo matches
    const documents = await CuttingOrders.find({ StyleNo: styleNo }).exec();

    if (documents.length === 0) {
      console.log(`No documents found for StyleNo: ${styleNo}`);
      return res.status(404).json({ error: "MO No not found" });
    }

    res.json(documents);
  } catch (err) {
    console.error("Error fetching Cutting Orders details:", err);
    res.status(500).json({
      message: "Failed to fetch Cutting Orders details",
      error: err.message
    });
  }
});

app.get("/api/cutting-orders-sizes", async (req, res) => {
  try {
    const { styleNo, color, tableNo } = req.query;

    if (!styleNo || !color || !tableNo) {
      return res
        .status(400)
        .json({ error: "styleNo, color, and tableNo are required" });
    }

    // Find the document matching the styleNo and color
    const document = await CuttingOrders.findOne({
      StyleNo: styleNo,
      EngColor: color
    }).exec();

    if (!document) {
      return res
        .status(404)
        .json({ error: "Document not found for the given styleNo and color" });
    }

    // Find the cuttingData entry matching the tableNo
    const cuttingDataEntry = document.cuttingData.find(
      (cd) => cd.tableNo === tableNo
    );

    if (!cuttingDataEntry) {
      return res
        .status(404)
        .json({ error: "Table number not found in cuttingData" });
    }

    // Extract sizes from markerData, filter out null/empty sizes, and sort by no
    const sizes = cuttingDataEntry.markerData
      .filter((md) => md.size && md.size.trim() !== "" && md.size !== "0") // Exclude null or empty sizes
      .map((md) => ({ no: md.no, size: md.size })) // Map to { no, size }
      .sort((a, b) => a.no - b.no) // Sort by no
      .map((md) => md.size); // Extract only the size values

    // Remove duplicates
    const uniqueSizes = [...new Set(sizes)];

    res.json(uniqueSizes);
  } catch (err) {
    console.error("Error fetching sizes from cuttingOrders:", err);
    res.status(500).json({
      message: "Failed to fetch sizes from cuttingOrders",
      error: err.message
    });
  }
});

/* ------------------------------
   Graceful Shutdown
------------------------------ */

process.on("SIGINT", async () => {
  try {
    await poolYMDataStore.close();
    await poolYMCE.close();
    await poolYMWHSYS2.close();
    console.log("SQL connection pools closed.");
  } catch (err) {
    console.error("Error closing SQL connection pools:", err);
  } finally {
    process.exit(0);
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ------------------------------
   End Points - dt_orders
------------------------------ */

// Update the MONo search endpoint to handle partial matching
app.get("/api/search-mono", async (req, res) => {
  try {
    const term = req.query.term; // Changed from 'digits' to 'term'
    if (!term) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const collection = ymEcoConnection.db.collection("dt_orders");

    // Use a case-insensitive regex to match the term anywhere in Order_No
    const regexPattern = new RegExp(term, "i");

    const results = await collection
      .find({
        Order_No: { $regex: regexPattern }
      })
      .project({ Order_No: 1, _id: 0 }) // Only return Order_No field
      .limit(100) // Limit results to prevent overwhelming the UI
      .toArray();

    // Extract unique Order_No values
    const uniqueMONos = [...new Set(results.map((r) => r.Order_No))];

    res.json(uniqueMONos);
  } catch (error) {
    console.error("Error searching MONo:", error);
    res.status(500).json({ error: "Failed to search MONo" });
  }
});

// Update /api/order-details endpoint
app.get("/api/order-details/:mono", async (req, res) => {
  try {
    const collection = ymEcoConnection.db.collection("dt_orders");
    const order = await collection.findOne({
      Order_No: req.params.mono
    });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorMap = new Map();
    order.OrderColors.forEach((colorObj) => {
      const colorKey = colorObj.Color.toLowerCase().trim();
      const originalColor = colorObj.Color.trim();

      if (!colorMap.has(colorKey)) {
        colorMap.set(colorKey, {
          originalColor,
          colorCode: colorObj.ColorCode,
          chnColor: colorObj.ChnColor,
          colorKey: colorObj.ColorKey,
          sizes: new Map()
        });
      }

      colorObj.OrderQty.forEach((sizeEntry) => {
        const sizeName = Object.keys(sizeEntry)[0];
        const quantity = sizeEntry[sizeName];
        const cleanSize = sizeName.split(";")[0].trim();

        if (quantity > 0) {
          colorMap.get(colorKey).sizes.set(cleanSize, {
            orderQty: quantity,
            planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
          });
        }
      });
    });

    const response = {
      engName: order.EngName,
      totalQty: order.TotalQty,
      factoryname: order.Factory || "N/A",
      custStyle: order.CustStyle || "N/A",
      country: order.Country || "N/A",
      colors: Array.from(colorMap.values()).map((c) => ({
        original: c.originalColor,
        code: c.colorCode,
        chn: c.chnColor,
        key: c.colorKey
      })),
      colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
        acc[curr.originalColor.toLowerCase()] = {
          sizes: Array.from(curr.sizes.keys()),
          details: Array.from(curr.sizes.entries()).map(([size, data]) => ({
            size,
            orderQty: data.orderQty,
            planCutQty: data.planCutQty
          }))
        };
        return acc;
      }, {})
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order details" });
  }
});

// Update /api/order-sizes endpoint
app.get("/api/order-sizes/:mono/:color", async (req, res) => {
  try {
    const collection = ymEcoConnection.db.collection("dt_orders");
    const order = await collection.findOne({ Order_No: req.params.mono });

    if (!order) return res.status(404).json({ error: "Order not found" });

    const colorObj = order.OrderColors.find(
      (c) => c.Color.toLowerCase() === req.params.color.toLowerCase().trim()
    );

    if (!colorObj) return res.json([]);

    const sizesWithDetails = colorObj.OrderQty.filter(
      (entry) => entry[Object.keys(entry)[0]] > 0
    )
      .map((entry) => {
        const sizeName = Object.keys(entry)[0];
        const cleanSize = sizeName.split(";")[0].trim();
        return {
          size: cleanSize,
          orderQty: entry[sizeName],
          planCutQty: colorObj.CutQty?.[sizeName]?.PlanCutQty || 0
        };
      })
      .filter((v, i, a) => a.findIndex((t) => t.size === v.size) === i);

    res.json(sizesWithDetails);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch sizes" });
  }
});

// Bundle Qty Endpoint
app.get("/api/total-bundle-qty/:mono", async (req, res) => {
  try {
    const mono = req.params.mono;
    const total = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono } }, // Match documents with the given MONo
      {
        $group: {
          _id: null, // Group all matched documents
          total: { $sum: "$totalBundleQty" } // Correct sum using field reference with $
        }
      }
    ]);
    res.json({ total: total[0]?.total || 0 }); // Return the summed total or 0 if no documents
  } catch (error) {
    console.error("Error fetching total bundle quantity:", error);
    res.status(500).json({ error: "Failed to fetch total bundle quantity" });
  }
});

// Endpoint to get total garments count for a specific MONo, Color, and Size
app.get("/api/total-garments-count/:mono/:color/:size", async (req, res) => {
  try {
    const { mono, color, size } = req.params;

    const totalCount = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono, color: color, size: size } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: "$count" } // Sum the count field
        }
      }
    ]);

    res.json({ totalCount: totalCount[0]?.totalCount || 0 }); // Return total count or 0
  } catch (error) {
    console.error("Error fetching total garments count:", error);
    res.status(500).json({ error: "Failed to fetch total garments count" });
  }
});

// This endpoint is unused
async function fetchOrderDetails(mono) {
  const collection = ymEcoConnection.db.collection("dt_orders");
  const order = await collection.findOne({ Order_No: mono });

  const colorMap = new Map();
  order.OrderColors.forEach((c) => {
    const key = c.Color.toLowerCase().trim();
    if (!colorMap.has(key)) {
      colorMap.set(key, {
        originalColor: c.Color.trim(),
        sizes: new Map()
      });
    }

    c.OrderQty.forEach((q) => {
      if (q.Quantity > 0) {
        const sizeParts = q.Size.split(";");
        const cleanSize = sizeParts[0].trim();
        const sizeKey = cleanSize.toLowerCase();
        if (!colorMap.get(key).sizes.has(sizeKey)) {
          colorMap.get(key).sizes.set(sizeKey, cleanSize);
        }
      }
    });
  });

  return {
    engName: order.EngName,
    totalQty: order.TotalQty,
    colors: Array.from(colorMap.values()).map((c) => c.originalColor),
    colorSizeMap: Array.from(colorMap.values()).reduce((acc, curr) => {
      acc[curr.originalColor.toLowerCase()] = Array.from(curr.sizes.values());
      return acc;
    }, {})
  };
}

/* ------------------------------
   End Points - qc2_orderdata
------------------------------ */

// Generate a random ID for the bundle
const generateRandomId = async () => {
  let randomId;
  let isUnique = false;

  while (!isUnique) {
    randomId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const existing = await QC2OrderData.findOne({ bundle_random_id: randomId });
    if (!existing) isUnique = true;
  }

  return randomId;
};

// Save bundle data to MongoDB
app.post("/api/save-bundle-data", async (req, res) => {
  try {
    const { bundleData } = req.body;
    const savedRecords = [];

    // Save each bundle record
    for (const bundle of bundleData) {
      // Get current package number for this MONo-Color-Size combination
      const packageCount = await QC2OrderData.countDocuments({
        selectedMono: bundle.selectedMono
        //color: bundle.color,
        //size: bundle.size,
      });

      const randomId = await generateRandomId();

      const now = new Date();

      // Format timestamps
      const updated_date_seperator = now.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric"
      });

      const updated_time_seperator = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });

      const newBundle = new QC2OrderData({
        ...bundle,
        package_no: packageCount + 1,
        bundle_random_id: randomId,
        factory: bundle.factory || "N/A", // Handle null factory
        custStyle: bundle.custStyle || "N/A", // Handle null custStyle
        country: bundle.country || "N/A", // Handle null country
        department: bundle.department,
        sub_con: bundle.sub_con || "No",
        sub_con_factory:
          bundle.sub_con === "Yes" ? bundle.sub_con_factory || "" : "N/A",
        updated_date_seperator,
        updated_time_seperator,
        // Ensure user fields are included
        emp_id: bundle.emp_id,
        eng_name: bundle.eng_name,
        kh_name: bundle.kh_name || "",
        job_title: bundle.job_title || "",
        dept_name: bundle.dept_name,
        sect_name: bundle.sect_name || ""
      });
      await newBundle.save();
      savedRecords.push(newBundle);
    }
    // const savedRecords = await QC2OrderData.insertMany(bundleData);

    res.status(201).json({
      message: "Bundle data saved successfully",
      data: savedRecords
    });
  } catch (error) {
    console.error("Error saving bundle data:", error);
    res.status(500).json({
      message: "Failed to save bundle data",
      error: error.message
    });
  }
});

/* ------------------------------
   Bundle Registration Data Edit
------------------------------ */

app.put("/api/update-bundle-data/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedOrder = await QC2OrderData.findByIdAndUpdate(id, updateData, {
      new: true
    });
    if (!updatedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }
    res.send(updatedOrder);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

//For Data tab display records in a table
app.get("/api/user-batches", async (req, res) => {
  try {
    const { emp_id } = req.query;
    if (!emp_id) {
      return res.status(400).json({ message: "emp_id is required" });
    }
    const batches = await QC2OrderData.find({ emp_id });
    res.json(batches);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user batches" });
  }
});

/* ------------------------------
   End Points - Reprint - qc2_orderdata
------------------------------ */

// Combined search endpoint for MONo, Package No, and Emp ID from qc2_orderdata
app.get("/api/reprint-search", async (req, res) => {
  try {
    const { mono, packageNo, empId } = req.query;

    // Build the query dynamically based on provided parameters
    const query = {};
    if (mono) {
      query.selectedMono = { $regex: mono, $options: "i" }; // Case-insensitive partial match
    }
    if (packageNo) {
      const packageNoInt = parseInt(packageNo);
      if (!isNaN(packageNoInt)) {
        query.package_no = packageNoInt; // Exact match for integer
      }
    }
    if (empId) {
      query.emp_id = { $regex: empId, $options: "i" }; // Case-insensitive partial match
    }

    // Fetch matching records from qc2_orderdata
    const records = await QC2OrderData.find(query)
      .sort({ package_no: 1 }) // Sort by package_no ascending
      .limit(100); // Limit to prevent overload

    res.json(records);
  } catch (error) {
    console.error("Error searching qc2_orderdata:", error);
    res.status(500).json({ error: "Failed to search records" });
  }
});

// Fetch colors and sizes for a specific MONo (unchanged)
app.get("/api/reprint-colors-sizes/:mono", async (req, res) => {
  try {
    const mono = req.params.mono;
    const result = await QC2OrderData.aggregate([
      { $match: { selectedMono: mono } },
      {
        $group: {
          _id: {
            color: "$color",
            size: "$size"
          },
          colorCode: { $first: "$colorCode" },
          chnColor: { $first: "$chnColor" },
          package_no: { $first: "$package_no" }
        }
      },
      {
        $group: {
          _id: "$_id.color",
          sizes: { $push: "$_id.size" },
          colorCode: { $first: "$colorCode" },
          chnColor: { $first: "$chnColor" }
        }
      }
    ]);

    const colors = result.map((c) => ({
      color: c._id,
      sizes: c.sizes,
      colorCode: c.colorCode,
      chnColor: c.chnColor
    }));

    res.json(colors);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch colors/sizes" });
  }
});

/* ------------------------------
   End Points - Ironing
------------------------------ */

// New Endpoint to Get Bundle by Random ID
app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const bundle = await QC2OrderData.findOne({
      bundle_random_id: req.params.randomId
    });

    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json(bundle);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({ error: "Failed to fetch bundle" });
  }
});

// Check if bundle_id already exists and get the largest number
app.post("/api/check-bundle-id", async (req, res) => {
  try {
    const { date, lineNo, selectedMono, color, size } = req.body;

    // Find all bundle IDs matching the criteria
    const existingBundles = await QC2OrderData.find({
      bundle_id: {
        $regex: `^${date}:${lineNo}:${selectedMono}:${color}:${size}`
      }
    });

    // Extract the largest number from the bundle IDs
    let largestNumber = 0;
    existingBundles.forEach((bundle) => {
      const parts = bundle.bundle_id.split(":");
      const number = parseInt(parts[parts.length - 1]);
      if (number > largestNumber) {
        largestNumber = number;
      }
    });

    res.status(200).json({ largestNumber });
  } catch (error) {
    console.error("Error checking bundle ID:", error);
    res.status(500).json({
      message: "Failed to check bundle ID",
      error: error.message
    });
  }
});

// Check if ironing record exists
app.get("/api/check-ironing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Ironing.findOne({
      ironing_bundle_id: req.params.bundleId
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

// New endpoint to get the last ironing record ID for a specific emp_id
app.get("/api/last-ironing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Ironing.findOne(
      { emp_id_ironing: emp_id }, // Filter by emp_id_ironing
      {},
      { sort: { ironing_record_id: -1 } } // Sort descending to get the highest ID
    );
    const lastRecordId = lastRecord ? lastRecord.ironing_record_id : 0; // Start at 0 if no records exist
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last ironing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last ironing record ID" });
  }
});

// Modified endpoint to fetch defect card data with logging
app.get("/api/check-defect-card/:defectPrintId", async (req, res) => {
  try {
    const { defectPrintId } = req.params;
    //console.log(`Searching for defect_print_id: "${defectPrintId}"`); // Debug log

    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false
    });
    if (!defectRecord) {
      console.log(
        `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
      );
      return res.status(404).json({ message: "Defect card not found" });
    }

    const printData = defectRecord.printArray.find(
      (item) => item.defect_print_id === defectPrintId
    );
    if (!printData) {
      console.log(
        `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
      );
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }

    const formattedData = {
      defect_print_id: printData.defect_print_id,
      totalRejectGarmentCount: printData.totalRejectGarmentCount,
      package_no: defectRecord.package_no, // Include package_no
      moNo: defectRecord.moNo,
      selectedMono: defectRecord.moNo,
      custStyle: defectRecord.custStyle,
      buyer: defectRecord.buyer,
      color: defectRecord.color,
      size: defectRecord.size,
      factory: defectRecord.factory,
      country: defectRecord.country,
      lineNo: defectRecord.lineNo,
      department: defectRecord.department,
      count: defectRecord.checkedQty,
      emp_id_inspection: defectRecord.emp_id_inspection,
      inspection_date: defectRecord.inspection_date,
      inspection_time: defectRecord.inspection_time,
      sub_con: defectRecord.sub_con,
      sub_con_factory: defectRecord.sub_con_factory,
      bundle_id: defectRecord.bundle_id,
      bundle_random_id: defectRecord.bundle_random_id
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card:", error);
    res.status(500).json({ message: error.message });
  }
});

// Save ironing record
app.post("/api/save-ironing", async (req, res) => {
  try {
    const newRecord = new Ironing(req.body);
    await newRecord.save();
    res.status(201).json({ message: "Record saved successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Duplicate record found" });
    } else {
      res.status(500).json({ error: "Failed to save record" });
    }
  }
});

// For Data tab display records in a table
app.get("/api/ironing-records", async (req, res) => {
  try {
    const records = await Ironing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ironing records" });
  }
});

/* ------------------------------
   End Points - Washing
------------------------------ */

app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const bundle = await QC2OrderData.findOne({
      bundle_random_id: req.params.randomId
    });
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }
    res.json(bundle);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({ error: "Failed to fetch bundle" });
  }
});

app.get("/api/check-washing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Washing.findOne({
      washing_bundle_id: req.params.bundleId
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

app.get("/api/check-defect-card-washing/:defectPrintId", async (req, res) => {
  try {
    const { defectPrintId } = req.params;
    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false
    });
    if (!defectRecord) {
      console.log(
        `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
      );
      return res.status(404).json({ message: "Defect card not found" });
    }
    const printData = defectRecord.printArray.find(
      (item) => item.defect_print_id === defectPrintId
    );
    if (!printData) {
      console.log(
        `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
      );
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }
    const formattedData = {
      defect_print_id: printData.defect_print_id,
      totalRejectGarmentCount: printData.totalRejectGarmentCount,
      package_no: defectRecord.package_no,
      moNo: defectRecord.moNo,
      selectedMono: defectRecord.moNo,
      custStyle: defectRecord.custStyle,
      buyer: defectRecord.buyer,
      color: defectRecord.color,
      size: defectRecord.size,
      factory: defectRecord.factory,
      country: defectRecord.country,
      lineNo: defectRecord.lineNo,
      department: defectRecord.department,
      count: defectRecord.checkedQty,
      emp_id_inspection: defectRecord.emp_id_inspection,
      inspection_date: defectRecord.inspection_date,
      inspection_time: defectRecord.inspection_time,
      sub_con: defectRecord.sub_con,
      sub_con_factory: defectRecord.sub_con_factory,
      bundle_id: defectRecord.bundle_id,
      bundle_random_id: defectRecord.bundle_random_id
    };
    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card for washing:", error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/last-washing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Washing.findOne(
      { emp_id_washing: emp_id },
      {},
      { sort: { washing_record_id: -1 } }
    );
    const lastRecordId = lastRecord ? lastRecord.washing_record_id : 0;
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last washing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last washing record ID" });
  }
});

app.post("/api/save-washing", async (req, res) => {
  try {
    const newRecord = new Washing(req.body);
    await newRecord.save();
    res.status(201).json({ message: "Record saved successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Duplicate record found" });
    } else {
      res.status(500).json({ error: "Failed to save record" });
    }
  }
});

app.get("/api/washing-records", async (req, res) => {
  try {
    const records = await Washing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch washing records" });
  }
});

/* ------------------------------
   End Points - OPA
------------------------------ */

app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const bundle = await QC2OrderData.findOne({
      bundle_random_id: req.params.randomId
    });
    if (!bundle) {
      return res.status(404).json({ error: "Bundle not found" });
    }
    res.json(bundle);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({ error: "Failed to fetch bundle" });
  }
});

app.get("/api/check-opa-exists/:bundleId", async (req, res) => {
  try {
    const record = await OPA.findOne({
      opa_bundle_id: req.params.bundleId
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

app.get("/api/check-defect-card-opa/:defectPrintId", async (req, res) => {
  try {
    const { defectPrintId } = req.params;
    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false
    });
    if (!defectRecord) {
      console.log(
        `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
      );
      return res.status(404).json({ message: "Defect card not found" });
    }
    const printData = defectRecord.printArray.find(
      (item) => item.defect_print_id === defectPrintId
    );
    if (!printData) {
      console.log(
        `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
      );
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }
    const formattedData = {
      defect_print_id: printData.defect_print_id,
      totalRejectGarmentCount: printData.totalRejectGarmentCount,
      package_no: defectRecord.package_no,
      moNo: defectRecord.moNo,
      selectedMono: defectRecord.moNo,
      custStyle: defectRecord.custStyle,
      buyer: defectRecord.buyer,
      color: defectRecord.color,
      size: defectRecord.size,
      factory: defectRecord.factory,
      country: defectRecord.country,
      lineNo: defectRecord.lineNo,
      department: defectRecord.department,
      count: defectRecord.checkedQty,
      emp_id_inspection: defectRecord.emp_id_inspection,
      inspection_date: defectRecord.inspection_date,
      inspection_time: defectRecord.inspection_time,
      sub_con: defectRecord.sub_con,
      sub_con_factory: defectRecord.sub_con_factory,
      bundle_id: defectRecord.bundle_id,
      bundle_random_id: defectRecord.bundle_random_id
    };
    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card for OPA:", error);
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/last-opa-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await OPA.findOne(
      { emp_id_opa: emp_id },
      {},
      { sort: { opa_record_id: -1 } }
    );
    const lastRecordId = lastRecord ? lastRecord.opa_record_id : 0;
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last OPA record ID:", error);
    res.status(500).json({ error: "Failed to fetch last OPA record ID" });
  }
});

app.post("/api/save-opa", async (req, res) => {
  try {
    const newRecord = new OPA(req.body);
    await newRecord.save();
    res.status(201).json({ message: "Record saved successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Duplicate record found" });
    } else {
      res.status(500).json({ error: "Failed to save record" });
    }
  }
});

app.get("/api/opa-records", async (req, res) => {
  try {
    const records = await OPA.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch OPA records" });
  }
});

// /* ------------------------------
//    End Points - Packing
// ------------------------------ */

// New Endpoint to Get Bundle by Random ID (from qc2_inspection_pass_bundle for order cards)
app.get("/api/bundle-by-random-id/:randomId", async (req, res) => {
  try {
    const randomId = req.params.randomId.trim(); // Trim to avoid whitespace issues
    console.log("Searching for bundle_random_id:", randomId);

    // First, check qc2_inspection_pass_bundle for order card
    const bundle = await QC2InspectionPassBundle.findOne({
      bundle_random_id: randomId,
      "printArray.isCompleted": false // Ensure bundle is not completed
    });

    if (!bundle) {
      return res
        .status(404)
        .json({ error: "This bundle has not been inspected yet" });
    }

    // Use the first printArray entry (assuming one bundle_random_id per document for simplicity)
    const printData = bundle.printArray.find(
      (item) => item.isCompleted === false
    );
    if (!printData) {
      return res
        .status(404)
        .json({ error: "No active print data found for this bundle" });
    }

    const formattedData = {
      bundle_id: bundle.bundle_id,
      bundle_random_id: bundle.bundle_random_id,
      package_no: bundle.package_no, // Include package_no
      moNo: bundle.moNo,
      selectedMono: bundle.moNo,
      custStyle: bundle.custStyle,
      buyer: bundle.buyer,
      color: bundle.color,
      size: bundle.size,
      factory: bundle.factory || "N/A",
      country: bundle.country || "N/A",
      lineNo: bundle.lineNo,
      department: bundle.department,
      count: bundle.totalPass, // Use totalPass as checkedQty for order cards
      totalBundleQty: 1, // Set hardcoded as 1 for order card
      emp_id_inspection: bundle.emp_id_inspection,
      inspection_date: bundle.inspection_date,
      inspection_time: bundle.inspection_time,
      sub_con: bundle.sub_con,
      sub_con_factory: bundle.sub_con_factory
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching bundle:", error);
    res.status(500).json({ error: "Failed to fetch bundle" });
  }
});

// Check if Packing record exists (updated for task_no 62)
app.get("/api/check-packing-exists/:bundleId", async (req, res) => {
  try {
    const record = await Packing.findOne({
      packing_bundle_id: req.params.bundleId // No change needed here, but ensure it matches task_no 62 in Packing.jsx
    });
    res.json({ exists: !!record });
  } catch (error) {
    res.status(500).json({ error: "Error checking record" });
  }
});

// New endpoint to get the last Packing record ID for a specific emp_id (no change needed)
app.get("/api/last-packing-record-id/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const lastRecord = await Packing.findOne(
      { emp_id_packing: emp_id }, // Filter by emp_id_packing
      {},
      { sort: { packing_record_id: -1 } } // Sort descending to get the highest ID
    );
    const lastRecordId = lastRecord ? lastRecord.packing_record_id : 0; // Start at 0 if no records exist
    res.json({ lastRecordId });
  } catch (error) {
    console.error("Error fetching last Packing record ID:", error);
    res.status(500).json({ error: "Failed to fetch last Packing record ID" });
  }
});

// Modified endpoint to fetch defect card data from qc2_inspection_pass_bundle with defect_print_id (updated for task_no 62)
app.get("/api/check-defect-card/:defectPrintId", async (req, res) => {
  try {
    const { defectPrintId } = req.params;
    console.log(`Searching for defect_print_id: "${defectPrintId}"`); // Debug log

    const defectRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defectPrintId,
      "printArray.isCompleted": false
    });

    if (!defectRecord) {
      console.log(
        `No record found for defect_print_id: "${defectPrintId}" with isCompleted: false`
      );
      return res.status(404).json({ message: "Defect card not found" });
    }

    const printData = defectRecord.printArray.find(
      (item) => item.defect_print_id === defectPrintId
    );
    if (!printData) {
      console.log(
        `printData not found for defect_print_id: "${defectPrintId}" in document: ${defectRecord._id}`
      );
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }

    const formattedData = {
      defect_print_id: printData.defect_print_id,
      totalRejectGarmentCount: printData.totalRejectGarmentCount,
      totalRejectGarment_Var: printData.totalRejectGarment_Var, // Use totalRejectGarment_Var for defect cards
      package_no: defectRecord.package_no, // Include package_no
      moNo: defectRecord.moNo,
      selectedMono: defectRecord.moNo,
      custStyle: defectRecord.custStyle,
      buyer: defectRecord.buyer,
      color: defectRecord.color,
      size: defectRecord.size,
      factory: defectRecord.factory,
      country: defectRecord.country,
      lineNo: defectRecord.lineNo,
      department: defectRecord.department,
      count: printData.totalRejectGarment_Var, // Use totalRejectGarment_Var as count for defect cards
      totalBundleQty: 1, // Set hardcoded as 1 for defect card
      emp_id_inspection: defectRecord.emp_id_inspection,
      inspection_date: defectRecord.inspection_date,
      inspection_time: defectRecord.inspection_time,
      sub_con: defectRecord.sub_con,
      sub_con_factory: defectRecord.sub_con_factory,
      bundle_id: defectRecord.bundle_id,
      bundle_random_id: defectRecord.bundle_random_id
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error checking defect card:", error);
    res.status(500).json({ message: error.message });
  }
});

// Save Packing record (no change needed, but ensure task_no is 62 in Packing.jsx)
app.post("/api/save-packing", async (req, res) => {
  try {
    const newRecord = new Packing(req.body);
    await newRecord.save();
    res.status(201).json({ message: "Record saved successfully" });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: "Duplicate record found" });
    } else {
      res.status(500).json({ error: "Failed to save record" });
    }
  }
});

//For Data tab display records in a table (no change needed)
app.get("/api/packing-records", async (req, res) => {
  try {
    const records = await Packing.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch Packing records" });
  }
});

/* ------------------------------
  PUT Endpoints - Update QC2 Order Data
------------------------------ */

app.put("/api/update-qc2-orderdata/:bundleId", async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { inspectionType, process, data } = req.body;

    if (!["first", "defect"].includes(inspectionType)) {
      return res.status(400).json({ error: "Invalid inspection type" });
    }

    const updateField =
      inspectionType === "first" ? "inspectionFirst" : "inspectionDefect";
    const updateOperation = {
      $push: {
        [updateField]: {
          process,
          ...data
        }
      }
    };

    // For defect scans, ensure defect_print_id is provided
    if (inspectionType === "defect" && !data.defect_print_id) {
      return res
        .status(400)
        .json({ error: "defect_print_id is required for defect scans" });
    }

    const updatedRecord = await QC2OrderData.findOneAndUpdate(
      { bundle_id: bundleId },
      updateOperation,
      { new: true, upsert: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ error: "Bundle not found" });
    }

    res.json({ message: "Record updated successfully", data: updatedRecord });
  } catch (error) {
    console.error("Error updating qc2_orderdata:", error);
    res
      .status(500)
      .json({ error: "Failed to update record", details: error.message });
  }
});

/* ------------------------------
   End Points - Live Dashboard - QC1
------------------------------ */

app.get("/api/dashboard-stats", async (req, res) => {
  try {
    const { factory, lineNo, moNo, customer, timeInterval = "1" } = req.query;
    let matchQuery = {};

    // Apply filters if provided
    if (factory) matchQuery["headerData.factory"] = factory;
    if (lineNo) matchQuery["headerData.lineNo"] = lineNo;
    if (moNo) matchQuery["headerData.moNo"] = moNo;
    if (customer) matchQuery["headerData.customer"] = customer;

    // Get unique filter values
    const filterValues = await QCData.aggregate([
      {
        $group: {
          _id: null,
          factories: { $addToSet: "$headerData.factory" },
          lineNos: { $addToSet: "$headerData.lineNo" },
          moNos: { $addToSet: "$headerData.moNo" },
          customers: { $addToSet: "$headerData.customer" }
        }
      }
    ]);

    // Get overall stats
    const stats = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
          totalDefectPieces: { $sum: "$defectPieces" },
          totalReturnDefectQty: { $sum: "$returnDefectQty" },
          totalGoodOutput: { $sum: "$goodOutput" },
          latestDefectArray: { $last: "$defectArray" },
          latestHeaderData: { $last: "$headerData" }
        }
      }
    ]);

    // Get defect rate by line
    const defectRateByLine = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.lineNo",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          lineNo: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ]);

    // Get defect rate by MO
    const defectRateByMO = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.moNo",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          moNo: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ]);

    // Get defect rate by customer
    const defectRateByCustomer = await QCData.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$headerData.customer",
          checkedQty: { $sum: "$checkedQty" },
          defectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          customer: "$_id",
          defectRate: {
            $multiply: [
              { $divide: ["$defectQty", { $max: ["$checkedQty", 1] }] },
              100
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ]);

    // Get the latest record with defect array to get accurate defect counts
    const topDefects = await QCData.aggregate([
      { $match: matchQuery },
      { $unwind: "$defectArray" },
      {
        $group: {
          _id: "$defectArray.name",
          count: { $sum: "$defectArray.count" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // In server.js, replace the timeSeriesData aggregation with:
    const timeSeriesData = await QCData.aggregate([
      { $match: matchQuery },
      {
        $addFields: {
          timeComponents: {
            $let: {
              vars: {
                timeParts: { $split: ["$formattedTimestamp", ":"] }
              },
              in: {
                hours: { $toInt: { $arrayElemAt: ["$$timeParts", 0] } },
                minutes: { $toInt: { $arrayElemAt: ["$$timeParts", 1] } },
                seconds: { $toInt: { $arrayElemAt: ["$$timeParts", 2] } }
              }
            }
          }
        }
      },
      {
        $addFields: {
          totalMinutes: {
            $add: [
              { $multiply: ["$timeComponents.hours", 60] },
              "$timeComponents.minutes"
            ]
          }
        }
      },
      {
        $sort: { timestamp: 1 }
      },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                {
                  case: { $eq: [parseInt(timeInterval), 1] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 1] } },
                      1
                    ]
                  }
                },
                {
                  case: { $eq: [parseInt(timeInterval), 15] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 15] } },
                      15
                    ]
                  }
                },
                {
                  case: { $eq: [parseInt(timeInterval), 30] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 30] } },
                      30
                    ]
                  }
                },
                {
                  case: { $eq: [parseInt(timeInterval), 60] },
                  then: {
                    $multiply: [
                      { $floor: { $divide: ["$totalMinutes", 60] } },
                      60
                    ]
                  }
                }
              ],
              default: "$totalMinutes"
            }
          },
          // Use last record for the time period to get cumulative values
          cumulativeChecked: { $last: "$cumulativeChecked" },
          cumulativeDefects: { $last: "$cumulativeDefects" }
        }
      },
      {
        $project: {
          timestamp: {
            $switch: {
              branches: [
                {
                  case: { $eq: [parseInt(timeInterval), 60] },
                  then: { $toString: { $divide: ["$_id", 60] } }
                }
              ],
              default: { $toString: "$_id" }
            }
          },
          checkedQty: "$cumulativeChecked",
          defectQty: "$cumulativeDefects",
          defectRate: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      "$cumulativeDefects",
                      { $max: ["$cumulativeChecked", 1] }
                    ]
                  },
                  100
                ]
              },
              2
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dashboardData = stats[0] || {
      totalCheckedQty: 0,
      totalDefectQty: 0,
      totalDefectPieces: 0,
      totalReturnDefectQty: 0,
      totalGoodOutput: 0,
      latestHeaderData: {}
    };

    const totalInspected = dashboardData.totalCheckedQty || 0;

    res.json({
      filters: filterValues[0] || {
        factories: [],
        lineNos: [],
        moNos: [],
        customers: []
      },
      headerInfo: dashboardData.latestHeaderData,
      stats: {
        checkedQty: dashboardData.totalCheckedQty || 0,
        defectQty: dashboardData.totalDefectQty || 0,
        defectPieces: dashboardData.totalDefectPieces || 0,
        returnDefectQty: dashboardData.totalReturnDefectQty || 0,
        goodOutput: dashboardData.totalGoodOutput || 0,
        defectRate: totalInspected
          ? ((dashboardData.totalDefectQty / totalInspected) * 100).toFixed(2)
          : 0,
        defectRatio: totalInspected
          ? ((dashboardData.totalDefectPieces / totalInspected) * 100).toFixed(
              2
            )
          : 0
      },
      defectRateByLine,
      defectRateByMO,
      defectRateByCustomer,
      topDefects,
      timeSeriesData
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

/* ------------------------------
   End Points - QC1
------------------------------ */

app.post("/api/save-qc-data", async (req, res) => {
  try {
    // Sanitize defectDetails
    const sanitizedDefects = (req.body.defectDetails || []).map((defect) => ({
      name: defect.name.toString().trim(),
      count: Math.abs(parseInt(defect.count)) || 0
    }));
    const sanitizedData = {
      ...req.body,
      defectArray: sanitizedDefects,
      headerData: {
        ...req.body.headerData,
        date: req.body.headerData.date
          ? new Date(req.body.headerData.date).toISOString()
          : undefined
      }
    };

    const qcData = new QCData(sanitizedData);
    const savedData = await qcData.save();

    res.status(201).json({
      message: "QC data saved successfully",
      data: savedData
    });
  } catch (error) {
    console.error("Error saving QC data:", error);
    res.status(500).json({
      message: "Failed to save QC data",
      error: error.message,
      details: error.errors
        ? Object.keys(error.errors).map((key) => ({
            field: key,
            message: error.errors[key].message
          }))
        : undefined
    });
  }
});

/* ------------------------------
   End Points - Download Data
------------------------------ */

// Helper function to format date to MM/DD/YYYY
const formatDate = (date) => {
  const d = new Date(date);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
};

// New endpoint to get unique values for filters
app.get("/api/unique-values", async (req, res) => {
  try {
    const uniqueValues = await QC2OrderData.aggregate([
      {
        $group: {
          _id: null,
          moNos: { $addToSet: "$selectedMono" },
          styleNos: { $addToSet: "$custStyle" },
          lineNos: { $addToSet: "$lineNo" },
          colors: { $addToSet: "$color" },
          sizes: { $addToSet: "$size" },
          buyers: { $addToSet: "$buyer" }
        }
      }
    ]);

    const result = uniqueValues[0] || {
      moNos: [],
      styleNos: [],
      lineNos: [],
      colors: [],
      sizes: [],
      buyers: []
    };

    delete result._id;
    Object.keys(result).forEach((key) => {
      result[key] = result[key].filter(Boolean).sort();
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching unique values:", error);
    res.status(500).json({ error: "Failed to fetch unique values" });
  }
});

// Updated endpoint to get filtered data
app.get("/api/download-data", async (req, res) => {
  try {
    let {
      startDate,
      endDate,
      type,
      taskNo,
      moNo,
      styleNo,
      lineNo,
      color,
      size,
      buyer,
      page = 1,
      limit = 50
    } = req.query;

    // Convert page and limit to numbers
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // Format dates to match the stored format (MM/DD/YYYY)
    if (startDate) {
      startDate = formatDate(new Date(startDate));
    }
    if (endDate) {
      endDate = formatDate(new Date(endDate));
    }

    // Build match query
    const matchQuery = {};

    // Determine collection and date field based on type/taskNo
    const isIroning = type === "Ironing" || taskNo === "53";
    const collection = isIroning ? Ironing : QC2OrderData;
    const dateField = isIroning
      ? "ironing_updated_date"
      : "updated_date_seperator";

    // Date range filter
    if (startDate || endDate) {
      matchQuery[dateField] = {};
      if (startDate) matchQuery[dateField].$gte = startDate;
      if (endDate) matchQuery[dateField].$lte = endDate;
    }

    // Add other filters if they exist
    if (moNo) matchQuery.selectedMono = moNo;
    if (styleNo) matchQuery.custStyle = styleNo;
    if (lineNo) matchQuery.lineNo = lineNo;
    if (color) matchQuery.color = color;
    if (size) matchQuery.size = size;
    if (buyer) matchQuery.buyer = buyer;

    // Add task number filter
    if (taskNo) {
      matchQuery.task_no = parseInt(taskNo);
    }

    console.log("Match Query:", matchQuery); // For debugging

    // Get total count
    const total = await collection.countDocuments(matchQuery);

    // Get paginated data
    const data = await collection
      .find(matchQuery)
      .sort({ [dateField]: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("Found records:", data.length); // For debugging

    // Transform data for consistent response
    const transformedData = data.map((item) => ({
      date: item[dateField],
      type: isIroning ? "Ironing" : "QC2 Order Data",
      taskNo: isIroning ? "53" : "52",
      selectedMono: item.selectedMono,
      custStyle: item.custStyle,
      lineNo: item.lineNo,
      color: item.color,
      size: item.size,
      buyer: item.buyer,
      bundle_id: isIroning ? item.ironing_bundle_id : item.bundle_id,
      factory: item.factory,
      count: item.count
    }));

    res.json({
      data: transformedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching download data:", error);
    res.status(500).json({ error: "Failed to fetch download data" });
  }
});

/* ------------------------------
   QC2 - Inspection Pass Bundle
------------------------------ */

// Socket.io connection handler
io.on("connection", (socket) => {
  //console.log("A client connected:", socket.id);

  socket.on("disconnect", () => {
    //console.log("A client disconnected:", socket.id);
  });
});

// Endpoint to save inspection pass bundle data
app.post("/api/inspection-pass-bundle", async (req, res) => {
  try {
    const {
      package_no,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      buyer,
      factory,
      country,
      sub_con,
      sub_con_factory,
      checkedQty,
      totalPass,
      totalRejects,
      totalRepair,
      defectQty,
      defectArray,
      rejectGarments,
      inspection_time,
      inspection_date,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id,
      printArray
    } = req.body;

    const newRecord = new QC2InspectionPassBundle({
      package_no,
      //bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      buyer: buyer || "N/A",
      factory: factory || "N/A",
      country: country || "N/A",
      sub_con: sub_con || "No",
      sub_con_factory: sub_con_factory || "N/A",
      checkedQty,
      totalPass,
      totalRejects,
      totalRepair: totalRepair || 0,
      defectQty,
      defectArray: defectArray || [],
      rejectGarments: rejectGarments || [],
      inspection_time,
      inspection_date,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id,
      printArray: printArray || []
    });

    await newRecord.save();

    // Emit event to all clients
    io.emit("qc2_data_updated");

    res.status(201).json({
      message: "Inspection pass bundle saved successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("Error saving inspection pass bundle:", error);
    res.status(500).json({
      message: "Failed to save inspection pass bundle",
      error: error.message
    });
  }
});

//Update QC2 inspection records for each of reject garments - PUT endpoint to update inspection records
app.put(
  "/api/qc2-inspection-pass-bundle/:bundle_random_id",
  async (req, res) => {
    try {
      const { bundle_random_id } = req.params;
      const { updateOperations, arrayFilters } = req.body || {};

      let updateData = req.body;
      if (updateOperations) {
        updateData = updateOperations;
      }

      const updateOperationsFinal = {};
      if (updateData.$set) {
        updateOperationsFinal.$set = updateData.$set;
      }
      if (updateData.$push) {
        updateOperationsFinal.$push = updateData.$push;
      }
      if (updateData.$inc) {
        updateOperationsFinal.$inc = updateData.$inc;
      }
      if (!updateData.$set && !updateData.$push && !updateData.$inc) {
        updateOperationsFinal.$set = updateData;
      }

      // Ensure totalRejectGarment_Var remains unchanged when updating printArray
      if (updateOperationsFinal.$set?.printArray) {
        updateOperationsFinal.$set.printArray =
          updateOperationsFinal.$set.printArray.map((printEntry) => ({
            ...printEntry,
            totalRejectGarment_Var:
              printEntry.totalRejectGarment_Var ||
              printEntry.totalRejectGarmentCount
          }));
      }

      const options = {
        new: true,
        runValidators: true
      };
      if (arrayFilters) {
        options.arrayFilters = arrayFilters;
      }

      const updatedRecord = await QC2InspectionPassBundle.findOneAndUpdate(
        { bundle_random_id },
        updateOperationsFinal,
        options
      );

      if (!updatedRecord) {
        return res.status(404).json({ error: "Record not found" });
      }

      // Update qc2_orderdata for qc2InspectionFirst and qc2InspectionDefect
      const qc2OrderDataRecord = await QC2OrderData.findOne({
        bundle_random_id
      });

      // Case 1: Initial inspection completed (inspection_time is set)
      if (
        updateOperationsFinal.$set &&
        updateOperationsFinal.$set.inspection_time
      ) {
        if (qc2OrderDataRecord) {
          // Check if an entry with the same inspection_time, emp_id, and bundle_random_id already exists
          const existingEntry = qc2OrderDataRecord.qc2InspectionFirst.find(
            (entry) =>
              entry.inspectionRecordId === updatedRecord._id.toString() ||
              (entry.updated_date === updatedRecord.inspection_date &&
                entry.update_time === updatedRecord.inspection_time &&
                entry.emp_id === updatedRecord.emp_id_inspection)
          );

          if (!existingEntry) {
            const inspectionFirstEntry = {
              process: "qc2",
              task_no: 100,
              checkedQty: updatedRecord.checkedQty,
              totalPass: updatedRecord.totalPass,
              totalRejects: updatedRecord.totalRejects,
              defectQty: updatedRecord.defectQty,
              defectArray: updatedRecord.defectArray,
              rejectGarments: updatedRecord.rejectGarments.map((rg) => ({
                totalCount: rg.totalCount,
                defects: rg.defects.map((d) => ({
                  name: d.name,
                  count: d.count,
                  repair: d.repair,
                  status: "Fail"
                })),
                garment_defect_id: rg.garment_defect_id,
                rejectTime: rg.rejectTime
              })),
              updated_date: updatedRecord.inspection_date,
              update_time: updatedRecord.inspection_time,
              emp_id: updatedRecord.emp_id_inspection,
              eng_name: updatedRecord.eng_name_inspection,
              kh_name: updatedRecord.kh_name_inspection,
              job_title: updatedRecord.job_title_inspection,
              dept_name: updatedRecord.dept_name_inspection,
              sect_name: updatedRecord.sect_name_inspection,
              inspectionRecordId: updatedRecord._id.toString() // Add unique identifier
            };
            qc2OrderDataRecord.qc2InspectionFirst.push(inspectionFirstEntry);
            await qc2OrderDataRecord.save();
          } else {
            console.log(
              "Duplicate entry detected, skipping push to qc2InspectionFirst"
            );
          }
        }
      }

      // Case 2: Return inspection completed (repairGarmentsDefects is pushed)
      if (
        updateOperationsFinal.$push &&
        updateOperationsFinal.$push[
          "printArray.$[elem].repairGarmentsDefects"
        ] &&
        updateData.sessionData
      ) {
        const sessionData = updateData.sessionData;
        const {
          sessionTotalPass,
          sessionTotalRejects,
          sessionDefectsQty,
          sessionRejectedGarments,
          inspectionNo,
          defect_print_id
        } = sessionData;

        if (qc2OrderDataRecord) {
          const now = new Date();
          const inspectionDefectEntry = {
            process: "qc2",
            task_no: 101,
            defect_print_id,
            inspectionNo,
            checkedQty: sessionTotalPass + sessionTotalRejects,
            totalPass: sessionTotalPass,
            totalRejects: sessionTotalRejects,
            defectQty: sessionDefectsQty,
            // Omit defectArray
            rejectGarments: sessionRejectedGarments.map((rg) => ({
              totalCount: rg.totalDefectCount,
              defects: rg.repairDefectArray.map((d) => ({
                name: d.name,
                count: d.count,
                repair:
                  allDefects.find((def) => def.english === d.name)?.repair ||
                  "Unknown",
                status: "Fail"
              })),
              garment_defect_id: generateGarmentDefectId(),
              rejectTime: now.toLocaleTimeString("en-US", { hour12: false })
            })),
            updated_date: now.toLocaleDateString("en-US"),
            update_time: now.toLocaleTimeString("en-US", { hour12: false }),
            emp_id: updatedRecord.emp_id_inspection,
            eng_name: updatedRecord.eng_name_inspection,
            kh_name: updatedRecord.kh_name_inspection,
            job_title: updatedRecord.job_title_inspection,
            dept_name: updatedRecord.dept_name_inspection,
            sect_name: updatedRecord.sect_name_inspection
          };
          qc2OrderDataRecord.qc2InspectionDefect.push(inspectionDefectEntry);
          await qc2OrderDataRecord.save();
        }
      }

      io.emit("qc2_data_updated");
      res.json({
        message: "Inspection pass bundle updated successfully",
        data: updatedRecord
      });
    } catch (error) {
      console.error("Error updating inspection pass bundle:", error);
      res.status(500).json({
        message: "Failed to update inspection pass bundle",
        error: error.message
      });
    }
  }
);

// // Helper function to generate garment_defect_id
// const generateGarmentDefectId = () => {
//   return Math.floor(1000000000 + Math.random() * 9000000000).toString();
// };

// old endpoint ---
// app.put(
//   "/api/qc2-inspection-pass-bundle/:bundle_random_id",
//   async (req, res) => {
//     try {
//       const { bundle_random_id } = req.params;
//       const { updateOperations, arrayFilters } = req.body || {};

//       let updateData = req.body;
//       if (updateOperations) {
//         updateData = updateOperations;
//       }

//       const updateOperationsFinal = {};
//       if (updateData.$set) {
//         updateOperationsFinal.$set = updateData.$set;
//       }
//       if (updateData.$push) {
//         updateOperationsFinal.$push = updateData.$push;
//       }
//       if (updateData.$inc) {
//         updateOperationsFinal.$inc = updateData.$inc;
//       }
//       if (!updateData.$set && !updateData.$push && !updateData.$inc) {
//         updateOperationsFinal.$set = updateData;
//       }

//       // Ensure totalRejectGarment_Var remains unchanged when updating printArray
//       if (updateOperationsFinal.$set?.printArray) {
//         updateOperationsFinal.$set.printArray =
//           updateOperationsFinal.$set.printArray.map((printEntry) => ({
//             ...printEntry,
//             totalRejectGarment_Var:
//               printEntry.totalRejectGarment_Var ||
//               printEntry.totalRejectGarmentCount // Preserve or initialize
//           }));
//       }

//       const options = {
//         new: true,
//         runValidators: true
//       };
//       if (arrayFilters) {
//         options.arrayFilters = arrayFilters;
//       }

//       const updatedRecord = await QC2InspectionPassBundle.findOneAndUpdate(
//         { bundle_random_id },
//         updateOperationsFinal,
//         options
//       );

//       if (!updatedRecord) {
//         return res.status(404).json({ error: "Record not found" });
//       }

//       io.emit("qc2_data_updated");
//       res.json({
//         message: "Inspection pass bundle updated successfully",
//         data: updatedRecord
//       });
//     } catch (error) {
//       console.error("Error updating inspection pass bundle:", error);
//       res.status(500).json({
//         message: "Failed to update inspection pass bundle",
//         error: error.message
//       });
//     }
//   }
// );

// Filter Pane for Live Dashboard - EndPoints
app.get("/api/qc2-inspection-pass-bundle/filter-options", async (req, res) => {
  try {
    const filterOptions = await QC2InspectionPassBundle.aggregate([
      {
        $group: {
          _id: null,
          moNo: { $addToSet: "$moNo" },
          color: { $addToSet: "$color" },
          size: { $addToSet: "$size" },
          department: { $addToSet: "$department" },
          emp_id_inspection: { $addToSet: "$emp_id_inspection" },
          buyer: { $addToSet: "$buyer" },
          package_no: { $addToSet: "$package_no" }, // Added package_no
          lineNo: { $addToSet: "$lineNo" } // Add Line No
        }
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          color: 1,
          size: 1,
          department: 1,
          emp_id_inspection: 1,
          buyer: 1,
          package_no: 1,
          lineNo: 1 // Include Line No
        }
      }
    ]);

    const result =
      filterOptions.length > 0
        ? filterOptions[0]
        : {
            moNo: [],
            color: [],
            size: [],
            department: [],
            emp_id_inspection: [],
            buyer: [],
            package_no: [],
            lineNo: [] // Include Line No
          };

    Object.keys(result).forEach((key) => {
      result[key] = result[key]
        .filter(Boolean)
        .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b))); // Numeric sort for package_no
      //.sort((a, b) => a.localeCompare(b));
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

app.get("/api/qc2-defect-print/filter-options", async (req, res) => {
  try {
    const filterOptions = await QC2DefectPrint.aggregate([
      {
        $group: {
          _id: null,
          moNo: { $addToSet: "$moNo" },
          package_no: { $addToSet: "$package_no" },
          repair: { $addToSet: "$repair" }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          package_no: 1,
          repair: 1
        }
      }
    ]);
    const result = filterOptions[0] || { moNo: [], package_no: [], repair: [] };
    Object.keys(result).forEach((key) => {
      result[key] = result[key]
        .filter(Boolean)
        .sort((a, b) => (key === "package_no" ? a - b : a.localeCompare(b)));
    });
    res.json(result);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

// New endpoint to fetch by bundle_random_id
app.get(
  "/api/qc2-inspection-pass-bundle-by-random-id/:bundle_random_id",
  async (req, res) => {
    try {
      const { bundle_random_id } = req.params;
      const record = await QC2InspectionPassBundle.findOne({
        bundle_random_id
      });
      if (record) {
        res.json(record);
      } else {
        res.status(404).json({ message: "Record not found" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// New GET endpoint to fetch record by defect_print_id
app.get(
  "/api/qc2-inspection-pass-bundle-by-defect-print-id/:defect_print_id",
  async (req, res) => {
    try {
      const { defect_print_id } = req.params;
      const { includeCompleted } = req.query;

      let query = {
        "printArray.defect_print_id": defect_print_id
      };

      if (includeCompleted !== "true") {
        query["printArray.isCompleted"] = false;
      }

      const record = await QC2InspectionPassBundle.findOne(query);

      if (record) {
        res.json(record);
      } else {
        res
          .status(404)
          .json({ message: "Record not found or already completed" });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Helper function to normalize date strings with leading zeros
const normalizeDateString = (dateStr) => {
  if (!dateStr) return null;
  try {
    const [month, day, year] = dateStr.split("/").map((part) => part.trim());
    if (!month || !day || !year || isNaN(month) || isNaN(day) || isNaN(year)) {
      throw new Error("Invalid date format");
    }
    // Add leading zeros to month and day
    const normalizedMonth = ("0" + parseInt(month, 10)).slice(-2);
    const normalizedDay = ("0" + parseInt(day, 10)).slice(-2);
    return `${normalizedMonth}/${normalizedDay}/${year}`;
  } catch (error) {
    console.error(`Invalid date string: ${dateStr}`, error);
    return null;
  }
};

// Helper function to escape special characters in regex
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escapes . * + ? ^ $ { } ( ) | [ ] \
};

// Helper function to normalize date strings (remove leading zeros for consistency)
// const normalizeDateString = (dateStr) => {
//   if (!dateStr) return null;
//   const [month, day, year] = dateStr.split("/");
//   return `${parseInt(month, 10)}/${parseInt(day, 10)}/${year}`;
// };

// GET endpoint to fetch all inspection records
app.get("/api/qc2-inspection-pass-bundle/search", async (req, res) => {
  try {
    const {
      moNo,
      package_no,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      page = 1,
      limit = 50 // Default to 50 records per page
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (package_no) {
      const packageNoNumber = Number(package_no);
      if (isNaN(packageNoNumber)) {
        return res.status(400).json({ error: "Package No must be a number" });
      }
      match.package_no = packageNoNumber;
    }
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;

    if (startDate || endDate) {
      match.inspection_date = {};
      if (startDate)
        match.inspection_date.$gte = normalizeDateString(startDate);
      if (endDate) match.inspection_date.$lte = normalizeDateString(endDate);
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await QC2InspectionPassBundle.aggregate(pipeline);
    const data = result[0].data || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    console.log("Search result:", { data, total });
    res.json({ data, total });
  } catch (error) {
    console.error("Error searching data cards:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/qc2-defect-print/search", async (req, res) => {
  try {
    const { moNo, package_no, repair, page = 1, limit = 50 } = req.query;
    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (package_no) {
      const packageNoNumber = Number(package_no);
      if (isNaN(packageNoNumber))
        return res.status(400).json({ error: "Package No must be a number" });
      match.package_no = packageNoNumber;
    }
    if (repair) match.repair = { $regex: new RegExp(repair.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await QC2DefectPrint.aggregate(pipeline);
    const data = result[0].data || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ data, total });
  } catch (error) {
    console.error("Error searching defect print cards:", error);
    res.status(500).json({ error: error.message });
  }
});

// Edit the Inspection Data
app.put("/api/qc2-inspection-pass-bundle/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    console.log(`Received request to update record with ID: ${id}`);
    console.log(`Update Data: ${JSON.stringify(updateData)}`);
    const updatedRecord = await QC2InspectionPassBundle.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );
    if (!updatedRecord) {
      console.log(`Record with ID: ${id} not found`);
      return res.status(404).send({ message: "Record not found" });
    }
    console.log(`Record with ID: ${id} updated successfully`);
    res.send(updatedRecord);
  } catch (error) {
    console.error("Error updating record:", error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// Endpoint to get summary data
app.get("/api/qc2-inspection-summary", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo // Add Line No
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    if (lineNo) match.lineNo = lineNo.trim();
    //if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") }; // Add Line No filter

    // Normalize and convert dates to Date objects for proper comparison
    if (startDate || endDate) {
      match.$expr = match.$expr || {}; // Initialize $expr if not present
      match.$expr.$and = match.$expr.$and || [];

      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }
    // if (startDate || endDate) {
    //   match.inspection_date = {};
    //   if (startDate)
    //     match.inspection_date.$gte = normalizeDateString(startDate);
    //   if (endDate) match.inspection_date.$lte = normalizeDateString(endDate);
    // }

    const data = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          checkedQty: { $sum: "$checkedQty" },
          totalPass: { $sum: "$totalPass" },
          totalRejects: { $sum: "$totalRejects" },
          defectsQty: { $sum: "$defectQty" },
          totalBundles: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          checkedQty: 1,
          totalPass: 1,
          totalRejects: 1,
          defectsQty: 1,
          totalBundles: 1,
          defectRate: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$defectsQty", "$checkedQty"] }
            ]
          },
          defectRatio: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$totalRejects", "$checkedQty"] }
            ]
          }
        }
      }
    ]);

    if (data.length > 0) {
      res.json(data[0]);
    } else {
      res.json({
        checkedQty: 0,
        totalPass: 0,
        totalRejects: 0,
        defectsQty: 0,
        totalBundles: 0,
        defectRate: 0,
        defectRatio: 0
      });
    }
  } catch (error) {
    console.error("Error fetching summary data:", error);
    res.status(500).json({ error: "Failed to fetch summary data" });
  }
});

// Endpoint to get summaries per MO No with dynamic grouping

app.get("/api/qc2-mo-summaries", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo,
      groupByDate, // "true" to group by date
      groupByLine, // "true" to group by lineNo
      groupByMO, // "true" to group by moNo
      groupByBuyer, // "true" to group by buyer
      groupByColor, // "true" to group by color
      groupBySize, // "true" to group by size
      groupByWeek // New parameter for weekly grouping
    } = req.query;

    let match = {};

    if (moNo && moNo.trim()) {
      match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    }
    if (emp_id_inspection) {
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    }
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer) {
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    }
    if (lineNo) match.lineNo = lineNo.trim();

    // Normalize and convert dates to Date objects for proper comparison
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];

      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y",
                onError: null // Handle invalid dates gracefully
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y",
                onError: null // Handle invalid dates gracefully
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    // Dynamically build the _id object for grouping based on query params
    const groupBy = {};
    const projectFields = {};

    // Order matters: Week, Date, Line No, MO No, Buyer, Color, Size
    if (groupByWeek === "true") {
      groupBy.weekInfo = {
        $let: {
          vars: {
            parsedDate: {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y",
                onError: null // Return null if date parsing fails
              }
            },
            monday: {
              $cond: {
                if: {
                  $ne: [
                    {
                      $dateFromString: {
                        dateString: "$inspection_date",
                        format: "%m/%d/%Y",
                        onError: null
                      }
                    },
                    null
                  ]
                },
                then: {
                  $dateSubtract: {
                    startDate: {
                      $dateFromString: {
                        dateString: "$inspection_date",
                        format: "%m/%d/%Y",
                        onError: null
                      }
                    },
                    unit: "day",
                    amount: {
                      $subtract: [
                        {
                          $dayOfWeek: {
                            $dateFromString: {
                              dateString: "$inspection_date",
                              format: "%m/%d/%Y",
                              onError: null
                            }
                          }
                        },
                        1 // Adjust for Monday (1 = Sunday, 2 = Monday, etc.)
                      ]
                    }
                  }
                },
                else: null // If date is invalid, set monday to null
              }
            }
          },
          in: {
            weekNumber: {
              $cond: {
                if: { $ne: ["$$monday", null] },
                then: { $week: "$$monday" },
                else: -1 // Use -1 for invalid weeks
              }
            },
            startDate: {
              $cond: {
                if: { $ne: ["$$monday", null] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$$monday"
                  }
                },
                else: "Invalid Date"
              }
            },
            endDate: {
              $cond: {
                if: { $ne: ["$$monday", null] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: {
                      $dateAdd: {
                        startDate: "$$monday",
                        unit: "day",
                        amount: 6
                      }
                    }
                  }
                },
                else: "Invalid Date"
              }
            }
          }
        }
      };
      projectFields.weekInfo = "$_id.weekInfo";
    } else if (groupByDate === "true") {
      groupBy.inspection_date = {
        $dateToString: {
          format: "%Y-%m-%d",
          date: {
            $dateFromString: {
              dateString: "$inspection_date",
              format: "%m/%d/%Y",
              onError: null // Handle invalid dates
            }
          }
        }
      };
      projectFields.inspection_date = "$_id.inspection_date";
    }
    if (groupByLine === "true") {
      groupBy.lineNo = "$lineNo";
      projectFields.lineNo = "$_id.lineNo";
    }
    if (groupByMO === "true") {
      groupBy.moNo = "$moNo";
      projectFields.moNo = "$_id.moNo";
    }
    if (groupByBuyer === "true") {
      groupBy.buyer = "$buyer";
      projectFields.buyer = "$_id.buyer";
    }
    if (groupByColor === "true") {
      groupBy.color = "$color";
      projectFields.color = "$_id.color";
    }
    if (groupBySize === "true") {
      groupBy.size = "$size";
      projectFields.size = "$_id.size";
    }

    const data = await QC2InspectionPassBundle.aggregate([
      // Step 1: Filter out documents with invalid inspection_date
      {
        $match: {
          inspection_date: { $exists: true, $ne: null, $ne: "" },
          ...match
        }
      },
      // Step 2: Group the data
      {
        $group: {
          _id: groupBy,
          checkedQty: { $sum: "$checkedQty" },
          totalPass: { $sum: "$totalPass" },
          totalRejects: { $sum: "$totalRejects" },
          defectsQty: { $sum: "$defectQty" },
          totalBundles: { $sum: 1 },
          defectiveBundles: {
            $sum: { $cond: [{ $gt: ["$totalRepair", 0] }, 1, 0] }
          },
          defectArray: { $push: "$defectArray" },
          firstInspectionDate: { $first: "$inspection_date" },
          firstLineNo: { $first: "$lineNo" },
          firstMoNo: { $first: "$moNo" },
          firstBuyer: { $first: "$buyer" },
          firstColor: { $first: "$color" },
          firstSize: { $first: "$size" }
        }
      },
      // Step 3: Project the required fields
      {
        $project: {
          ...projectFields,
          inspection_date:
            groupByDate !== "true"
              ? "$firstInspectionDate"
              : "$_id.inspection_date",
          weekInfo:
            groupByWeek !== "true"
              ? null
              : {
                  weekNumber: "$_id.weekInfo.weekNumber",
                  startDate: "$_id.weekInfo.startDate",
                  endDate: "$_id.weekInfo.endDate"
                },
          lineNo: groupByLine !== "true" ? "$firstLineNo" : "$_id.lineNo",
          moNo: groupByMO !== "true" ? "$firstMoNo" : "$_id.moNo",
          buyer: groupByBuyer !== "true" ? "$firstBuyer" : "$_id.buyer",
          color: groupByColor !== "true" ? "$firstColor" : "$_id.color",
          size: groupBySize !== "true" ? "$firstSize" : "$_id.size",
          checkedQty: 1,
          totalPass: 1,
          totalRejects: 1,
          defectsQty: 1,
          totalBundles: 1,
          defectiveBundles: 1,
          defectArray: {
            $reduce: {
              input: "$defectArray",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] }
            }
          },
          defectRate: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$defectsQty", "$checkedQty"] }
            ]
          },
          defectRatio: {
            $cond: [
              { $eq: ["$checkedQty", 0] },
              0,
              { $divide: ["$totalRejects", "$checkedQty"] }
            ]
          },
          _id: 0
        }
      },
      // Step 4: Sort the results
      {
        $sort: {
          ...(groupByWeek === "true" && { "weekInfo.startDate": 1 }),
          ...(groupByDate === "true" && { inspection_date: 1 }),
          lineNo: 1,
          moNo: 1
        }
      }
    ]);

    res.json(data);
  } catch (error) {
    console.error("Error fetching MO summaries:", error);
    res.status(500).json({ error: "Failed to fetch MO summaries" });
  }
});

app.get("/api/qc2-defect-rates", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo
    } = req.query;

    // Build the match stage with filters
    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    if (lineNo) match.lineNo = lineNo.trim();

    // Date filtering using $expr for string dates
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];
      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    // Aggregation pipeline
    const pipeline = [
      { $match: match },
      {
        $facet: {
          totalChecked: [
            {
              $group: {
                _id: null,
                totalCheckedQty: { $sum: "$checkedQty" }
              }
            }
          ],
          defects: [
            { $unwind: "$defectArray" },
            {
              $group: {
                _id: "$defectArray.defectName",
                totalCount: { $sum: "$defectArray.totalCount" }
              }
            }
          ]
        }
      },
      {
        $project: {
          totalCheckedQty: {
            $arrayElemAt: ["$totalChecked.totalCheckedQty", 0]
          },
          defects: "$defects"
        }
      },
      { $unwind: "$defects" },
      {
        $project: {
          defectName: "$defects._id",
          totalCount: "$defects.totalCount",
          defectRate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              { $divide: ["$defects.totalCount", "$totalCheckedQty"] }
            ]
          }
        }
      },
      { $sort: { defectRate: -1 } }
    ];

    const data = await QC2InspectionPassBundle.aggregate(pipeline);
    res.json(data);
  } catch (error) {
    console.error("Error fetching defect rates:", error);
    res.status(500).json({ error: "Failed to fetch defect rates" });
  }
});

//Defect rate by Hour - Endpoint
app.get("/api/qc2-defect-rates-by-hour", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };

    // Update date filtering using $expr and $dateFromString
    if (startDate || endDate) {
      match.$expr = match.$expr || {}; // Initialize $expr if not present
      match.$expr.$and = match.$expr.$and || [];

      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    match.inspection_time = { $regex: /^\d{2}:\d{2}:\d{2}$/ };

    const data = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          moNo: 1,
          checkedQty: 1,
          defectQty: 1,
          defectArray: 1,
          inspection_time: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
          minute: { $toInt: { $substr: ["$inspection_time", 3, 2] } },
          second: { $toInt: { $substr: ["$inspection_time", 6, 2] } }
        }
      },
      {
        $match: {
          minute: { $gte: 0, $lte: 59 },
          second: { $gte: 0, $lte: 59 }
        }
      },
      {
        $group: {
          _id: { moNo: "$moNo", hour: "$hour" },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
          defectRecords: { $push: "$defectArray" }
        }
      },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            moNo: "$_id.moNo",
            hour: "$_id.hour",
            defectName: "$defectRecords.defectName"
          },
          totalCheckedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defectCount: { $sum: "$defectRecords.totalCount" }
        }
      },
      {
        $group: {
          _id: { moNo: "$_id.moNo", hour: "$_id.hour" },
          checkedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defects: {
            $push: {
              name: "$_id.defectName",
              count: {
                $cond: [{ $eq: ["$defectCount", null] }, 0, "$defectCount"]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: "$_id.moNo",
          hours: {
            $push: {
              hour: "$_id.hour",
              checkedQty: "$checkedQty",
              defects: "$defects",
              defectQty: "$totalDefectQty"
            }
          },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$totalDefectQty" }
        }
      },
      {
        $project: {
          moNo: "$_id",
          hourData: {
            $arrayToObject: {
              $map: {
                input: "$hours",
                as: "h",
                in: {
                  k: { $toString: { $add: ["$$h.hour", 1] } },
                  v: {
                    rate: {
                      $cond: [
                        { $eq: ["$$h.checkedQty", 0] },
                        0,
                        {
                          $multiply: [
                            { $divide: ["$$h.defectQty", "$$h.checkedQty"] },
                            100
                          ]
                        }
                      ]
                    },
                    hasCheckedQty: { $gt: ["$$h.checkedQty", 0] },
                    checkedQty: "$$h.checkedQty",
                    defects: "$$h.defects"
                  }
                }
              }
            }
          },
          totalRate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          _id: 0
        }
      },
      { $sort: { moNo: 1 } }
    ]);

    const totalData = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          checkedQty: 1,
          defectQty: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } }
        }
      },
      {
        $group: {
          _id: "$hour",
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          hour: "$_id",
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          hasCheckedQty: { $gt: ["$totalCheckedQty", 0] },
          _id: 0
        }
      }
    ]);

    const grandTotal = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          _id: 0
        }
      }
    ]);

    const result = {};
    data.forEach((item) => {
      result[item.moNo] = {};
      Object.keys(item.hourData).forEach((hour) => {
        const formattedHour = `${hour}:00`.padStart(5, "0");
        const hourData = item.hourData[hour];
        result[item.moNo][formattedHour] = {
          rate: hourData.rate,
          hasCheckedQty: hourData.hasCheckedQty,
          checkedQty: hourData.checkedQty,
          defects: hourData.defects.map((defect) => ({
            name: defect.name || "No Defect",
            count: defect.count,
            rate:
              hourData.checkedQty > 0
                ? (defect.count / hourData.checkedQty) * 100
                : 0
          }))
        };
      });
      result[item.moNo].totalRate = item.totalRate;
    });

    result.total = {};
    totalData.forEach((item) => {
      const formattedHour = `${item.hour + 1}:00`.padStart(5, "0");
      if (item.hour >= 6 && item.hour <= 20) {
        result.total[formattedHour] = {
          rate: item.rate,
          hasCheckedQty: item.hasCheckedQty
        };
      }
    });

    result.grand = grandTotal.length > 0 ? grandTotal[0] : { rate: 0 };

    const hours = [
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00"
    ];
    Object.keys(result).forEach((key) => {
      if (key !== "grand") {
        hours.forEach((hour) => {
          if (!result[key][hour]) {
            result[key][hour] = {
              rate: 0,
              hasCheckedQty: false,
              checkedQty: 0,
              defects: []
            };
          }
        });
      }
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching defect rates by hour:", error);
    res.status(500).json({ error: "Failed to fetch defect rates by hour" });
  }
});

// Endpoint to get defect rates by line by hour
app.get("/api/qc2-defect-rates-by-line", async (req, res) => {
  try {
    const {
      moNo,
      emp_id_inspection,
      startDate,
      endDate,
      color,
      size,
      department,
      buyer,
      lineNo
    } = req.query;

    let match = {};
    if (moNo) match.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    if (emp_id_inspection)
      match.emp_id_inspection = {
        $regex: new RegExp(emp_id_inspection.trim(), "i")
      };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (buyer)
      match.buyer = { $regex: new RegExp(escapeRegExp(buyer.trim()), "i") };
    if (lineNo) match.lineNo = lineNo.trim();
    //if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };

    // Normalize and convert dates to Date objects for proper comparison using $expr
    if (startDate || endDate) {
      match.$expr = match.$expr || {}; // Initialize $expr if not present
      match.$expr.$and = match.$expr.$and || [];

      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    match.inspection_time = { $regex: /^\d{2}:\d{2}:\d{2}$/ };

    const data = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          lineNo: 1,
          moNo: 1,
          checkedQty: 1,
          defectQty: 1,
          defectArray: 1,
          inspection_time: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } },
          minute: { $toInt: { $substr: ["$inspection_time", 3, 2] } },
          second: { $toInt: { $substr: ["$inspection_time", 6, 2] } }
        }
      },
      {
        $match: {
          minute: { $gte: 0, $lte: 59 },
          second: { $gte: 0, $lte: 59 }
        }
      },
      {
        $group: {
          _id: { lineNo: "$lineNo", moNo: "$moNo", hour: "$hour" },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" },
          defectRecords: { $push: "$defectArray" }
        }
      },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$defectRecords", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            lineNo: "$_id.lineNo",
            moNo: "$_id.moNo",
            hour: "$_id.hour",
            defectName: "$defectRecords.defectName"
          },
          totalCheckedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defectCount: { $sum: "$defectRecords.totalCount" }
        }
      },
      {
        $group: {
          _id: { lineNo: "$_id.lineNo", moNo: "$_id.moNo", hour: "$_id.hour" },
          checkedQty: { $first: "$totalCheckedQty" },
          totalDefectQty: { $first: "$totalDefectQty" },
          defects: {
            $push: {
              name: "$_id.defectName",
              count: {
                $cond: [{ $eq: ["$defectCount", null] }, 0, "$defectCount"]
              }
            }
          }
        }
      },
      {
        $group: {
          _id: { lineNo: "$_id.lineNo", moNo: "$_id.moNo" },
          hours: {
            $push: {
              hour: "$_id.hour",
              checkedQty: "$checkedQty",
              defects: "$defects",
              defectQty: "$totalDefectQty"
            }
          },
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$totalDefectQty" }
        }
      },
      {
        $group: {
          _id: "$_id.lineNo",
          moNos: {
            $push: {
              moNo: "$_id.moNo",
              hours: "$hours",
              totalCheckedQty: "$totalCheckedQty",
              totalDefectQty: "$totalDefectQty",
              totalRate: {
                $cond: [
                  { $eq: ["$totalCheckedQty", 0] },
                  0,
                  {
                    $multiply: [
                      { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                      100
                    ]
                  }
                ]
              }
            }
          },
          totalCheckedQty: { $sum: "$totalCheckedQty" },
          totalDefectQty: { $sum: "$totalDefectQty" }
        }
      },
      {
        $project: {
          lineNo: "$_id",
          moData: {
            $arrayToObject: {
              $map: {
                input: "$moNos",
                as: "mo",
                in: {
                  k: "$$mo.moNo",
                  v: {
                    hourData: {
                      $arrayToObject: {
                        $map: {
                          input: "$$mo.hours",
                          as: "h",
                          in: {
                            k: { $toString: { $add: ["$$h.hour", 1] } },
                            v: {
                              rate: {
                                $cond: [
                                  { $eq: ["$$h.checkedQty", 0] },
                                  0,
                                  {
                                    $multiply: [
                                      {
                                        $divide: [
                                          "$$h.defectQty",
                                          "$$h.checkedQty"
                                        ]
                                      },
                                      100
                                    ]
                                  }
                                ]
                              },
                              hasCheckedQty: { $gt: ["$$h.checkedQty", 0] },
                              checkedQty: "$$h.checkedQty",
                              defects: "$$h.defects"
                            }
                          }
                        }
                      }
                    },
                    totalRate: "$$mo.totalRate"
                  }
                }
              }
            }
          },
          totalRate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          _id: 0
        }
      },
      { $sort: { lineNo: 1 } }
    ]);

    const totalData = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $project: {
          checkedQty: 1,
          defectQty: 1,
          hour: { $toInt: { $substr: ["$inspection_time", 0, 2] } }
        }
      },
      {
        $group: {
          _id: "$hour",
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          hour: "$_id",
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          hasCheckedQty: { $gt: ["$totalCheckedQty", 0] },
          _id: 0
        }
      }
    ]);

    const grandTotal = await QC2InspectionPassBundle.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalCheckedQty: { $sum: "$checkedQty" },
          totalDefectQty: { $sum: "$defectQty" }
        }
      },
      {
        $project: {
          rate: {
            $cond: [
              { $eq: ["$totalCheckedQty", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$totalDefectQty", "$totalCheckedQty"] },
                  100
                ]
              }
            ]
          },
          _id: 0
        }
      }
    ]);

    const result = {};
    data.forEach((item) => {
      result[item.lineNo] = {};
      Object.keys(item.moData).forEach((moNo) => {
        result[item.lineNo][moNo] = {};
        Object.keys(item.moData[moNo].hourData).forEach((hour) => {
          const formattedHour = `${hour}:00`.padStart(5, "0");
          const hourData = item.moData[moNo].hourData[hour];
          result[item.lineNo][moNo][formattedHour] = {
            rate: hourData.rate,
            hasCheckedQty: hourData.hasCheckedQty,
            checkedQty: hourData.checkedQty,
            defects: hourData.defects.map((defect) => ({
              name: defect.name || "No Defect",
              count: defect.count,
              rate:
                hourData.checkedQty > 0
                  ? (defect.count / hourData.checkedQty) * 100
                  : 0
            }))
          };
        });
        result[item.lineNo][moNo].totalRate = item.moData[moNo].totalRate;
      });
      result[item.lineNo].totalRate = item.totalRate;
    });

    result.total = {};
    totalData.forEach((item) => {
      const formattedHour = `${item.hour + 1}:00`.padStart(5, "0");
      if (item.hour >= 6 && item.hour <= 20) {
        result.total[formattedHour] = {
          rate: item.rate,
          hasCheckedQty: item.hasCheckedQty
        };
      }
    });

    result.grand = grandTotal.length > 0 ? grandTotal[0] : { rate: 0 };

    const hours = [
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00",
      "19:00",
      "20:00",
      "21:00"
    ];
    Object.keys(result).forEach((key) => {
      if (key !== "grand" && key !== "total") {
        Object.keys(result[key]).forEach((moNo) => {
          if (moNo !== "totalRate") {
            hours.forEach((hour) => {
              if (!result[key][moNo][hour]) {
                result[key][moNo][hour] = {
                  rate: 0,
                  hasCheckedQty: false,
                  checkedQty: 0,
                  defects: []
                };
              }
            });
          }
        });
      }
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching defect rates by line:", error);
    res.status(500).json({ error: "Failed to fetch defect rates by line" });
  }
});

/* ------------------------------
   Emp id for Inspector Data
------------------------------ */

// Endpoint to fetch a specific user by emp_id
app.get("/api/users/:emp_id", async (req, res) => {
  try {
    const { emp_id } = req.params;
    const user = await UserMain.findOne(
      { emp_id },
      "emp_id eng_name face_photo"
    ).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error(
      `Error fetching user with emp_id ${req.params.emp_id}:`,
      error
    );
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

/* ------------------------------
   QC2 - Repair Tracking
------------------------------ */
// 1. Fetch Defect Data by defect_print_id
app.get("/api/defect-track/:defect_print_id", async (req, res) => {
  try {
    const { defect_print_id } = req.params;

    // Fetch from qc2_inspection_pass_bundle
    const inspectionRecord = await QC2InspectionPassBundle.findOne({
      "printArray.defect_print_id": defect_print_id
    });

    if (!inspectionRecord) {
      return res.status(404).json({ message: "Defect print ID not found" });
    }

    const printData = inspectionRecord.printArray.find(
      (item) => item.defect_print_id === defect_print_id
    );

    if (!printData) {
      return res
        .status(404)
        .json({ message: "Defect print ID not found in printArray" });
    }

    // Fetch existing repair tracking data if it exists
    const repairRecord = await QC2RepairTracking.findOne({ defect_print_id });

    const formattedData = {
      package_no: inspectionRecord.package_no,
      moNo: inspectionRecord.moNo,
      custStyle: inspectionRecord.custStyle,
      color: inspectionRecord.color,
      size: inspectionRecord.size,
      lineNo: inspectionRecord.lineNo,
      department: inspectionRecord.department,
      buyer: inspectionRecord.buyer,
      factory: inspectionRecord.factory,
      sub_con: inspectionRecord.sub_con,
      sub_con_factory: inspectionRecord.sub_con_factory,
      defect_print_id: printData.defect_print_id,
      garments: printData.printData.map((garment) => ({
        garmentNumber: garment.garmentNumber,
        defects: garment.defects.map((defect) => {
          const repairItem = repairRecord
            ? repairRecord.repairArray.find(
                (r) =>
                  r.defectName === defect.name &&
                  r.garmentNumber === garment.garmentNumber
              )
            : null;
          return {
            name: defect.name,
            count: defect.count,
            repair: defect.repair,
            status: repairItem ? repairItem.status : "Fail",
            repair_date: repairItem ? repairItem.repair_date : "",
            repair_time: repairItem ? repairItem.repair_time : "",
            pass_bundle: repairItem ? repairItem.pass_bundle : "Not Checked",
            garmentNumber: garment.garmentNumber
          };
        })
      }))
    };

    res.json(formattedData);
  } catch (error) {
    console.error("Error fetching defect track data:", error);
    res.status(500).json({ message: error.message });
  }
});

// 2. Save/Update Repair Tracking Data
app.post("/api/repair-tracking", async (req, res) => {
  try {
    const {
      defect_print_id,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      buyer,
      factory,
      sub_con,
      sub_con_factory,
      repairArray
    } = req.body;

    // Check if a record already exists
    let existingRecord = await QC2RepairTracking.findOne({ defect_print_id });

    if (existingRecord) {
      // Update existing record
      existingRecord.repairArray = existingRecord.repairArray.map((item) => {
        const updatedItem = repairArray.find(
          (newItem) =>
            newItem.defectName === item.defectName &&
            newItem.garmentNumber === item.garmentNumber
        );
        if (updatedItem) {
          // Determine if pass_bundle needs to be updated
          let newPassBundle = item.pass_bundle;
          if (updatedItem.status !== item.status) {
            newPassBundle =
              updatedItem.status === "Fail"
                ? "Not Checked"
                : updatedItem.status === "OK"
                ? "Fail"
                : "OK";
          }
          return {
            ...item,
            status: updatedItem.status,
            repair_date: updatedItem.repair_date,
            repair_time: updatedItem.repair_time,
            pass_bundle: newPassBundle
          };
        }
        return item;
      });

      //Add new items
      const newItems = repairArray.filter(
        (newItem) =>
          !existingRecord.repairArray.some(
            (existingItem) =>
              existingItem.defectName === newItem.defectName &&
              existingItem.garmentNumber === newItem.garmentNumber
          )
      );

      if (newItems.length > 0) {
        existingRecord.repairArray.push(...newItems);
      }

      await existingRecord.save();
      res.status(200).json({
        message: "Repair tracking updated successfully",
        data: existingRecord
      });
    } else {
      // Create new record
      const newRecord = new QC2RepairTracking({
        package_no,
        moNo,
        custStyle,
        color,
        size,
        lineNo,
        department,
        buyer,
        factory,
        sub_con,
        sub_con_factory,
        defect_print_id,
        repairArray: repairArray.map((item) => ({
          defectName: item.defectName,
          defectCount: item.defectCount,
          repairGroup: item.repairGroup,
          garmentNumber: item.garmentNumber,
          status: item.status || "Fail",
          repair_date: item.repair_date || "",
          repair_time: item.repair_time || "",
          pass_bundle:
            item.status === "Fail"
              ? "Not Checked"
              : item.status === "OK"
              ? "Fail"
              : "OK"
        }))
      });
      await newRecord.save();
      res.status(201).json({
        message: "Repair tracking saved successfully",
        data: newRecord
      });
    }
  } catch (error) {
    console.error("Error saving/updating repair tracking:", error);
    res.status(500).json({
      message: "Failed to save/update repair tracking",
      error: error.message
    });
  }
});

// Endpoint to update defect status for a rejected garment
app.post("/api/qc2-repair-tracking/update-defect-status", async (req, res) => {
  const { defect_print_id, garmentNumber, failedDefects, isRejecting } =
    req.body;
  try {
    const repairTracking = await QC2RepairTracking.find({ defect_print_id });
    if (!repairTracking || repairTracking.length == 0) {
      return res.status(404).json({ message: "Repair tracking not found" });
    }

    const rt = repairTracking[0];

    rt.repairArray = rt.repairArray.map((item) => {
      if (item.garmentNumber === garmentNumber) {
        if (
          isRejecting &&
          failedDefects.some((fd) => fd.name === item.defectName)
        ) {
          item.status = "Fail";
          item.repair_date = null;
          item.repair_time = null;
          item.pass_bundle = "Fail";
        } else if (isRejecting) {
          // If rejecting but not in failedDefectIds, don't change status or pass_bundle
        } else {
          item.status = "OK";
          const now = new Date();
          item.repair_date = now.toLocaleDateString("en-US");
          item.repair_time = now.toLocaleTimeString("en-US", { hour12: false });
          // Only set pass_bundle to "Pass" if not rejecting
          item.pass_bundle = "Pass";
        }
      }
      return item;
    });

    await rt.save();
    res.status(200).json({ message: "Updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Endpoint to update pass_bundle status for all garments
app.post(
  "/api/qc2-repair-tracking/update-pass-bundle-status",
  async (req, res) => {
    try {
      const { defect_print_id, pass_bundle } = req.body;

      const repairTracking = await QC2RepairTracking.findOne({
        defect_print_id
      });

      if (!repairTracking) {
        return res.status(404).json({ message: "Repair tracking not found" });
      }

      const updatedRepairArray = repairTracking.repairArray.map((item) => {
        return {
          ...item.toObject(),
          pass_bundle: item.status === "OK" ? "Pass" : item.pass_bundle
        };
      });

      repairTracking.repairArray = updatedRepairArray;
      await repairTracking.save();

      res
        .status(200)
        .json({ message: "pass_bundle status updated successfully" });
    } catch (error) {
      console.error("Error updating pass_bundle status:", error);
      res.status(500).json({
        message: "Failed to update pass_bundle status",
        error: error.message
      });
    }
  }
);

// Endpoint to update defect status by defect name and garment number
app.post(
  "/api/qc2-repair-tracking/update-defect-status-by-name",
  async (req, res) => {
    const { defect_print_id, garmentNumber, defectName, status } = req.body;
    try {
      const repairTracking = await QC2RepairTracking.findOne({
        defect_print_id
      });
      if (!repairTracking) {
        console.error(
          `No repair tracking found for defect_print_id: ${defect_print_id}`
        ); // Add this line
        return res.status(404).json({ message: "Repair tracking not found" });
      }

      // Find the specific defect and update it
      const updatedRepairArray = repairTracking.repairArray.map((item) => {
        if (
          item.garmentNumber === garmentNumber &&
          item.defectName === defectName
        ) {
          const shouldUpdate = item.status !== status;
          if (shouldUpdate) {
            const now = new Date();
            return {
              ...item,
              status: status,
              repair_date:
                status === "OK" ? now.toLocaleDateString("en-US") : null,
              repair_time:
                status === "OK"
                  ? now.toLocaleTimeString("en-US", { hour12: false })
                  : null,
              // pass_bundle: status === "OK" ? "Pass" : status === "Fail" ? "Fail" : item.pass_bundle
              pass_bundle: status === "OK" ? "Pass" : item.pass_bundle
            };
          }
        }
        return item;
      });
      // Check if any changes were made
      const hasChanges = repairTracking.repairArray.some((item, index) => {
        return (
          JSON.stringify(item) !== JSON.stringify(updatedRepairArray[index])
        );
      });
      if (hasChanges) {
        repairTracking.repairArray = updatedRepairArray;
        await repairTracking.save();
        console.log("Updated Repair Array:", updatedRepairArray);
        res.status(200).json({ message: "Defect status updated successfully" });
      } else {
        res.status(200).json({ message: "No changes were made" });
      }
    } catch (error) {
      console.error("Error updating defect status:", error);
      res.status(500).json({
        message: "Failed to update defect status",
        error: error.message
      });
    }
  }
);

/* ------------------------------
   QC2 - Reworks
------------------------------ */

// const QC2Reworks = mongoose.model("qc2_reworks", qc2ReworksSchema);

// Endpoint to save reworks (reject garment) data
app.post("/api/reworks", async (req, res) => {
  try {
    const {
      package_no,
      //bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      reworkGarments,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id
    } = req.body;

    const newRecord = new QC2Reworks({
      package_no,
      //bundleNo,
      moNo,
      custStyle,
      color,
      size,
      lineNo,
      department,
      reworkGarments,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id
    });
    await newRecord.save();
    res.status(201).json({
      message: "Reworks data saved successfully",
      data: newRecord
    });
  } catch (error) {
    console.error("Error saving reworks data:", error);
    res.status(500).json({
      message: "Failed to save reworks data",
      error: error.message
    });
  }
});

/* ------------------------------
   QC2 - Defect Print
------------------------------ */

// Create new defect print record
app.post("/api/qc2-defect-print", async (req, res) => {
  try {
    const {
      factory,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      repair,
      count,
      count_print,
      defects,
      defect_id,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id
    } = req.body;

    const now = new Date();
    const print_time = now.toLocaleTimeString("en-US", { hour12: false });

    const defectPrint = new QC2DefectPrint({
      factory,
      package_no,
      moNo,
      custStyle,
      color,
      size,
      repair,
      count,
      count_print,
      defects,
      print_time,
      defect_id,
      emp_id_inspection,
      eng_name_inspection,
      kh_name_inspection,
      job_title_inspection,
      dept_name_inspection,
      sect_name_inspection,
      bundle_id,
      bundle_random_id
    });

    const savedDefectPrint = await defectPrint.save();
    res.json(savedDefectPrint);
  } catch (error) {
    console.error("Error creating defect print record:", error);
    res.status(500).json({ error: error.message });
  }
});

// Search defect print records
app.get("/api/qc2-defect-print/search", async (req, res) => {
  try {
    const { moNo, package_no, repair } = req.query;
    const query = {};

    // Build the query object based on provided parameters
    if (moNo) {
      query.moNo = { $regex: new RegExp(moNo.trim(), "i") };
    }

    if (package_no) {
      const packageNoNumber = Number(package_no);
      if (isNaN(packageNoNumber)) {
        return res.status(400).json({ error: "Package No must be a number" });
      }
      query.package_no = packageNoNumber;
    }

    if (repair) {
      query.repair = { $regex: new RegExp(repair.trim(), "i") };
    }

    // Execute the search query
    const defectPrints = await QC2DefectPrint.find(query).sort({
      createdAt: -1
    });

    // Return empty array if no results found
    if (!defectPrints || defectPrints.length === 0) {
      return res.json([]);
    }

    res.json(defectPrints);
  } catch (error) {
    console.error("Error searching defect print records:", error);
    res.status(500).json({
      error: "Failed to search defect cards",
      details: error.message
    });
  }
});

// Fetch all defect print records
app.get("/api/qc2-defect-print", async (req, res) => {
  try {
    const defectPrints = await QC2DefectPrint.find().sort({ createdAt: -1 });

    if (!defectPrints || defectPrints.length === 0) {
      return res.json([]);
    }

    res.json(defectPrints);
  } catch (error) {
    console.error("Error fetching defect print records:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get defect print records by defect_id
app.get("/api/qc2-defect-print/:defect_id", async (req, res) => {
  try {
    const { defect_id } = req.params;
    const defectPrint = await QC2DefectPrint.findOne({ defect_id });

    if (!defectPrint) {
      return res.status(404).json({ error: "Defect print record not found" });
    }

    res.json(defectPrint);
  } catch (error) {
    console.error("Error fetching defect print record:", error);
    res.status(500).json({ error: error.message });
  }
});

/* ------------------------------
   QC2 OrderData Live Dashboard
------------------------------ */

app.get("/api/qc2-orderdata/filter-options", async (req, res) => {
  try {
    const filterOptions = await QC2OrderData.aggregate([
      {
        $group: {
          _id: null,
          moNo: { $addToSet: "$selectedMono" },
          color: { $addToSet: "$color" },
          size: { $addToSet: "$size" },
          department: { $addToSet: "$department" },
          empId: { $addToSet: "$emp_id" },
          buyer: { $addToSet: "$buyer" },
          lineNo: { $addToSet: "$lineNo" }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: 1,
          color: 1,
          size: 1,
          department: 1,
          empId: 1,
          buyer: 1,
          lineNo: 1
        }
      }
    ]);

    const result =
      filterOptions.length > 0
        ? filterOptions[0]
        : {
            moNo: [],
            color: [],
            size: [],
            department: [],
            empId: [],
            buyer: [],
            lineNo: []
          };

    Object.keys(result).forEach((key) => {
      result[key] = result[key]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ error: "Failed to fetch filter options" });
  }
});

app.get("/api/qc2-orderdata-summary", async (req, res) => {
  try {
    const {
      moNo,
      startDate,
      endDate,
      color,
      size,
      department,
      empId,
      buyer,
      lineNo,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (color) match.color = color;
    if (size) match.size = size;
    if (department) match.department = department;
    if (empId) match.emp_id = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };
    if (lineNo) match.lineNo = { $regex: new RegExp(lineNo.trim(), "i") };
    if (startDate || endDate) {
      match.updated_date_seperator = {};
      if (startDate) match.updated_date_seperator.$gte = startDate;
      if (endDate) match.updated_date_seperator.$lte = endDate;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
                totalGarmentsQty: { $sum: "$count" },
                uniqueMONos: { $addToSet: "$selectedMono" },
                uniqueColors: { $addToSet: "$color" }, // Add unique colors
                uniqueSizes: { $addToSet: "$size" }, // Add unique sizes
                uniqueOrderQty: {
                  $addToSet: { moNo: "$selectedMono", orderQty: "$orderQty" }
                }
              }
            },
            {
              $project: {
                _id: 0,
                totalRegisteredBundleQty: 1,
                totalGarmentsQty: 1,
                totalMO: { $size: "$uniqueMONos" },
                totalColors: { $size: "$uniqueColors" }, // Count unique colors
                totalSizes: { $size: "$uniqueSizes" }, // Count unique sizes
                totalOrderQty: {
                  $sum: {
                    $map: {
                      input: "$uniqueOrderQty",
                      in: "$$this.orderQty"
                    }
                  }
                }
              }
            }
          ],
          tableData: [
            {
              $group: {
                _id: {
                  lineNo: "$lineNo",
                  moNo: "$selectedMono",
                  custStyle: "$custStyle",
                  country: "$country",
                  buyer: "$buyer",
                  color: "$color",
                  size: "$size",
                  empId: "$emp_id" // Add emp_id to group
                },
                totalRegisteredBundleQty: { $sum: "$totalBundleQty" },
                totalGarments: { $sum: "$count" },
                orderQty: { $first: "$orderQty" } // Use $first to get orderQty for each unique MO
              }
            },
            {
              $project: {
                _id: 0,
                lineNo: "$_id.lineNo",
                moNo: "$_id.moNo",
                custStyle: "$_id.custStyle",
                country: "$_id.country",
                buyer: "$_id.buyer",
                color: "$_id.color",
                size: "$_id.size",
                empId: "$_id.empId", // Include empId in output
                totalRegisteredBundleQty: 1,
                totalGarments: 1,
                orderQty: 1 // Include orderQty in output
              }
            },
            { $sort: { lineNo: 1, moNo: 1 } },
            { $skip: skip },
            { $limit: limitNum }
          ],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await QC2OrderData.aggregate(pipeline);
    const summary = result[0].summary[0] || {
      totalRegisteredBundleQty: 0,
      totalGarmentsQty: 0,
      totalMO: 0,
      totalColors: 0, // Default for new fields
      totalSizes: 0,
      totalOrderQty: 0
    };
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ summary, tableData, total });
  } catch (error) {
    console.error("Error fetching order data summary:", error);
    res.status(500).json({ error: "Failed to fetch order data summary" });
  }
});

/* ------------------------------
   QC2 Washing Live Dashboard
------------------------------ */
app.get("/api/washing-autocomplete", async (req, res) => {
  try {
    const { field, query } = req.query;

    // Validate field
    const validFields = [
      "selectedMono",
      "custStyle",
      "buyer",
      "color",
      "size",
      "emp_id_washing"
    ];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    // Build match stage for partial search (optional)
    const match = {};
    if (query) {
      match[field] = { $regex: new RegExp(query.trim(), "i") };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: `$${field}`
        }
      },
      {
        $project: {
          _id: 0,
          value: "$_id"
        }
      },
      { $sort: { value: 1 } },
      ...(query ? [{ $limit: 10 }] : []) // Limit only when searching
    ];

    const results = await Washing.aggregate(pipeline);
    const suggestions = results.map((item) => item.value).filter(Boolean);

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching autocomplete suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

app.get("/api/washing-summary", async (req, res) => {
  try {
    const {
      moNo,
      custStyle, // Added for filtering
      color,
      size,
      empId,
      buyer,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (custStyle)
      match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
    if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
    if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
    if (empId) match.emp_id_washing = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            moNo: "$selectedMono",
            custStyle: "$custStyle",
            buyer: "$buyer",
            color: "$color",
            size: "$size"
          },
          goodBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 55] }, "$totalBundleQty", 0]
            }
          },
          defectiveBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_washing", 86] }, "$totalBundleQty", 0]
            }
          },
          goodGarments: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_washing", 55] },
                { $toInt: "$passQtyWash" },
                0
              ]
            }
          },
          defectiveGarments: {
            $sum: {
              $cond: [
                { $eq: ["$task_no_washing", 86] },
                { $toInt: "$passQtyWash" },
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: "$_id.moNo",
          custStyle: "$_id.custStyle",
          buyer: "$_id.buyer",
          color: "$_id.color",
          size: "$_id.size",
          goodBundleQty: 1,
          defectiveBundleQty: 1,
          goodGarments: 1,
          defectiveGarments: 1
        }
      },
      { $sort: { moNo: 1 } },
      {
        $facet: {
          tableData: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await Washing.aggregate(pipeline);
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ tableData, total });
  } catch (error) {
    console.error("Error fetching washing summary:", error);
    res.status(500).json({ error: "Failed to fetch washing summary" });
  }
});

/* ------------------------------
   Ironing Live Dashboard Endpoints
------------------------------ */

// Summary endpoint for IroningLive table
app.get("/api/ironing-summary", async (req, res) => {
  try {
    const {
      moNo,
      custStyle,
      color,
      size,
      empId,
      buyer,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (custStyle)
      match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
    if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
    if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
    if (empId) match.emp_id_ironing = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            moNo: "$selectedMono",
            custStyle: "$custStyle",
            buyer: "$buyer",
            color: "$color",
            size: "$size"
          },
          goodBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 53] }, "$totalBundleQty", 0]
            }
          },
          defectiveBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 84] }, "$totalBundleQty", 0]
            }
          },
          goodGarments: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 53] }, "$passQtyIron", 0]
            }
          },
          defectiveGarments: {
            $sum: {
              $cond: [{ $eq: ["$task_no_ironing", 84] }, "$passQtyIron", 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: "$_id.moNo",
          custStyle: "$_id.custStyle",
          buyer: "$_id.buyer",
          color: "$_id.color",
          size: "$_id.size",
          goodBundleQty: 1,
          defectiveBundleQty: 1,
          goodGarments: 1,
          defectiveGarments: 1
        }
      },
      { $sort: { moNo: 1 } },
      {
        $facet: {
          tableData: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await Ironing.aggregate(pipeline);
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ tableData, total });
  } catch (error) {
    console.error("Error fetching ironing summary:", error);
    res.status(500).json({ error: "Failed to fetch ironing summary" });
  }
});

// Autocomplete endpoint for IroningLive filters
app.get("/api/ironing-autocomplete", async (req, res) => {
  try {
    const { field, query } = req.query;

    const validFields = [
      "selectedMono",
      "custStyle",
      "buyer",
      "color",
      "size",
      "emp_id_ironing"
    ];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    const match = {};
    if (query) {
      match[field] = { $regex: new RegExp(query.trim(), "i") };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: `$${field}`
        }
      },
      {
        $project: {
          _id: 0,
          value: "$_id"
        }
      },
      { $sort: { value: 1 } },
      ...(query ? [{ $limit: 10 }] : [])
    ];

    const results = await Ironing.aggregate(pipeline);
    const suggestions = results.map((item) => item.value).filter(Boolean);

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching ironing autocomplete suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

/* ------------------------------
   OPA Live Dashboard Endpoints
------------------------------ */

// Summary endpoint for OPALive table
app.get("/api/opa-summary", async (req, res) => {
  try {
    const {
      moNo,
      custStyle,
      color,
      size,
      empId,
      buyer,
      page = 1,
      limit = 50
    } = req.query;

    let match = {};
    if (moNo) match.selectedMono = { $regex: new RegExp(moNo.trim(), "i") };
    if (custStyle)
      match.custStyle = { $regex: new RegExp(custStyle.trim(), "i") };
    if (color) match.color = { $regex: new RegExp(color.trim(), "i") };
    if (size) match.size = { $regex: new RegExp(size.trim(), "i") };
    if (empId) match.emp_id_opa = { $regex: new RegExp(empId.trim(), "i") };
    if (buyer) match.buyer = { $regex: new RegExp(buyer.trim(), "i") };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: {
            moNo: "$selectedMono",
            custStyle: "$custStyle",
            buyer: "$buyer",
            color: "$color",
            size: "$size"
          },
          goodBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_opa", 60] }, "$totalBundleQty", 0]
            }
          },
          defectiveBundleQty: {
            $sum: {
              $cond: [{ $eq: ["$task_no_opa", 85] }, "$totalBundleQty", 0]
            }
          },
          goodGarments: {
            $sum: {
              $cond: [{ $eq: ["$task_no_opa", 60] }, "$passQtyOPA", 0]
            }
          },
          defectiveGarments: {
            $sum: {
              $cond: [{ $eq: ["$task_no_opa", 85] }, "$passQtyOPA", 0]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          moNo: "$_id.moNo",
          custStyle: "$_id.custStyle",
          buyer: "$_id.buyer",
          color: "$_id.color",
          size: "$_id.size",
          goodBundleQty: 1,
          defectiveBundleQty: 1,
          goodGarments: 1,
          defectiveGarments: 1
        }
      },
      { $sort: { moNo: 1 } },
      {
        $facet: {
          tableData: [{ $skip: skip }, { $limit: limitNum }],
          total: [{ $count: "count" }]
        }
      }
    ];

    const result = await OPA.aggregate(pipeline);
    const tableData = result[0].tableData || [];
    const total = result[0].total.length > 0 ? result[0].total[0].count : 0;

    res.json({ tableData, total });
  } catch (error) {
    console.error("Error fetching OPA summary:", error);
    res.status(500).json({ error: "Failed to fetch OPA summary" });
  }
});

// Autocomplete endpoint for OPALive filters
app.get("/api/opa-autocomplete", async (req, res) => {
  try {
    const { field, query } = req.query;

    const validFields = [
      "selectedMono",
      "custStyle",
      "buyer",
      "color",
      "size",
      "emp_id_opa"
    ];
    if (!validFields.includes(field)) {
      return res.status(400).json({ error: "Invalid field" });
    }

    const match = {};
    if (query) {
      match[field] = { $regex: new RegExp(query.trim(), "i") };
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: `$${field}`
        }
      },
      {
        $project: {
          _id: 0,
          value: "$_id"
        }
      },
      { $sort: { value: 1 } },
      ...(query ? [{ $limit: 10 }] : [])
    ];

    const results = await OPA.aggregate(pipeline);
    const suggestions = results.map((item) => item.value).filter(Boolean);

    res.json(suggestions);
  } catch (error) {
    console.error("Error fetching OPA autocomplete suggestions:", error);
    res.status(500).json({ error: "Failed to fetch suggestions" });
  }
});

/* ------------------------------
   QC Inline Roving ENDPOINTS
------------------------------ */

// ------------------------
// Multer Storage Setup for QC Inline Roving
// ------------------------
const qcStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../public/storage/qcinline");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const { date, type, emp_id } = req.body;
    // Validate the inputs to prevent 'undefined' in the filename
    const currentDate = date || new Date().toISOString().split("T")[0]; // Fallback to current date if not provided
    const imageType = type || "spi-measurement"; // Fallback to 'unknown' if type is not provided
    const userEmpId = emp_id || "emp"; // Fallback to 'guest' if emp_id is not provided
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${currentDate}-${imageType}-${userEmpId}-${randomId}.jpg`;
    cb(null, fileName);
  }
});

const qcUpload = multer({
  storage: qcStorage,
  limits: { fileSize: 5000000 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only (jpeg, jpg, png, gif)!");
    }
  }
}).single("image");

// Serve static files (for accessing uploaded images)
app.use("/storage", express.static(path.join(__dirname, "../public/storage")));

// Endpoint to upload images for QC Inline Roving
app.post("/api/upload-qc-image", qcUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }
    const imagePath = `/storage/qcinline/${req.file.filename}`;
    res.status(200).json({ imagePath });
  } catch (error) {
    console.error("Error uploading image:", error);
    res
      .status(500)
      .json({ message: "Failed to upload image", error: error.message });
  }
});

// Updated endpoint to save or update QC Inline Roving data
app.post("/api/save-qc-inline-roving", async (req, res) => {
  try {
    const qcInlineRovingData = req.body;

    const { inspection_date, line_no, mo_no } = qcInlineRovingData;

    // Check if a record exists with the same emp_id and inspection_date
    let existingRecord = await QCInlineRoving.findOne({
      inspection_date,
      line_no,
      mo_no
    });

    if (existingRecord) {
      // If a matching record exists, append the new inlineData to the existing record
      existingRecord.inlineData.push(qcInlineRovingData.inlineData[0]);
      await existingRecord.save();
      res.status(200).json({
        message: "QC Inline Roving data updated successfully",
        data: existingRecord
      });
    } else {
      // If no matching record exists, create a new one
      const newQCInlineRoving = new QCInlineRoving(qcInlineRovingData);
      await newQCInlineRoving.save();
      res.status(201).json({
        message: "QC Inline Roving data saved successfully",
        data: newQCInlineRoving
      });
    }
  } catch (error) {
    console.error("Error saving QC Inline Roving data:", error);
    res.status(500).json({
      message: "Failed to save QC Inline Roving data",
      error: error.message
    });
  }
});

// Endpoint to fetch QC Inline Roving reports
app.get("/api/qc-inline-roving-reports", async (req, res) => {
  try {
    const reports = await QCInlineRoving.find();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: "Error fetching reports", error });
  }
});

// New endpoint to fetch filtered QC Inline Roving reports with date handling
app.get("/api/qc-inline-roving-reports-filtered", async (req, res) => {
  try {
    const { startDate, endDate, line_no, mo_no, emp_id } = req.query;

    let match = {};

    // Date filtering using $expr for string dates
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];
      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspection_date",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    // Other filters
    if (line_no) {
      match.line_no = line_no;
    }
    if (mo_no) {
      match.mo_no = mo_no;
    }
    if (emp_id) {
      match.emp_id = emp_id;
    }

    const reports = await QCInlineRoving.find(match);
    res.json(reports);
  } catch (error) {
    console.error("Error fetching filtered roving reports:", error);
    res.status(500).json({ message: "Error fetching filtered reports", error });
  }
});

// Endpoint to fetch distinct MO Nos
app.get("/api/qc-inline-roving-mo-nos", async (req, res) => {
  try {
    const moNos = await QCInlineRoving.distinct("mo_no");
    res.json(moNos.filter((mo) => mo)); // Filter out null/empty values
  } catch (error) {
    console.error("Error fetching MO Nos:", error);
    res.status(500).json({ message: "Failed to fetch MO Nos" });
  }
});

// Endpoint to fetch distinct QC IDs (emp_id)
app.get("/api/qc-inline-roving-qc-ids", async (req, res) => {
  try {
    const qcIds = await QCInlineRoving.distinct("emp_id");
    res.json(qcIds.filter((id) => id)); // Filter out null/empty values
  } catch (error) {
    console.error("Error fetching QC IDs:", error);
    res.status(500).json({ message: "Failed to fetch QC IDs" });
  }
});

// Endpoint to fetch user data by emp_id
app.get("/api/user-by-emp-id", async (req, res) => {
  try {
    const empId = req.query.emp_id;
    if (!empId) {
      return res.status(400).json({ error: "emp_id is required" });
    }

    const user = await UserMain.findOne({ emp_id: empId }).exec(); // Use UserMain
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      emp_id: user.emp_id,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      dept_name: user.dept_name,
      sect_name: user.sect_name
    });
  } catch (err) {
    console.error("Error fetching user by emp_id:", err);
    res.status(500).json({
      message: "Failed to fetch user data",
      error: err.message
    });
  }
});

app.get("/api/users-paginated", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const jobTitle = req.query.jobTitle || ""; // Optional jobTitle filter
    const empId = req.query.empId || ""; // Optional empId filter
    const section = req.query.section || ""; // Optional section filter

    // Build the query object
    const query = {};
    if (jobTitle) {
      query.job_title = jobTitle;
    }
    if (empId) {
      query.emp_id = empId;
    }
    if (section) {
      query.sect_name = section;
    }
    query.working_status = "Working"; // Ensure only working users are fetched

    // Fetch users with pagination and filters
    const users = await UserMain.find(query)
      .skip(skip)
      .limit(limit)
      .select("emp_id eng_name kh_name dept_name sect_name job_title")
      .exec();

    // Get total count for pagination (with filters applied)
    const total = await UserMain.countDocuments(query);

    res.json({
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error("Error fetching paginated users:", err);
    res.status(500).json({
      message: "Failed to fetch users",
      error: err.message
    });
  }
});

app.get("/api/sections", async (req, res) => {
  try {
    const sections = await UserMain.distinct("sect_name", {
      working_status: "Working"
    });
    res.json(sections.filter((section) => section)); // Filter out null/empty values
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Failed to fetch sections" });
  }
});

/* ------------------------------
  QC1 Sunrise Dashboard ENDPOINTS
------------------------------ */

// Endpoint to fetch filtered QC1 Sunrise data for the dashboard
app.get("/api/sunrise/qc1-data", async (req, res) => {
  try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    // Build the match stage for the aggregation pipeline
    const matchStage = {};

    // Other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) {
      matchStage["DefectArray.defectName"] = defectName;
    }

    // Aggregation pipeline
    const pipeline = [];

    // Stage 1: Add a new field with the converted date
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] }, // Extract year (YYYY)
                "-",
                { $substr: ["$inspectionDate", 0, 2] }, // Extract month (MM)
                "-",
                { $substr: ["$inspectionDate", 3, 2] } // Extract day (DD)
              ]
            },
            format: "%Y-%m-%d"
          }
        }
      }
    });

    // Stage 2: Apply date range filter if provided
    if (startDate && endDate) {
      const start = new Date(startDate); // startDate is in YYYY-MM-DD
      const end = new Date(endDate); // endDate is in YYYY-MM-DD

      // Ensure end date includes the full day
      end.setHours(23, 59, 59, 999);

      pipeline.push({
        $match: {
          inspectionDateAsDate: {
            $gte: start,
            $lte: end
          },
          ...matchStage // Include other filters
        }
      });
    } else {
      // If no date range, just apply other filters
      pipeline.push({
        $match: matchStage
      });
    }

    // Stage 3: Filter DefectArray to only include the selected defectName (if provided)
    if (defectName) {
      pipeline.push({
        $addFields: {
          DefectArray: {
            $filter: {
              input: "$DefectArray",
              as: "defect",
              cond: { $eq: ["$$defect.defectName", defectName] }
            }
          }
        }
      });

      // Stage 4: Recalculate totalDefectsQty based on the filtered DefectArray
      pipeline.push({
        $addFields: {
          totalDefectsQty: {
            $sum: "$DefectArray.defectQty"
          }
        }
      });
    }

    // Stage 5: Sort by lineNo
    pipeline.push({
      $sort: { lineNo: 1 } // Sort by Line No (1 to 30)
    });

    // Fetch data from MongoDB using aggregation
    const data = await QC1Sunrise.aggregate(pipeline).exec();

    // Transform the inspectionDate to DD/MM/YYYY format for display
    const transformedData = data.map((item) => {
      const [month, day, year] = item.inspectionDate.split("-");
      return {
        ...item,
        inspectionDate: `${day}/${month}/${year}` // Convert to DD/MM/YYYY
      };
    });

    res.json(transformedData);
  } catch (err) {
    console.error("Error fetching QC1 Sunrise data:", err);
    res.status(500).json({
      message: "Failed to fetch QC1 Sunrise data",
      error: err.message
    });
  }
});

// Endpoint to fetch unique filter values with cross-filtering
app.get("/api/sunrise/qc1-filters", async (req, res) => {
  try {
    const { startDate, endDate, lineNo, MONo, Color, Size, Buyer, defectName } =
      req.query;

    // Build the match stage for the aggregation pipeline
    const matchStage = {};

    // Apply other filters
    if (lineNo) matchStage.lineNo = lineNo;
    if (MONo) matchStage.MONo = MONo;
    if (Color) matchStage.Color = Color;
    if (Size) matchStage.Size = Size;
    if (Buyer) matchStage.Buyer = Buyer;
    if (defectName) matchStage["DefectArray.defectName"] = defectName;

    // Aggregation pipeline
    const pipeline = [];

    // Stage 1: Add a new field with the converted date
    pipeline.push({
      $addFields: {
        inspectionDateAsDate: {
          $dateFromString: {
            dateString: {
              $concat: [
                { $substr: ["$inspectionDate", 6, 4] }, // Extract year (YYYY)
                "-",
                { $substr: ["$inspectionDate", 0, 2] }, // Extract month (MM)
                "-",
                { $substr: ["$inspectionDate", 3, 2] } // Extract day (DD)
              ]
            },
            format: "%Y-%m-%d"
          }
        }
      }
    });

    // Stage 2: Apply date range filter if provided
    if (startDate && endDate) {
      const start = new Date(startDate); // startDate is in YYYY-MM-DD
      const end = new Date(endDate); // endDate is in YYYY-MM-DD

      // Ensure end date includes the full day
      end.setHours(23, 59, 59, 999);

      pipeline.push({
        $match: {
          inspectionDateAsDate: {
            $gte: start,
            $lte: end
          },
          ...matchStage // Include other filters
        }
      });
    } else {
      // If no date range, just apply other filters
      pipeline.push({
        $match: matchStage
      });
    }

    // Fetch unique values for each filter using aggregation
    const [
      uniqueLineNos,
      uniqueMONos,
      uniqueColors,
      uniqueSizes,
      uniqueBuyers,
      uniqueDefectNames
    ] = await Promise.all([
      QC1Sunrise.aggregate([
        ...pipeline,
        { $group: { _id: "$lineNo" } }
      ]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$MONo" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Color" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Size" } }]).exec(),
      QC1Sunrise.aggregate([...pipeline, { $group: { _id: "$Buyer" } }]).exec(),
      QC1Sunrise.aggregate([
        ...pipeline,
        { $unwind: "$DefectArray" },
        { $group: { _id: "$DefectArray.defectName" } }
      ]).exec()
    ]);

    res.json({
      lineNos: uniqueLineNos
        .map((item) => item._id)
        .filter(Boolean)
        .sort((a, b) => parseInt(a) - parseInt(b)), // Sort numerically
      MONos: uniqueMONos
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Colors: uniqueColors
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Sizes: uniqueSizes
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      Buyers: uniqueBuyers
        .map((item) => item._id)
        .filter(Boolean)
        .sort(),
      defectNames: uniqueDefectNames
        .map((item) => item._id)
        .filter(Boolean)
        .sort()
    });
  } catch (err) {
    console.error("Error fetching QC1 Sunrise filter values:", err);
    res.status(500).json({
      message: "Failed to fetch filter values",
      error: err.message
    });
  }
});

/* ------------------------------
   Cutting Inspection ENDPOINTS
------------------------------ */

// New endpoint to save cutting inspection data
app.post("/api/save-cutting-inspection", async (req, res) => {
  try {
    const {
      inspectionDate,
      cutting_emp_id,
      cutting_emp_engName,
      cutting_emp_khName,
      cutting_emp_dept,
      cutting_emp_section,
      moNo,
      lotNo,
      color,
      tableNo,
      planLayerQty,
      actualLayerQty,
      totalPcs,
      cuttingtableLetter,
      cuttingtableNo,
      marker,
      markerRatio,
      totalBundleQty,
      bundleQtyCheck,
      totalInspectionQty,
      cuttingtype,
      garmentType,
      inspectionData
    } = req.body;

    const existingDoc = await CuttingInspection.findOne({
      inspectionDate,
      moNo,
      lotNo,
      color,
      tableNo
    });

    if (existingDoc) {
      // Append new inspectionData to existing document
      existingDoc.inspectionData.push(inspectionData);
      await existingDoc.save();
      res.status(200).json({ message: "Data appended successfully" });
    } else {
      // Create a new document
      const newDoc = new CuttingInspection({
        inspectionDate,
        cutting_emp_id,
        cutting_emp_engName,
        cutting_emp_khName,
        cutting_emp_dept,
        cutting_emp_section,
        moNo,
        lotNo,
        color,
        tableNo,
        planLayerQty,
        actualLayerQty,
        totalPcs,
        cuttingtableLetter,
        cuttingtableNo,
        marker,
        markerRatio,
        totalBundleQty,
        bundleQtyCheck,
        totalInspectionQty,
        cuttingtype,
        garmentType,
        inspectionData: [inspectionData]
      });
      await newDoc.save();
      res.status(200).json({ message: "Data saved successfully" });
    }
  } catch (error) {
    console.error("Error saving cutting inspection data:", error);
    res
      .status(500)
      .json({ message: "Failed to save data", error: error.message });
  }
});

// New GET endpoint to fetch filtered cutting inspection reports
app.get("/api/cutting-inspection-report", async (req, res) => {
  try {
    const { startDate, endDate, moNo, lotNo, color, tableNo } = req.query;

    let match = {};

    // Date filtering using $expr for string dates
    if (startDate || endDate) {
      match.$expr = match.$expr || {};
      match.$expr.$and = match.$expr.$and || [];
      if (startDate) {
        const normalizedStartDate = normalizeDateString(startDate);
        match.$expr.$and.push({
          $gte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedStartDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
      if (endDate) {
        const normalizedEndDate = normalizeDateString(endDate);
        match.$expr.$and.push({
          $lte: [
            {
              $dateFromString: {
                dateString: "$inspectionDate",
                format: "%m/%d/%Y"
              }
            },
            {
              $dateFromString: {
                dateString: normalizedEndDate,
                format: "%m/%d/%Y"
              }
            }
          ]
        });
      }
    }

    // Other filters with case-insensitive regex
    if (moNo) match.moNo = new RegExp(moNo, "i");
    if (lotNo) match.lotNo = new RegExp(lotNo, "i");
    if (color) match.color = new RegExp(color, "i");
    if (tableNo) match.tableNo = new RegExp(tableNo, "i");

    const inspections = await CuttingInspection.find(match);

    if (!inspections.length) {
      return res.status(200).json({
        totalPcs: 0,
        totalPass: 0,
        totalReject: 0,
        totalRejectMeasurement: 0,
        totalRejectDefects: 0,
        totalInspectionQty: 0
      });
    }

    // Aggregate totals
    let totalPcs = 0;
    let totalPass = 0;
    let totalReject = 0;
    let totalRejectMeasurement = 0;
    let totalRejectDefects = 0;
    let totalInspectionQty = 0;

    inspections.forEach((doc) => {
      totalInspectionQty += doc.totalInspectionQty;
      doc.inspectionData.forEach((data) => {
        totalPcs += data.totalPcs;
        totalPass += data.totalPass;
        totalReject += data.totalReject;
        totalRejectMeasurement += data.totalRejectMeasurement;
        totalRejectDefects += data.totalRejectDefects;
      });
    });

    res.status(200).json({
      totalPcs,
      totalPass,
      totalReject,
      totalRejectMeasurement,
      totalRejectDefects,
      totalInspectionQty
    });
  } catch (error) {
    console.error("Error fetching cutting inspection report:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch report", error: error.message });
  }
});

// Endpoint to fetch distinct MO Nos
app.get("/api/cutting-inspection-mo-nos", async (req, res) => {
  try {
    const moNos = await CuttingInspection.distinct("moNo");
    res.json(moNos.filter((mo) => mo));
  } catch (error) {
    console.error("Error fetching MO Nos:", error);
    res.status(500).json({ message: "Failed to fetch MO Nos" });
  }
});

// Endpoint to fetch distinct filter options based on MO No
app.get("/api/cutting-inspection-filter-options", async (req, res) => {
  try {
    const { moNo } = req.query;
    let match = {};
    if (moNo) match.moNo = new RegExp(moNo, "i");

    const lotNos = await CuttingInspection.distinct("lotNo", match);
    const colors = await CuttingInspection.distinct("color", match);
    const tableNos = await CuttingInspection.distinct("tableNo", match);

    res.json({
      lotNos: lotNos.filter((lot) => lot),
      colors: colors.filter((color) => color),
      tableNos: tableNos.filter((table) => table)
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({ message: "Failed to fetch filter options" });
  }
});

/* ------------------------------
   User Auth ENDPOINTS
------------------------------ */

const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decodedToken = jwt.verify(token, "your_jwt_secret");
    req.userId = decodedToken.userId; // Set the userId in the request object
    next();
  } catch (error) {
    res
      .status(401)
      .json({ message: "Authentication failed", error: error.message });
  }
};

const generateRandomString = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// ------------------------
// Multer Storage Setup
// ------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.userId;
    if (!userId) {
      return cb(new Error("User ID is not defined"));
    }
    const dir = path.join(
      __dirname,
      "../public/storage/profiles/",
      userId.toString()
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const randomString = Math.random().toString(36).substring(2, 34);
    cb(null, `${randomString}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: Images Only!");
    }
  }
}).single("profile");

/* ------------------------------
   User Management old ENDPOINTS
------------------------------ */

// User routes
app.get("/users", async (req, res) => {
  try {
    const users = await UserMain.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// POST /users - Create an External User / Device
app.post("/users", async (req, res) => {
  try {
    const {
      emp_id,
      name,
      email,
      job_title,
      eng_name,
      kh_name,
      phone_number,
      dept_name,
      sect_name,
      working_status, // Optional, but will default to "Working"
      password
    } = req.body;

    console.log("Request body:", req.body);

    // >>> NEW: Check if a user with the same name already exists (case-insensitive)
    const existingUserByName = await UserMain.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    });
    if (existingUserByName) {
      return res.status(400).json({
        message: "User already exist! Please Use different Name"
      });
    }

    // If emp_id is provided, check if it already exists
    if (emp_id) {
      const existingUser = await UserMain.findOne({ emp_id });
      if (existingUser) {
        return res.status(400).json({
          message: "Employee ID already exists. Please use a different ID."
        });
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user with the provided fields.
    const newUser = new UserMain({
      emp_id,
      name,
      email,
      job_title: job_title || "External",
      eng_name,
      kh_name,
      phone_number,
      dept_name,
      sect_name,
      working_status: working_status || "Working",
      password: hashedPassword
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Failed to create user" });
  }
});

//Delete
app.delete("/users/:id", async (req, res) => {
  try {
    await UserMain.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/* ------------------------------
   Login Authentication ENDPOINTS
------------------------------ */

// Helper function to get profile image URL
const getProfileImageUrl = (user) => {
  if (user.profile && user.profile.trim() !== "") {
    return `${API_BASE_URL}/public/storage/profiles/${user._id}/${path.basename(
      user.profile
    )}`;
  }
  return user.face_photo || "/IMG/default-profile.png";
};

// When Login get user data
app.post("/api/get-user-data", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const decoded = jwt.verify(token, "your_jwt_secret");
    const user = await UserMain.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      emp_id: user.emp_id,
      name: user.name,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      profile: getProfileImageUrl(user), // Use helper function
      face_photo: user.face_photo, // Include face_photo
      //profile: user.profile,
      roles: user.roles,
      sub_roles: user.sub_roles
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch user data", error: error.message });
  }
});

// Avoid Logout when Refresh
app.post("/api/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }

    jwt.verify(refreshToken, "your_refresh_token_secret", (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }

      const accessToken = jwt.sign(
        { userId: decoded.userId },
        "your_jwt_secret",
        { expiresIn: "1h" }
      );

      res.status(200).json({ accessToken });
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to refresh token", error: error.message });
  }
});

// Login Endpoint
app.post("/api/login", async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    if (!ymProdConnection.readyState) {
      return res.status(500).json({ message: "Database not connected" });
    }

    const user = await UserMain.findOne({
      $or: [{ email: username }, { name: username }, { emp_id: username }]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    console.log("User Details", user);

    const isPasswordValid = await bcrypt.compare(
      password.trim(),
      user.password.replace("$2y$", "$2b$")
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    if (user.password.startsWith("$2y$")) {
      const newHashedPassword = await bcrypt.hash(password.trim(), 10);
      user.password = newHashedPassword;
      await user.save();
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      "your_jwt_secret",
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      "your_refresh_token_secret",
      { expiresIn: "30d" }
    );

    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        emp_id: user.emp_id,
        eng_name: user.eng_name,
        kh_name: user.kh_name,
        job_title: user.job_title,
        dept_name: user.dept_name,
        sect_name: user.sect_name,
        name: user.name,
        email: user.email,
        roles: user.roles,
        sub_roles: user.sub_roles,
        profile: getProfileImageUrl(user), // Use helper function
        face_photo: user.face_photo // Include face_photo
      }
    });
  } catch (error) {
    // console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in", error: error.message });
  }
});

/* ------------------------------
   Registration - Login Page ENDPOINTS
------------------------------ */
// Registration Endpoint
app.post("/api/register", async (req, res) => {
  try {
    const { emp_id, eng_name, kh_name, password, confirmPassword } = req.body;

    if (!emp_id || !eng_name || !password || !confirmPassword) {
      return res.status(400).json({
        message: "Employee ID, name, and password are required"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    const existingUser = await UserMain.findOne({ emp_id });

    if (existingUser) {
      return res.status(400).json({
        message: "Employee ID already registered"
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new UserMain({
      emp_id,
      eng_name,
      name: eng_name,
      kh_name: kh_name || "",
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date()
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to register user",
      error: error.message
    });
  }
});

// ------------------------
// GET /api/user-profile
// ------------------------
app.get("/api/user-profile", authenticateUser, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "your_jwt_secret");
    const user = await UserMain.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Determine profile image:
    // Use the custom uploaded image if available; otherwise use face_photo; else fallback.
    let profileImage = "";
    if (user.profile && user.profile.trim() !== "") {
      profileImage = `${API_BASE_URL}/public/storage/profiles/${
        decoded.userId
      }/${path.basename(user.profile)}`;
    } else if (user.face_photo && user.face_photo.trim() !== "") {
      profileImage = user.face_photo;
    } else {
      profileImage = "/IMG/default-profile.png";
    }

    res.status(200).json({
      emp_id: user.emp_id,
      name: user.name,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      working_status: user.working_status,
      phone_number: user.phone_number,
      eng_name: user.eng_name,
      kh_name: user.kh_name,
      job_title: user.job_title,
      email: user.email,
      profile: getProfileImageUrl(user), // Use helper function --- profileImage,
      face_photo: user.face_photo
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user profile",
      error: error.message
    });
  }
});

// ------------------------
// PUT /api/user-profile
// ------------------------

app.put("/api/user-profile", authenticateUser, upload, async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, "your_jwt_secret");
    const userId = decoded.userId;

    // Update additional fields along with existing ones.
    const updatedProfile = {
      emp_id: req.body.emp_id,
      name: req.body.name,
      dept_name: req.body.dept_name,
      sect_name: req.body.sect_name,
      phone_number: req.body.phone_number,
      eng_name: req.body.eng_name,
      kh_name: req.body.kh_name,
      job_title: req.body.job_title,
      email: req.body.email
    };

    // If a new image was uploaded, update the profile field.
    if (req.file) {
      updatedProfile.profile = `profiles/${userId}/${req.file.filename}`;
    }

    // Update the user document in the main collection.
    const user = await UserMain.findByIdAndUpdate(userId, updatedProfile, {
      new: true
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Update the phone_number in role_managment collection ---
    // For every document in role_managment that has a user with the same emp_id,
    // update that user's phone_number field.
    await RoleManagment.updateMany(
      { "users.emp_id": user.emp_id },
      { $set: { "users.$[elem].phone_number": user.phone_number } },
      { arrayFilters: [{ "elem.emp_id": user.emp_id }] }
    );

    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      message: "Failed to update user profile",
      error: error.message
    });
  }
});

// /* ------------------------------
//    Super Admin ENDPOINTS
// ------------------------------ */

// Adding Super Admin End point
app.post("/api/role-management/super-admin", async (req, res) => {
  try {
    const { user } = req.body;

    let superAdminRole = await RoleManagment.findOne({ role: "Super Admin" });

    if (!superAdminRole) {
      superAdminRole = new RoleManagment({
        role: "Super Admin",
        jobTitles: ["Developer"],
        users: []
      });
    }

    const userExists = superAdminRole.users.some(
      (u) => u.emp_id === user.emp_id
    );

    if (userExists) {
      return res.status(400).json({ message: "User is already a Super Admin" });
    }

    const userDetails = await UserMain.findOne(
      { emp_id: user.emp_id },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );

    if (!userDetails) {
      return res.status(404).json({ message: "User not found" });
    }

    superAdminRole.users.push({
      emp_id: userDetails.emp_id,
      name: userDetails.name,
      eng_name: userDetails.eng_name,
      kh_name: userDetails.kh_name,
      job_title: "Developer",
      dept_name: userDetails.dept_name,
      sect_name: userDetails.sect_name,
      working_status: userDetails.working_status,
      phone_number: userDetails.phone_number,
      face_photo: userDetails.face_photo
    });

    await superAdminRole.save();
    res.json({ message: "Super Admin registered successfully" });
  } catch (error) {
    console.error("Error registering super admin:", error);
    res.status(500).json({ message: "Failed to register super admin" });
  }
});

// Delete Super Admin endpoint
app.delete("/api/role-management/super-admin/:empId", async (req, res) => {
  try {
    const { empId } = req.params;

    // Find the Super Admin role
    const superAdminRole = await RoleManagment.findOne({ role: "Super Admin" });

    if (!superAdminRole) {
      return res.status(404).json({ message: "Super Admin role not found" });
    }

    // Check if the employee ID is in the protected list
    const protectedEmpIds = ["YM6702", "YM7903"];
    if (protectedEmpIds.includes(empId)) {
      return res.status(403).json({
        message: "Cannot delete protected Super Admin users"
      });
    }

    // Find the user index in the users array
    const userIndex = superAdminRole.users.findIndex(
      (user) => user.emp_id === empId
    );

    if (userIndex === -1) {
      return res.status(404).json({
        message: "User not found in Super Admin role"
      });
    }

    // Remove the user from the array using MongoDB update
    const result = await RoleManagment.updateOne(
      { role: "Super Admin" },
      {
        $pull: {
          users: { emp_id: empId }
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        message: "Failed to remove Super Admin"
      });
    }

    // Fetch the updated document
    const updatedRole = await RoleManagment.findOne({ role: "Super Admin" });

    res.json({
      message: "Super Admin removed successfully",
      updatedRole: updatedRole
    });
  } catch (error) {
    console.error("Error removing super admin:", error);
    res.status(500).json({ message: "Failed to remove super admin" });
  }
});

// /* ------------------------------
//    Role Management ENDPOINTS
// ------------------------------ */

app.get("/api/search-users", async (req, res) => {
  try {
    const { q } = req.query;
    const users = await UserMain.find(
      {
        emp_id: { $regex: q, $options: "i" },
        working_status: "Working"
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );
    res.json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Failed to search users" });
  }
});

app.get("/api/user-details", async (req, res) => {
  try {
    const { empId } = req.query;
    if (!empId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    const user = await UserMain.findOne(
      { emp_id: empId, working_status: "Working" },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

app.get("/api/job-titles", async (req, res) => {
  try {
    const jobTitles = await UserMain.distinct("job_title", {
      working_status: "Working"
    });
    res.json(jobTitles.filter((title) => title));
  } catch (error) {
    console.error("Error fetching job titles:", error);
    res.status(500).json({ message: "Failed to fetch job titles" });
  }
});

app.get("/api/users-by-job-title", async (req, res) => {
  try {
    const { jobTitle } = req.query;
    const users = await UserMain.find(
      {
        job_title: jobTitle,
        working_status: "Working"
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );
    res.json(users);
  } catch (error) {
    console.error("Error fetching users by job title:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.post("/api/role-management", async (req, res) => {
  try {
    const { role, jobTitles } = req.body;

    const users = await UserMain.find(
      {
        job_title: { $in: jobTitles },
        working_status: "Working"
      },
      "emp_id name eng_name kh_name job_title dept_name sect_name face_photo phone_number working_status"
    );

    let roleDoc = await RoleManagment.findOne({ role });

    if (roleDoc) {
      roleDoc.jobTitles = jobTitles;
      roleDoc.users = users.map((user) => ({
        emp_id: user.emp_id,
        name: user.name,
        eng_name: user.eng_name,
        kh_name: user.kh_name,
        job_title: user.job_title,
        dept_name: user.dept_name,
        sect_name: user.sect_name,
        working_status: user.working_status,
        phone_number: user.phone_number,
        face_photo: user.face_photo
      }));
    } else {
      roleDoc = new RoleManagment({
        role,
        jobTitles,
        users: users.map((user) => ({
          emp_id: user.emp_id,
          name: user.name,
          eng_name: user.eng_name,
          kh_name: user.kh_name,
          job_title: user.job_title,
          dept_name: user.dept_name,
          sect_name: user.sect_name,
          working_status: user.working_status,
          phone_number: user.phone_number,
          face_photo: user.face_photo
        }))
      });
    }

    await roleDoc.save();
    res.json({ message: `Role ${roleDoc ? "updated" : "added"} successfully` });
  } catch (error) {
    console.error("Error saving role:", error);
    res.status(500).json({ message: "Failed to save role" });
  }
});

// Update the /api/user-roles/:empId endpoint (remove duplicates and modify)
app.get("/api/user-roles/:empId", async (req, res) => {
  try {
    const { empId } = req.params;
    const roles = [];

    // Check Super Admin role first
    const superAdminRole = await RoleManagment.findOne({
      role: "Super Admin",
      "users.emp_id": empId
    });

    if (superAdminRole) {
      roles.push("Super Admin");
      return res.json({ roles }); // Return early if Super Admin
    }

    // Check Admin role
    const adminRole = await RoleManagment.findOne({
      role: "Admin",
      "users.emp_id": empId
    });

    if (adminRole) {
      roles.push("Admin");
      return res.json({ roles }); // Return early if Admin
    }

    // Get other roles
    const otherRoles = await RoleManagment.find({
      role: { $nin: ["Super Admin", "Admin"] },
      "users.emp_id": empId
    });

    otherRoles.forEach((roleDoc) => {
      roles.push(roleDoc.role);
    });

    res.json({ roles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ message: "Failed to fetch user roles" });
  }
});

app.get("/api/role-management", async (req, res) => {
  try {
    const roles = await RoleManagment.find({}).sort({
      role: 1 // Sort by role name
    });
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
});

// Get all roles from role_management collection
app.get("/api/role-management", async (req, res) => {
  try {
    const roles = await RoleManagment.find({});
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
});

// /* ------------------------------
//    User Management ENDPOINTS
// ------------------------------ */

// Get user roles
app.get("/api/user-roles/:empId", async (req, res) => {
  try {
    const { empId } = req.params;
    const roles = [];

    // Find all roles where this user exists
    const userRoles = await RoleManagment.find({
      "users.emp_id": empId
    });

    userRoles.forEach((role) => {
      if (!["Super Admin", "Admin"].includes(role.role)) {
        roles.push(role.role);
      }
    });

    res.json({ roles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    res.status(500).json({ message: "Failed to fetch user roles" });
  }
});

// Update user roles
app.post("/api/update-user-roles", async (req, res) => {
  try {
    const { emp_id, currentRoles, newRoles, userData } = req.body;

    // Find roles to remove (in currentRoles but not in newRoles)
    const rolesToRemove = currentRoles.filter(
      (role) => !newRoles.includes(role)
    );

    // Find roles to add (in newRoles but not in currentRoles)
    const rolesToAdd = newRoles.filter((role) => !currentRoles.includes(role));

    // Remove user from roles
    for (const role of rolesToRemove) {
      const roleDoc = await RoleManagment.findOne({ role });
      if (roleDoc) {
        // Remove user from users array
        roleDoc.users = roleDoc.users.filter((u) => u.emp_id !== emp_id);

        // Check if there are any other users with the same job title
        const otherUsersWithSameTitle = roleDoc.users.some(
          (u) => u.job_title === userData.job_title
        );
        if (!otherUsersWithSameTitle) {
          roleDoc.jobTitles = roleDoc.jobTitles.filter(
            (t) => t !== userData.job_title
          );
        }

        await roleDoc.save();
      }
    }

    // Add user to new roles
    for (const role of rolesToAdd) {
      const roleDoc = await RoleManagment.findOne({ role });
      if (roleDoc) {
        // Add job title if not exists
        if (!roleDoc.jobTitles.includes(userData.job_title)) {
          roleDoc.jobTitles.push(userData.job_title);
        }

        // Add user if not exists
        if (!roleDoc.users.some((u) => u.emp_id === emp_id)) {
          roleDoc.users.push(userData);
        }

        await roleDoc.save();
      }
    }

    res.json({
      success: true,
      message: "User roles updated successfully"
    });
  } catch (error) {
    console.error("Error updating user roles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user roles"
    });
  }
});

// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTPS Server is running on https://localhost:${PORT}`);
});
