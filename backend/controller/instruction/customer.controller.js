import { QASectionsBuyer } from "../MongoDB/dbConnectionController.js";

/**
 * Customer Controller
 * Handles operations related to customer/buyer data.
 */
const customerController = {
    /**
     * Retrieves the list of buyers/customers.
     * Maps the database result to a frontend-friendly format.
     * 
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    getBuyerName: async (req, res) => {
        try {
            const buyers = await QASectionsBuyer.find({}, { buyer: 1, buyerFullName: 1, _id: 0 }).lean();

            // Map to structure expected by frontend, with a fallback
            const results = buyers.map(b => ({
                name: b.buyer,
                fullName: b.buyerFullName || b.buyer,
                code: b.buyer === "Aritzia" ? "GPRT0007C" : "" // Default template
            }));

            if (results.length === 0) {
                results.push({
                    name: "GPRT",
                    fullName: "General Production Team",
                    code: "GPRT0007C"
                });
            }

            res.status(200).json(results);
        } catch (err) {
            logger.error("Error in getBuyerName:", { error: err.message, stack: err.stack });
            res.status(500).json({ error: "Failed to fetch buyer names" });
        }
    }
};

export default customerController;