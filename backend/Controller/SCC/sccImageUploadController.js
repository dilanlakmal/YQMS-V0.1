import bcrypt from "bcrypt";
import { API_BASE_URL } from "../../../config.js";

export const uploadSccImage = (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded." });
  }
  
  const filePath = `${API_BASE_URL}/storage/scc_images/${req.file.filename}`;
  res.json({ success: true, filePath: filePath, filename: req.file.filename });
};