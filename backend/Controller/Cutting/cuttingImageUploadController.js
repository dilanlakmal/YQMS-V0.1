// Image upload endpoint
export const uploadImage = (req, res) => {
  console.log('Entering uploadImage controller');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body); 
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const url = `/storage/cutting/${req.file.filename}`;
    res.status(200).json({ url });
};