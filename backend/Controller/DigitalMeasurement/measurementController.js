import bcrypt from "bcrypt";
import {
    ymEcoConnection,
    UserMain,                
} from "../../Config/mongodb.js";

/* ------------------------------
   End Points - Digital Measurement
------------------------------ */

// New endpoint for filter options
export const getFilterOptions = async (req, res) => {
    try {
        const { factory, mono, custStyle, buyer, mode, country, origin, stage } =
          req.query;
        const orderFilter = {};
        if (factory) orderFilter.Factory = factory;
        if (mono) orderFilter.Order_No = mono;
        if (custStyle) orderFilter.CustStyle = custStyle;
        if (buyer) orderFilter.ShortName = buyer;
        if (mode) orderFilter.Mode = mode;
        if (country) orderFilter.Country = country;
        if (origin) orderFilter.Origin = origin;
    
        const factories = await ymEcoConnection.db
          .collection("dt_orders")
          .distinct("Factory", orderFilter);
        const monos = await ymEcoConnection.db
          .collection("dt_orders")
          .distinct("Order_No", orderFilter);
        const custStyles = await ymEcoConnection.db
          .collection("dt_orders")
          .distinct("CustStyle", orderFilter);
        const buyers = await ymEcoConnection.db
          .collection("dt_orders")
          .distinct("ShortName", orderFilter);
        const modes = await ymEcoConnection.db
          .collection("dt_orders")
          .distinct("Mode", orderFilter);
        const countries = await ymEcoConnection.db
          .collection("dt_orders")
          .distinct("Country", orderFilter);
        const origins = await ymEcoConnection.db
          .collection("dt_orders")
          .distinct("Origin", orderFilter);
    
        // Fetch distinct stages from measurement_data, filtered by dt_orders
        let measurementFilter = {};
        if (mono) {
          const order = await ymEcoConnection.db
            .collection("dt_orders")
            .findOne({ Order_No: mono }, { projection: { _id: 1 } });
          if (order) {
            measurementFilter.style_id = order._id.toString();
          }
        } else {
          const filteredOrders = await ymEcoConnection.db
            .collection("dt_orders")
            .find(orderFilter, { projection: { _id: 1 } })
            .toArray();
          const orderIds = filteredOrders.map((order) => order._id.toString());
          measurementFilter.style_id = { $in: orderIds };
        }
        if (stage) {
          measurementFilter.stage = stage;
        }
    
        const stages = await ymEcoConnection.db
          .collection("measurement_data")
          .distinct("stage", measurementFilter);
    
        // Fetch distinct emp_ids from UserMain where working_status is "Working"
        const empIds = await UserMain.distinct("emp_id", {
          working_status: "Working",
          emp_id: { $ne: null } // Ensure emp_id is not null
        });
    
        // Add minDate and maxDate from measurement_data
        const dateRange = await ymEcoConnection.db
          .collection("measurement_data")
          .aggregate([
            {
              $group: {
                _id: null,
                minDate: { $min: "$created_at" },
                maxDate: { $max: "$created_at" }
              }
            }
          ])
          .toArray();
        const minDate = dateRange.length > 0 ? dateRange[0].minDate : null;
        const maxDate = dateRange.length > 0 ? dateRange[0].maxDate : null;
    
        res.json({
          factories,
          monos,
          custStyles,
          buyers,
          modes,
          countries,
          origins,
          stages, // Added stages
          empIds, // Added empIds
          minDate,
          maxDate
        });
      } catch (error) {
        console.error("Error fetching filter options:", error);
        res.status(500).json({ error: "Failed to fetch filter options" });
      }
};

// New endpoint for buyer spec order details
export const getBuyerSpecOrderDetails = async (req, res) => {
    try {
        const collection = ymEcoConnection.db.collection("dt_orders");
        const order = await collection.findOne({ Order_No: req.params.mono });
    
        if (!order) return res.status(404).json({ error: "Order not found" });
    
        const colorSizeMap = {};
        const sizes = new Set();
        order.OrderColors.forEach((colorObj) => {
          const color = colorObj.Color.trim();
          colorSizeMap[color] = {};
          colorObj.OrderQty.forEach((sizeEntry) => {
            const sizeName = Object.keys(sizeEntry)[0].split(";")[0].trim();
            const quantity = sizeEntry[sizeName];
            if (quantity > 0) {
              colorSizeMap[color][sizeName] = quantity;
              sizes.add(sizeName);
            }
          });
        });
    
        // Apply the same tolerance correction logic as in /api/measurement-details
        const buyerSpec = order.SizeSpec.map((spec) => {
          // Adjust tolMinus and tolPlus to their fractional parts
          const tolMinusMagnitude =
            Math.abs(spec.ToleranceMinus.decimal) >= 1
              ? Math.abs(spec.ToleranceMinus.decimal) -
                Math.floor(Math.abs(spec.ToleranceMinus.decimal))
              : Math.abs(spec.ToleranceMinus.decimal);
          const tolPlusMagnitude =
            Math.abs(spec.TolerancePlus.decimal) >= 1
              ? Math.abs(spec.TolerancePlus.decimal) -
                Math.floor(Math.abs(spec.TolerancePlus.decimal))
              : Math.abs(spec.TolerancePlus.decimal);
    
          return {
            seq: spec.Seq,
            measurementPoint: spec.EnglishRemark,
            chineseRemark: spec.ChineseArea,
            tolMinus: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude, // Ensure tolMinus is negative
            tolPlus: tolPlusMagnitude,
            specs: spec.Specs.reduce((acc, sizeSpec) => {
              const sizeName = Object.keys(sizeSpec)[0];
              acc[sizeName] = sizeSpec[sizeName].decimal;
              return acc;
            }, {})
          };
        });
    
        res.json({
          moNo: order.Order_No,
          custStyle: order.CustStyle || "N/A",
          buyer: order.ShortName || "N/A",
          mode: order.Mode || "N/A",
          country: order.Country || "N/A",
          origin: order.Origin || "N/A",
          orderQty: order.TotalQty,
          colors: Object.keys(colorSizeMap),
          sizes: Array.from(sizes),
          colorSizeMap,
          buyerSpec
        });
      } catch (error) {
        console.error("Error fetching buyer spec order details:", error);
        res.status(500).json({ error: "Failed to fetch buyer spec order details" });
      }
};

// New endpoint for paginated MO Nos
export const getPaginatedMONos = async (req, res) => {
    try {
    const {
      page = 1,
      factory,
      custStyle,
      buyer,
      mode,
      country,
      origin
    } = req.query;
    const pageSize = 1; // One MO No per page
    const skip = (parseInt(page) - 1) * pageSize;

    const filter = {};
    if (factory) filter.Factory = factory;
    if (custStyle) filter.CustStyle = custStyle;
    if (buyer) filter.ShortName = buyer;
    if (mode) filter.Mode = mode;
    if (country) filter.Country = country;
    if (origin) filter.Origin = origin;

    const total = await ymEcoConnection.db
      .collection("dt_orders")
      .countDocuments(filter);
    const monos = await ymEcoConnection.db
      .collection("dt_orders")
      .find(filter)
      .project({ Order_No: 1, _id: 0 })
      .skip(skip)
      .limit(pageSize)
      .toArray();

    res.json({
      monos: monos.map((m) => m.Order_No),
      totalPages: Math.ceil(total / pageSize),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Error fetching paginated MONos:", error);
    res.status(500).json({ error: "Failed to fetch paginated MONos" });
  }
};

// New endpoint for overall measurement summary
export const getMeasurementSummary = async (req, res) => {
    try {
        const {
          factory,
          startDate,
          endDate,
          mono,
          custStyle,
          buyer,
          empId,
          stage
        } = req.query;
        const orderFilter = {};
        if (factory) orderFilter.Factory = factory;
        if (mono) orderFilter.Order_No = mono;
        if (custStyle) orderFilter.CustStyle = custStyle;
        if (buyer) orderFilter.ShortName = buyer;
    
        const selectedOrders = await ymEcoConnection.db
          .collection("dt_orders")
          .find(orderFilter)
          .toArray();
        const orderIds = selectedOrders.map((order) => order._id.toString());
    
        const measurementFilter = { style_id: { $in: orderIds } };
        if (startDate || endDate) {
          measurementFilter.created_at = {};
          if (startDate) {
            measurementFilter.created_at.$gte = new Date(startDate);
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            measurementFilter.created_at.$lte = end;
          }
        }
    
        if (empId) measurementFilter["user.name"] = empId;
    
        if (stage) measurementFilter.stage = stage;
    
        const measurementRecords = await ymEcoConnection.db
          .collection("measurement_data")
          .find(measurementFilter)
          .toArray();
        const orderIdToSizeSpec = {};
        selectedOrders.forEach((order) => {
          orderIdToSizeSpec[order._id.toString()] = order.SizeSpec.map((spec) => {
            const tolMinusMagnitude =
              Math.abs(spec.ToleranceMinus.decimal) >= 1
                ? Math.abs(spec.ToleranceMinus.decimal) -
                  Math.floor(Math.abs(spec.ToleranceMinus.decimal))
                : Math.abs(spec.ToleranceMinus.decimal);
            const tolPlusMagnitude =
              Math.abs(spec.TolerancePlus.decimal) >= 1
                ? Math.abs(spec.TolerancePlus.decimal) -
                  Math.floor(Math.abs(spec.TolerancePlus.decimal))
                : Math.abs(spec.TolerancePlus.decimal);
    
            return {
              ...spec,
              ToleranceMinus: {
                decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
              },
              TolerancePlus: { decimal: tolPlusMagnitude }
            };
          });
        });
    
        let orderQty = selectedOrders.reduce(
          (sum, order) => sum + order.TotalQty,
          0
        );
        let inspectedQty = measurementRecords.length;
        let totalPass = 0;
    
        measurementRecords.forEach((record) => {
          const sizeSpec = orderIdToSizeSpec[record.style_id];
          const size = record.size;
          let isPass = true;
          for (let i = 0; i < record.actual.length; i++) {
            if (record.actual[i].value === 0) continue;
            const spec = sizeSpec[i];
            const tolMinus = spec.ToleranceMinus.decimal;
            const tolPlus = spec.TolerancePlus.decimal;
    
            // Fix: Define specValue by extracting the buyer's spec for the given size
            const specValue = spec.Specs.find((s) => Object.keys(s)[0] === size)[
              size
            ].decimal;
    
            const lower = specValue + tolMinus;
            const upper = specValue + tolPlus;
            const actualValue = record.actual[i].value;
            if (actualValue < lower || actualValue > upper) {
              isPass = false;
              break;
            }
          }
          if (isPass) totalPass++;
        });
    
        const totalReject = inspectedQty - totalPass;
        const passRate =
          inspectedQty > 0 ? ((totalPass / inspectedQty) * 100).toFixed(2) : "0.00";
    
        res.json({ orderQty, inspectedQty, totalPass, totalReject, passRate });
      } catch (error) {
        console.error("Error fetching measurement summary:", error);
        res.status(500).json({ error: "Failed to fetch measurement summary" });
      }
};

// Updated endpoint for paginated measurement summary per MO No, only including MO Nos with inspectedQty > 0
export const getPaginatedMeasurementSummary = async (req, res) => {
    try {
    const {
      page = 1,
      pageSize = 10,
      factory,
      startDate,
      endDate,
      mono,
      custStyle,
      buyer,
      empId,
      stage
    } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    // Build measurement filter
    const measurementFilter = {};
    if (startDate || endDate) {
      measurementFilter.created_at = {};
      if (startDate) {
        measurementFilter.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        measurementFilter.created_at.$lte = end;
      }
    }

    if (empId) measurementFilter["user.name"] = empId;

    if (stage) measurementFilter.stage = stage;

    // Build order filter
    const orderFilter = {};
    if (factory) orderFilter.Factory = factory;
    if (mono) orderFilter.Order_No = mono;
    if (custStyle) orderFilter.CustStyle = custStyle;
    if (buyer) orderFilter.ShortName = buyer;

    // Aggregation pipeline to join dt_orders with measurement_data
    const pipeline = [
      { $match: orderFilter },
      {
        $lookup: {
          from: "measurement_data",
          let: { orderId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$style_id", "$$orderId"] },
                ...measurementFilter
              }
            }
          ],
          as: "measurements"
        }
      },
      { $match: { measurements: { $ne: [] } } }, // Only include orders with measurements
      { $sort: { Order_No: 1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: parseInt(pageSize) }]
        }
      }
    ];

    const result = await ymEcoConnection.db
      .collection("dt_orders")
      .aggregate(pipeline)
      .toArray();
    const orders = result[0].data || [];
    const totalOrders = result[0].metadata[0]?.total || 0;
    const totalPages = Math.ceil(totalOrders / parseInt(pageSize));

    const orderIds = orders.map((order) => order._id.toString());
    const measurementRecords = await ymEcoConnection.db
      .collection("measurement_data")
      .find({
        style_id: { $in: orderIds },
        ...measurementFilter
      })
      .toArray();

    const recordsByOrder = {};
    measurementRecords.forEach((record) => {
      const styleId = record.style_id;
      if (!recordsByOrder[styleId]) recordsByOrder[styleId] = [];
      recordsByOrder[styleId].push(record);
    });

    const orderIdToSizeSpec = {};
    orders.forEach((order) => {
      orderIdToSizeSpec[order._id.toString()] = order.SizeSpec.map((spec) => {
        const tolMinusMagnitude =
          Math.abs(spec.ToleranceMinus.decimal) >= 1
            ? Math.abs(spec.ToleranceMinus.decimal) -
              Math.floor(Math.abs(spec.ToleranceMinus.decimal))
            : Math.abs(spec.ToleranceMinus.decimal);
        const tolPlusMagnitude =
          Math.abs(spec.TolerancePlus.decimal) >= 1
            ? Math.abs(spec.TolerancePlus.decimal) -
              Math.floor(Math.abs(spec.TolerancePlus.decimal))
            : Math.abs(spec.TolerancePlus.decimal);

        return {
          ...spec,
          ToleranceMinus: {
            decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
          },
          TolerancePlus: { decimal: tolPlusMagnitude }
        };
      });
    });

    const summaryPerMono = orders.map((order) => {
      const styleId = order._id.toString();
      const records = recordsByOrder[styleId] || [];
      let inspectedQty = records.length;
      let totalPass = 0;
      records.forEach((record) => {
        const sizeSpec = orderIdToSizeSpec[styleId];
        const size = record.size;
        let isPass = true;
        for (let i = 0; i < record.actual.length; i++) {
          if (record.actual[i].value === 0) continue;
          const spec = sizeSpec[i];
          const tolMinus = spec.ToleranceMinus.decimal;
          const tolPlus = spec.TolerancePlus.decimal;

          const specValue = spec.Specs.find((s) => Object.keys(s)[0] === size)[
            size
          ].decimal;
          const lower = specValue + tolMinus;
          const upper = specValue + tolPlus;
          const actualValue = record.actual[i].value;
          if (actualValue < lower || actualValue > upper) {
            isPass = false;
            break;
          }
        }
        if (isPass) totalPass++;
      });
      const totalReject = inspectedQty - totalPass;
      const passRate =
        inspectedQty > 0
          ? ((totalPass / inspectedQty) * 100).toFixed(2)
          : "0.00";
      return {
        moNo: order.Order_No,
        custStyle: order.CustStyle,
        buyer: order.ShortName,
        country: order.Country,
        origin: order.Origin,
        mode: order.Mode,
        orderQty: order.TotalQty,
        inspectedQty,
        totalPass,
        totalReject,
        passRate
      };
    });

    res.json({ summaryPerMono, totalPages, currentPage: parseInt(page) });
  } catch (error) {
    console.error("Error fetching measurement summary per MO No:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch measurement summary per MO No" });
  }
};

// Updated endpoint for measurement details by MO No
export const getMeasurementDetailsByMono = async (req, res) => {
    try {
    const { startDate, endDate, empId, stage } = req.query;
    const order = await ymEcoConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: req.params.mono });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const styleId = order._id.toString();
    const measurementFilter = { style_id: styleId };
    if (startDate || endDate) {
      measurementFilter.created_at = {};
      if (startDate) {
        measurementFilter.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        measurementFilter.created_at.$lte = end;
      }
    }

    if (empId) measurementFilter["user.name"] = empId;

    if (stage) measurementFilter.stage = stage;

    const records = await ymEcoConnection.db
      .collection("measurement_data")
      .find(measurementFilter)
      .toArray();

    const correctedSizeSpec = order.SizeSpec.map((spec) => {
      const tolMinusMagnitude =
        Math.abs(spec.ToleranceMinus.decimal) >= 1
          ? Math.abs(spec.ToleranceMinus.decimal) -
            Math.floor(Math.abs(spec.ToleranceMinus.decimal))
          : Math.abs(spec.ToleranceMinus.decimal);
      const tolPlusMagnitude =
        Math.abs(spec.TolerancePlus.decimal) >= 1
          ? Math.abs(spec.TolerancePlus.decimal) -
            Math.floor(Math.abs(spec.TolerancePlus.decimal))
          : Math.abs(spec.TolerancePlus.decimal);

      return {
        ...spec,
        ToleranceMinus: {
          decimal: tolMinusMagnitude === 0 ? 0 : -tolMinusMagnitude
        },
        TolerancePlus: {
          decimal: tolPlusMagnitude
        }
      };
    });

    // Calculate the measurement point summary
    const measurementPointSummary = correctedSizeSpec
      .map((spec, index) => {
        const measurementPoint = spec.EnglishRemark;
        const tolMinus = spec.ToleranceMinus.decimal;
        const tolPlus = spec.TolerancePlus.decimal;

        let totalCount = 0;
        let totalPass = 0;

        records.forEach((record) => {
          const actualValue = record.actual[index]?.value || 0;
          if (actualValue === 0) return; // Skip if the value is 0

          totalCount++;

          // Get the buyer spec for the specific size of the record
          const buyerSpec =
            spec.Specs.find((s) => Object.keys(s)[0] === record.size)?.[
              record.size
            ]?.decimal || 0;

          const lower = buyerSpec + tolMinus;
          const upper = buyerSpec + tolPlus;

          if (actualValue >= lower && actualValue <= upper) {
            totalPass++;
          }
        });

        const totalFail = totalCount - totalPass;
        const passRate =
          totalCount > 0 ? ((totalPass / totalCount) * 100).toFixed(2) : "0.00";

        // Use the first valid size as a representative buyer spec (for summary display)
        const sampleRecord = records.find(
          (r) => r.size && spec.Specs.find((s) => Object.keys(s)[0] === r.size)
        );
        const buyerSpec = sampleRecord
          ? spec.Specs.find((s) => Object.keys(s)[0] === sampleRecord.size)?.[
              sampleRecord.size
            ]?.decimal || 0
          : 0;

        return {
          measurementPoint,
          buyerSpec,
          tolMinus,
          tolPlus,
          totalCount,
          totalPass,
          totalFail,
          passRate
        };
      })
      .filter((summary) => summary.totalCount > 0); // Only include measurement points with non-zero counts

    res.json({
      records: records.map((record) => ({
        ...record,
        reference_no: record.reference_no // Include reference_no in the response
      })),
      sizeSpec: correctedSizeSpec,
      measurementPointSummary // Add the new summary data
    });
  } catch (error) {
    console.error("Error fetching measurement details:", error);
    res.status(500).json({ error: "Failed to fetch measurement details" });
  }
};

// New endpoint to update measurement value
export const updateMeasurementValue = async (req, res) => {
    try {
    const { moNo, referenceNo, index, newValue } = req.body;

    // Validate inputs
    if (
      !moNo ||
      !referenceNo ||
      index === undefined ||
      newValue === undefined
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Convert newValue to a float and ensure it's a valid number
    const updatedValue = parseFloat(newValue);
    if (isNaN(updatedValue)) {
      return res.status(400).json({ error: "Invalid measurement value" });
    }

    // Find the dt_orders record to get its _id
    const order = await ymEcoConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: moNo });
    if (!order) {
      return res.status(404).json({ error: "Order not found for MO No" });
    }

    const styleId = order._id.toString();

    // Find the measurement_data record with matching style_id and reference_no
    const record = await ymEcoConnection.db
      .collection("measurement_data")
      .findOne({ style_id: styleId, reference_no: referenceNo });

    if (!record) {
      return res.status(404).json({ error: "Measurement record not found" });
    }

    // Validate the index against the actual array length
    if (!record.actual || index < 0 || index >= record.actual.length) {
      return res.status(400).json({ error: "Invalid index for actual array" });
    }

    // Update the specific index in the actual array
    const result = await ymEcoConnection.db
      .collection("measurement_data")
      .updateOne(
        { style_id: styleId, reference_no: referenceNo },
        {
          $set: {
            [`actual.${index}.value`]: updatedValue,
            updated_at: new Date()
          }
        }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Record not found during update" });
    }

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: "Failed to update the record" });
    }

    res.json({ message: "Measurement value updated successfully" });
  } catch (error) {
    console.error(
      "Error updating measurement value:",
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "Failed to update measurement value",
      details: error.message
    });
  }
};

// New endpoint to delete measurement record
export const deleteMeasurementRecord = async (req, res) => {
    try {
    const { moNo, referenceNo } = req.body;

    // Validate input
    if (!moNo || !referenceNo) {
      return res
        .status(400)
        .json({ error: "moNo and referenceNo are required" });
    }

    // Find the dt_orders record to get style_id
    const order = await ymEcoConnection.db
      .collection("dt_orders")
      .findOne({ Order_No: moNo }, { projection: { _id: 1 } });

    if (!order) {
      console.log("Order not found for MO No:", moNo);
      return res
        .status(404)
        .json({ error: `Order not found for MO No: ${moNo}` });
    }

    const styleId = order._id.toString();

    // Delete the measurement_data record
    const result = await ymEcoConnection.db
      .collection("measurement_data")
      .deleteOne({
        style_id: styleId,
        reference_no: referenceNo
      });

    if (result.deletedCount === 0) {
      console.log("No measurement record found for:", { styleId, referenceNo });
      return res.status(404).json({
        error: `No measurement record found for reference_no: ${referenceNo}`
      });
    }

    res
      .status(200)
      .json({ message: "Measurement record deleted successfully" });
  } catch (error) {
    console.error(
      "Error deleting measurement record:",
      error.message,
      error.stack
    );
    res.status(500).json({
      error: "Failed to delete measurement record",
      details: error.message
    });
  }
};