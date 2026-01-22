import { ymProdConnection } from "../MongoDB/dbConnectionController.js";

// Update the MONo search endpoint to handle partial matching
export const getMoNoSearchWashing = async (req, res) => {
    try {
        const term = req.query.term; // Changed from 'digits' to 'term'
        if (!term) {
            return res.status(400).json({ error: "Search term is required" });
        }

        const collection = ymProdConnection.db.collection("dt_orders");
        const yorksysCollection = ymProdConnection.db.collection("yorksys_orders");

        // Use a case-insensitive regex to match the term anywhere
        const regexPattern = new RegExp(term, "i");

        // Search both collections in parallel
        const [dtResults, yorksysResults] = await Promise.all([
            collection
                .find({
                    $or: [
                        { Order_No: { $regex: regexPattern } },
                        { CustStyle: { $regex: regexPattern } }
                    ]
                })
                .project({ Order_No: 1, _id: 0 })
                .limit(50)
                .toArray(),
            yorksysCollection
                .find({
                    $or: [
                        { moNo: { $regex: regexPattern } },
                        { style: { $regex: regexPattern } }
                    ]
                })
                .project({ moNo: 1, _id: 0 })
                .limit(50)
                .toArray()
        ]);

        // Combined unique Order Numbers / MO Numbers
        const uniqueMONos = [...new Set([
            ...dtResults.map((r) => r.Order_No),
            ...yorksysResults.map((r) => r.moNo)
        ])].filter(Boolean);

        console.log(`[DEBUG] Combined MONo search for "${term}": found ${dtResults.length} DT, ${yorksysResults.length} Yorksys results. Unique: ${uniqueMONos.length}`);

        res.json(uniqueMONos);
    } catch (error) {
        console.error("Error searching MONo:", error);
        res.status(500).json({ error: "Failed to search MONo" });
    }
};


// Update /api/order-details endpoint
export const getOrderDetailsWashing = async (req, res) => {
    try {
        const collection = ymProdConnection.db.collection("dt_orders");
        const yorksysCollection = ymProdConnection.db.collection("yorksys_orders");
        const specCollection = ymProdConnection.db.collection("buyer_spec_templates");

        let order = await collection.findOne({
            $or: [
                { Order_No: req.params.mono },
                { CustStyle: req.params.mono }
            ]
        });

        let source = "dt_orders";

        if (!order) {
            order = await yorksysCollection.findOne({
                $or: [
                    { moNo: req.params.mono },
                    { style: req.params.mono }
                ]
            });
            source = "yorksys_orders";
        }

        // Try to get sizes from ANF Spec Template regardless of where the order was found
        const specTemplate = await specCollection.findOne({ moNo: req.params.mono });
        const anfSizes = specTemplate?.specData?.map(s => s.size) || [];

        if (!order && anfSizes.length === 0) {
            return res.status(200).json({
                success: false,
                error: "Order not found",
                colors: [],
                sizeList: [],
                engName: "N/A",
                totalQty: 0,
                factoryname: "N/A",
                custStyle: "N/A",
                country: "N/A",
                colorSizeMap: {}
            });
        }

        // If we only have ANF sizes but no order, return a minimal object
        if (!order && anfSizes.length > 0) {
            return res.json({
                success: true,
                engName: "N/A",
                totalQty: 0,
                factoryname: "N/A",
                custStyle: "N/A",
                country: "N/A",
                colors: [],
                sizeList: anfSizes,
                colorSizeMap: {},
                source: "anf_specs"
            });
        }

        if (source === "yorksys_orders") {
            const colors = [...new Set(order.SKUData.filter(s => s.Color).map(s => s.Color.trim()))];
            return res.json({
                success: true,
                engName: order.product || "N/A",
                totalQty: order.MOSummary?.[0]?.TotalQty || 0,
                factoryname: order.factory || "N/A",
                custStyle: order.style || "N/A",
                country: order.destination || "N/A",
                colors: colors.map(c => ({ original: c })),
                sizeList: (anfSizes && anfSizes.length > 0) ? anfSizes : [],
                colorSizeMap: {},
                source: "yorksys_orders"
            });
        }

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
            sizeList: [...new Set([
                ...(order.SizeList || []).map(s => s.split(';')[0].trim()),
                ...anfSizes,
                ...Array.from(colorMap.values()).flatMap(c => Array.from(c.sizes.keys()))
            ])].filter(Boolean),

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
};

// Update /api/order-sizes endpoint
export const getOrderSizesWashing = async (req, res) => {
    try {
        const collection = ymProdConnection.db.collection("dt_orders");
        const order = await collection.findOne({
            $or: [
                { Order_No: req.params.mono },
                { CustStyle: req.params.mono }
            ]
        });

        if (!order) return res.status(200).json([]);

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
};
