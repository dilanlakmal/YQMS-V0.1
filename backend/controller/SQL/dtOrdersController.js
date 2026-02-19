import cron from "node-cron";
import {
  poolFCSystem,
  sqlConnectionStatus,
  ensurePoolConnected,
} from "./sqlConnectionManager.js";
import { DtOrder } from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   DT Orders Data Migration
------------------------------ */

export async function syncDTOrdersData() {
  try {
    console.log("🔄 Starting DT Orders data migration...");

    try {
      await Promise.all([ensurePoolConnected(poolFCSystem, "FCSystem")]);
    } catch (connErr) {
      console.error(
        "❌ Failed to establish required connections:",
        connErr.message,
      );
      throw connErr;
    }
    const request = poolFCSystem.request();

    // 1. Fetch Order Headers
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

    // 2. Fetch Size Names
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
    sizeNamesResult.recordset.forEach((sizeRecord) => {
      const orderNo = sizeRecord.Order_No;
      const sizeMapping = {};

      const sizeColumns = [
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
        "110",
        "120",
        "130",
        "140",
        "150",
        "160",
        "170",
        "180",
        "190",
        "200",
        "210",
        "220",
        "230",
        "240",
        "250",
        "260",
        "270",
        "280",
        "290",
        "300",
        "310",
        "320",
        "330",
        "340",
        "350",
        "360",
        "370",
        "380",
        "390",
        "400",
      ];
      sizeColumns.forEach((seq) => {
        const sizeNameColumn = `Size_${seq}_Name`;
        if (sizeRecord[sizeNameColumn] && sizeRecord[sizeNameColumn] !== null) {
          sizeMapping[seq] = sizeRecord[sizeNameColumn].toString();
        }
      });
      orderSizeMapping.set(orderNo, sizeMapping);
    });

    // Process Cut Quantity data and create mapping
    const cutQtyMapping = new Map();
    cutQtyResult.recordset.forEach((record) => {
      const styleNo = record.StyleNo;
      const colorCode = record.ColorCode;
      const size = record.SIZE;
      const planQty = Number(record.TotalPlanQty) || 0;
      const cutQty = Number(record.TotalCutQty) || 0;

      const key = `${styleNo}_${colorCode}`;

      if (!cutQtyMapping.has(key)) {
        cutQtyMapping.set(key, {});
      }

      const colorCutData = cutQtyMapping.get(key);
      colorCutData[size] = {
        PlanCutQty: planQty,
        ActualCutQty: cutQty,
      };
    });

    // ---- Helper Functions ----

    function extractSizeDataAsObject(record, prefix = "Size_Seq", orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      const sizeObject = {};

      const allSizeColumns = [
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
        "110",
        "120",
        "130",
        "140",
        "150",
        "160",
        "170",
        "180",
        "190",
        "200",
        "210",
        "220",
        "230",
        "240",
        "250",
        "260",
        "270",
        "280",
        "290",
        "300",
        "310",
        "320",
        "330",
        "340",
        "350",
        "360",
        "370",
        "380",
        "390",
        "400",
      ];
      allSizeColumns.forEach((seq) => {
        const columnName = `${prefix}${seq}`;
        const quantity = record[columnName];

        if (quantity === null || quantity === undefined) {
          return;
        }

        if (quantity === 0) {
          if (orderNo !== "GPAF6117") {
            return;
          }
        }

        const sizeName = sizeMapping[seq] || `Size${seq}`;

        if (sizeName) {
          sizeObject[sizeName] = Number(quantity);
        }
      });
      return sizeObject;
    }

    function getOrderedSizeList(orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      const sizeList = [];

      const sizeSeqs = [
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
        "110",
        "120",
        "130",
        "140",
        "150",
        "160",
        "170",
        "180",
        "190",
        "200",
        "210",
        "220",
        "230",
        "240",
        "250",
        "260",
        "270",
        "280",
        "290",
        "300",
        "310",
        "320",
        "330",
        "340",
        "350",
        "360",
        "370",
        "380",
        "390",
        "400",
      ];

      sizeSeqs.forEach((seq) => {
        const val = sizeMapping[seq];
        if (val && val !== null && val !== "") {
          sizeList.push(val);
        }
      });

      return sizeList;
    }

    function convertSizeObjectToArray(sizeObject, orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};

      const sizeToSeqMapping = {};
      Object.entries(sizeMapping).forEach(([seq, sizeName]) => {
        sizeToSeqMapping[sizeName] = parseInt(seq);
      });

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
      if (!toleranceStr) return { fraction: "", decimal: 0 };

      let str = toleranceStr.toString().trim();
      let decimal = 0;

      str = str.replace(/['"]/g, "").trim();
      str = str.replace(/[⁄∕／]/g, "/");

      let isNegative = false;
      if (str.startsWith("-")) {
        isNegative = true;
        str = str.substring(1);
      }

      try {
        const mixedNumberPattern =
          /^(\d+(?:\.\d+)?)\s*[-\s　]\s*(\d+)\s*\/\s*(\d+)$/;
        const mixedMatch = str.match(mixedNumberPattern);

        if (mixedMatch) {
          const wholePart = parseFloat(mixedMatch[1]) || 0;
          const numerator = parseFloat(mixedMatch[2]) || 0;
          const denominator = parseFloat(mixedMatch[3]) || 1;
          decimal = wholePart + numerator / denominator;
        } else if (str.includes("/")) {
          const fractionPattern = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/;
          const fractionMatch = str.match(fractionPattern);

          if (fractionMatch) {
            const numerator = parseFloat(fractionMatch[1]) || 0;
            const denominator = parseFloat(fractionMatch[2]) || 1;
            decimal = numerator / denominator;
          } else {
            const parts = str.split("/");
            if (parts.length === 2) {
              const numerator = parseFloat(parts[0].trim()) || 0;
              const denominator = parseFloat(parts[1].trim()) || 1;
              decimal = numerator / denominator;
            } else {
              decimal = parseFloat(str) || 0;
            }
          }
        } else {
          decimal = parseFloat(str) || 0;
        }

        if (isNegative) {
          decimal = -decimal;
        }
      } catch (error) {
        console.error(
          `Error parsing tolerance value "${toleranceStr}":`,
          error,
        );
        const numbers = str.match(/\d+(?:\.\d+)?/g);
        if (numbers && numbers.length >= 1) {
          decimal = parseFloat(numbers[0]) || 0;
        } else {
          decimal = 0;
        }
      }

      if (isNaN(decimal)) {
        decimal = 0;
      }

      return {
        fraction: toleranceStr.toString(),
        decimal: Math.round(decimal * 10000) / 10000,
      };
    }

    function extractSpecsDataAsArray(record, orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      const specsArray = [];

      for (let i = 1; i <= 40; i++) {
        const sizeColumn = `Size${i}`;
        if (record[sizeColumn] && record[sizeColumn] !== null) {
          const value = record[sizeColumn].toString().trim();
          const seqNumber = (i * 10).toString();
          const sizeName = sizeMapping[seqNumber] || `Size${i}`;

          let decimal = 0;
          try {
            let cleanValue = value.replace(/[⁄∕／]/g, "/");

            const mixedNumberPattern =
              /^(\d+(?:\.\d+)?)\s*[-\s　]\s*(\d+)\s*\/\s*(\d+)$/;
            const mixedMatch = cleanValue.match(mixedNumberPattern);

            if (mixedMatch) {
              const wholePart = parseFloat(mixedMatch[1]) || 0;
              const numerator = parseFloat(mixedMatch[2]) || 0;
              const denominator = parseFloat(mixedMatch[3]) || 1;
              decimal = wholePart + numerator / denominator;
            } else if (cleanValue.includes("/")) {
              const fractionPattern =
                /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/;
              const fractionMatch = cleanValue.match(fractionPattern);

              if (fractionMatch) {
                const numerator = parseFloat(fractionMatch[1]) || 0;
                const denominator = parseFloat(fractionMatch[2]) || 1;
                decimal = numerator / denominator;
              } else {
                const parts = cleanValue.split("/");
                if (parts.length === 2) {
                  const numerator = parseFloat(parts[0].trim()) || 0;
                  const denominator = parseFloat(parts[1].trim()) || 1;
                  decimal = numerator / denominator;
                } else {
                  decimal = parseFloat(cleanValue) || 0;
                }
              }
            } else {
              decimal = parseFloat(cleanValue) || 0;
            }
          } catch (error) {
            console.error(`Error parsing spec value "${value}":`, error);
            const numbers = value.match(/\d+(?:\.\d+)?/g);
            if (numbers && numbers.length >= 1) {
              decimal = parseFloat(numbers[0]) || 0;
            } else {
              decimal = 0;
            }
          }

          if (isNaN(decimal)) {
            decimal = 0;
          }

          const specObject = {};
          specObject[sizeName] = {
            fraction: value,
            decimal: Math.round(decimal * 10000) / 10000,
          };
          specsArray.push(specObject);
        }
      }
      return specsArray;
    }

    function isEmptyOrContainsNumbers(value) {
      if (!value || value === null || value === undefined || value === "") {
        return true;
      }

      const str = value.toString().trim();
      if (str === "") {
        return true;
      }

      return /^\d+$/.test(str);
    }

    function convertEmptyToNull(value) {
      if (!value || value === null || value === undefined || value === "") {
        return null;
      }

      const str = value.toString().trim();
      return str === "" ? null : str;
    }

    // ---- Process Data ----

    const orderMap = new Map();

    // 1. Process Order Headers
    orderHeaderResult.recordset.forEach((header) => {
      const orderNo = header.Order_No;
      if (!orderMap.has(orderNo)) {
        const sizeData = extractSizeDataAsObject(header, "Size_Seq", orderNo);

        const orderedSizeList = getOrderedSizeList(orderNo);

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
          SizeList: orderedSizeList,
          OrderColors: [],
          OrderColorShip: [],
          SizeSpec: [],
        });
      }
    });

    // 2. Process Order Colors and Shipping
    const colorSummaryMap = new Map();
    const shipMap = new Map();
    orderColorsResult.recordset.forEach((record) => {
      const orderNo = record.Order_No;
      const colorCode = record.ColorCode;
      const shipSeqNo = record.ship_seq_no;
      const shipId = record.Ship_ID;

      if (orderMap.has(orderNo)) {
        const order = orderMap.get(orderNo);

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
            sizeTotals: {},
          });
        }

        const colorSummary = colorSummaryMap.get(colorKey);
        const sizes = extractSizeDataAsObject(record, "Size_Seq", orderNo);

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
            ShipSeqNo: [],
          });
        }

        const shipRecord = shipMap.get(shipKey);
        const existingSeq = shipRecord.ShipSeqNo.find(
          (seq) => seq.seqNo === shipSeqNo,
        );
        if (!existingSeq && shipSeqNo) {
          const sizesArray = convertSizeObjectToArray(sizes, orderNo);

          shipRecord.ShipSeqNo.push({
            seqNo: Number(shipSeqNo),
            Ship_ID: convertEmptyToNull(shipId),
            sizes: sizesArray,
          });
        }
      }
    });

    // Convert color summaries to the desired format
    const colorMap = new Map();
    for (const [colorKey, colorSummary] of colorSummaryMap) {
      const orderNo = colorKey.split("_")[0];
      const orderQtyArray = convertSizeObjectToArray(
        colorSummary.sizeTotals,
        orderNo,
      );

      colorMap.set(colorKey, {
        ColorCode: colorSummary.ColorCode,
        Color: colorSummary.Color,
        ChnColor: colorSummary.ChnColor,
        ColorKey: colorSummary.ColorKey,
        OrderQty: orderQtyArray,
        CutQty: {},
      });
    }

    // Add cut quantity data to colors
    let cutQtyMatchCount = 0;
    let totalColorProcessed = 0;

    for (const [orderNo, order] of orderMap) {
      for (const [colorKey, colorData] of colorMap) {
        if (colorKey.startsWith(orderNo + "_")) {
          totalColorProcessed++;
          const colorCode = colorData.ColorCode;

          const cutKey = `${orderNo}_${colorCode}`;

          if (cutQtyMapping.has(cutKey)) {
            const cutData = cutQtyMapping.get(cutKey);

            colorData.CutQty = {};

            Object.entries(cutData).forEach(([size, quantities]) => {
              colorData.CutQty[size] = {
                ActualCutQty: quantities.ActualCutQty,
                PlanCutQty: quantities.PlanCutQty,
              };
            });

            cutQtyMatchCount++;
          }
        }
      }
    }

    // Verify CutQty data
    let colorsWithCutQty = 0;
    for (const [colorKey, colorData] of colorMap) {
      if (Object.keys(colorData.CutQty).length > 0) {
        colorsWithCutQty++;
      }
    }

    // Add colors and shipping to orders
    for (const [orderNo, order] of orderMap) {
      for (const [colorKey, colorData] of colorMap) {
        if (colorKey.startsWith(orderNo + "_")) {
          order.OrderColors.push(colorData);
        }
      }

      for (const [shipKey, shipData] of shipMap) {
        if (shipKey.startsWith(orderNo + "_")) {
          order.OrderColorShip.push(shipData);
        }
      }
    }

    // 3. Process Size Specifications
    sizeSpecResult.recordset.forEach((spec) => {
      const jobNo = spec.JobNo;

      if (orderMap.has(jobNo)) {
        const order = orderMap.get(jobNo);

        try {
          const toleranceMinus = parseToleranceValue(spec.Tolerance);
          const tolerancePlus = parseToleranceValue(spec.Tolerance2);
          const specs = extractSpecsDataAsArray(spec, jobNo);

          const chineseArea = convertEmptyToNull(spec.ChineseArea);
          const chineseRemark = convertEmptyToNull(spec.ChineseRemark);
          let chineseName = null;

          if (isEmptyOrContainsNumbers(spec.ChineseArea)) {
            chineseName = chineseRemark;
          } else if (isEmptyOrContainsNumbers(spec.ChineseRemark)) {
            chineseName = chineseArea;
          } else {
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
              fraction: toleranceMinus.fraction || "",
              decimal: toleranceMinus.decimal,
            },
            TolerancePlus: {
              fraction: tolerancePlus.fraction || "",
              decimal: tolerancePlus.decimal,
            },
            SpecMemo: convertEmptyToNull(spec.SpecMemo),
            SizeSpecMeasUnit: convertEmptyToNull(spec.SizeSpecMeasUnit),
            Specs: specs || [],
          };

          order.SizeSpec.push(sizeSpecData);
        } catch (error) {
          console.error(
            `Error processing spec for job ${jobNo}, seq ${spec.Seq}:`,
            error.message,
          );
        }
      }
    });

    // 4. Save to MongoDB
    console.log("💾 Saving to MongoDB...");
    const finalDocs = Array.from(orderMap.values());

    const cleanedDocs = finalDocs.map((doc) => {
      if (doc.SizeSpec) {
        doc.SizeSpec = doc.SizeSpec.filter((spec) => {
          return (
            spec.Seq &&
            !isNaN(spec.Seq) &&
            !isNaN(spec.ToleranceMinus.decimal) &&
            !isNaN(spec.TolerancePlus.decimal)
          );
        });
      }

      const {
        isModify,
        modifiedAt,
        modifiedBy,
        modificationHistory,
        ...cleanDoc
      } = doc;
      return cleanDoc;
    });

    const uniqueDocs = cleanedDocs.reduce((acc, doc) => {
      const existingIndex = acc.findIndex(
        (existing) => existing.Order_No === doc.Order_No,
      );
      if (existingIndex === -1) {
        acc.push(doc);
      }
      return acc;
    }, []);

    // Get list of orders with isModify: true first
    const modifiedOrders = await DtOrder.find({ isModify: true }).select(
      "Order_No",
    );
    const modifiedOrderNos = new Set(
      modifiedOrders.map((order) => order.Order_No),
    );

    console.log(`📋 Found ${modifiedOrderNos.size} orders with isModify: true`);

    const ordersToUpdate = uniqueDocs.filter(
      (doc) => !modifiedOrderNos.has(doc.Order_No),
    );

    console.log(
      `📊 Orders to update: ${ordersToUpdate.length} out of ${uniqueDocs.length}`,
    );
    console.log(
      `📊 Orders to skip (manually modified): ${modifiedOrderNos.size}`,
    );

    const bulkOps = ordersToUpdate.map((doc) => ({
      updateOne: {
        filter: { Order_No: doc.Order_No },
        update: { $set: doc },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      try {
        const result = await DtOrder.bulkWrite(bulkOps, { ordered: false });

        return {
          success: true,
          totalOrders: uniqueDocs.length,
          processed: ordersToUpdate.length,
          matched: result.matchedCount,
          modified: result.modifiedCount,
          upserted: result.upsertedCount,
          skipped: modifiedOrderNos.size,
          cutQtyRecords: cutQtyResult.recordset.length,
          cutQtyMatchCount: cutQtyMatchCount,
          colorsWithCutQty: colorsWithCutQty,
        };
      } catch (bulkError) {
        console.error("❌ Bulk operation failed:", bulkError);

        if (bulkError.writeErrors) {
          bulkError.writeErrors.forEach((error, index) => {
            console.log(`   Error ${index + 1}: ${error.errmsg}`);
          });
        }

        if (bulkError.result) {
          return {
            success: false,
            partialSuccess: true,
            totalOrders: uniqueDocs.length,
            processed: ordersToUpdate.length,
            matched: bulkError.result.matchedCount,
            modified: bulkError.result.modifiedCount,
            upserted: bulkError.result.upsertedCount,
            skipped: modifiedOrderNos.size,
            errors: bulkError.writeErrors?.length || 0,
            cutQtyRecords: cutQtyResult.recordset.length,
            cutQtyMatchCount: cutQtyMatchCount,
            colorsWithCutQty: colorsWithCutQty,
          };
        }

        throw bulkError;
      }
    } else {
      return {
        success: true,
        message: "No records to update - all are manually modified",
        totalOrders: uniqueDocs.length,
        skipped: modifiedOrderNos.size,
      };
    }
  } catch (error) {
    console.error("❌ DT Orders sync failed:", error);
    throw error;
  }
}

// api/sync-dt-orders
export const syncDtOrders = async (req, res) => {
  try {
    const result = await syncDTOrdersData();
    res.json({
      success: true,
      message: "DT Orders data sync completed successfully",
      data: result,
    });
  } catch (error) {
    console.error("DT Orders sync API error:", error);
    res.status(500).json({
      success: false,
      message: "DT Orders data sync failed",
      error: error.message,
    });
  }
};

// Schedule to run every 3 hours
cron.schedule("0 */3 * * *", async () => {
  await syncDTOrdersData()
    .then((result) => {
      console.log("✅ DT Orders Data Sync completed ", result);
    })
    .catch((err) => {
      console.error("❌ DT Orders Data Sync failed", err);
    });
});
