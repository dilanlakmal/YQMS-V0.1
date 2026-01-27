import { QASectionsBuyer } from "../../../MongoDB/dbConnectionController.js";

const getBuyerName = async (req, res) => {
    try {
        const buyers = await QASectionsBuyer.find({}, { buyer: 1, buyerFullName: 1, _id: 0 }).lean();

        // Map to structure expected by frontend, with a fallback
        const results = buyers.map(b => ({
            name: b.buyer,
            fullName: b.buyerFullName || b.buyer,
            code: "GPRT0007C" // Default template
        }));

        if (results.length === 0) {
            results.push({ name: "GPRT", fullName: "General Production Team", code: "GPRT0007C" });
        }

        res.status(200).json(results);
    } catch (err) {
        console.error("Error in getBuyerName:", err);
        res.status(500).json({ error: err.message });
    }
}

export { getBuyerName };