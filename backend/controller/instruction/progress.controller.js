import { Progress as ProgressModel } from "../../models/instruction/index.js";

const ProgressController = {

    /**
     * Get progress for a specific user.
     * @param {Object} req 
     * @param {Object} res 
     */
    getProgressByUser: async (req, res) => {
        try {
            const { userId } = req.params;
            const progress = await ProgressModel.getByUserId(userId);
            res.status(200).json(progress);
        } catch (error) {
            logger.error("Error in getProgressByUser:", { error: error.message, stack: error.stack });
            res.status(500).json({ message: "Failed to fetch progress" });
        }
    },

    /**
     * Get progress for a user and translate content to target language.
     * @param {Object} req 
     * @param {Object} res 
     */
    getProgressByUserLanguage: async (req, res) => {
        const { userId, toLang } = req.params;

        if (!userId || !toLang) {
            return res.status(400).json({
                message: "userId and target language are required"
            });
        }

        try {
            const progress = await ProgressModel.translateAllContent(userId, toLang);

            if (!progress) {
                return res.status(404).json({
                    message: "Progress not found"
                });
            }

            res.status(200).json(progress);
        } catch (error) {
            logger.error("getProgressByUserLanguage failed", {
                userId,
                toLang,
                error: error.message,
                stack: error.stack
            });

            // Known / expected errors (e.g. language not supported)
            if (error.message?.includes("not supported")) {
                return res.status(400).json({
                    message: error.message
                });
            }

            res.status(500).json({
                message: "Failed to fetch progress"
            });
        }
    },

    /**
     * Update the status of a progress item (active/inactive).
     * Ensures only one item is active if setting to active.
     * @param {Object} req 
     * @param {Object} res 
     */
    updateStatus: async (req, res) => {
        const { userId, progressId } = req.params;
        const { status } = req.body;

        // Validate inputs
        if (!userId) return res.status(400).json({ message: "userId is required" });
        if (!progressId) return res.status(400).json({ message: "progressId is required" });
        if (!status || !["active", "inactive"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'active' or 'inactive'" });
        }

        try {
            // 1️⃣ If setting this one to active, set all others to inactive
            if (status === "active") {
                await ProgressModel.updateMany(
                    { user_id: userId, _id: { $ne: progressId } },
                    { $set: { status: "inactive" } },
                );
            }

            // 2️⃣ Update the selected progress
            const { matchedCount } = await ProgressModel.updateOne(
                { user_id: userId, _id: progressId },
                { $set: { status } },
            );

            if (matchedCount === 0) {
                return res.status(404).json({ message: "No progress found for this user" });
            }

            return res.status(200).json({
                message: "Status updated successfully"
            });
        } catch (err) {
            logger.error("Failed to update progress status", {
                userId,
                progressId,
                status,
                error: err.message,
                stack: err.stack
            });
            return res.status(500).json({ message: "Failed to update status" });
        }
    },

    /**
     * Generic update for progress items (status, languages, team, etc.)
     * @param {Object} req 
     * @param {Object} res 
     */
    updateProgress: async (req, res) => {
        const { userId, progressId } = req.params;
        const updates = req.body; // e.g., { status, team, source_language, target_languages }

        if (!userId || !progressId) {
            return res.status(400).json({ message: "userId and progressId are required" });
        }

        try {
            // Handle status exclusivity if status is being updated to 'active'
            if (updates.status === "active") {
                await ProgressModel.updateMany(
                    { user_id: userId, _id: { $ne: progressId } },
                    { $set: { status: "inactive" } }
                );
            }

            const { matchedCount } = await ProgressModel.updateOne(
                { user_id: userId, _id: progressId },
                { $set: updates }
            );

            if (matchedCount === 0) {
                return res.status(404).json({ message: "Progress not found" });
            }

            return res.status(200).json({
                message: "Progress updated successfully"
            });
        } catch (error) {
            logger.error("Failed to update progress", {
                userId,
                progressId,
                updates,
                error: error.message
            });
            return res.status(500).json({ message: "Failed to update progress" });
        }
    }

};

export default ProgressController;
