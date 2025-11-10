// Audit Image upload endpoint
export const saveAuditImage = async (req, res) => {
  if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    // Store relative path to be used with API_BASE_URL on client
    const relativePath = `/storage/audit_images/${req.file.filename}`;
    res.status(200).json({
      success: true,
      filePath: relativePath,
      message: "Image uploaded successfully"
    });
};