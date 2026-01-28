import express from "express";
import progressRoutes from "./progress.route.js";
import customerRoutes from "./customer.route.js";
import documentRoutes from "./document.route.js";

const router = express.Router();

router.use("/progress", progressRoutes);
router.use("/customer", customerRoutes);
router.use("/document", documentRoutes);

export default router;
