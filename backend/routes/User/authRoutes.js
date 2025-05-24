import express from 'express';
import multer from "multer";
import path from "path";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import {
  loginUser,
  registerUser,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getUserDataByToken,
  refreshToken as refreshTokenController, 
} from '../../Controller/User/authController.js'; 

// Get __dirname equivalent in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Helper function to generate random string (if not in a shared utils file)
const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Multer Storage Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.userId; 
    if (!userId) {
      return cb(new Error('User ID is not defined'));
    }
    const dir = `../public/storage/profiles/${userId}`;
     fsPromises.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const randomString = generateRandomString(32);
    cb(null, `${randomString}${path.extname(file.originalname)}`);
  },
});

// Check file type
function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images Only! (jpeg, jpg, png, gif)'));
  }
}

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
});

// Middleware to authenticate user using JWT
const authenticateUser = (req, res, next) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ message: 'Authentication failed: No token provided' });
//     }
//     const token = authHeader.split(' ')[1];
//     const decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
//     req.userId = decodedToken.userId;
//     next();
//   } catch (error) {
//     res.status(401).json({ message: 'Authentication failed', error: error.message });
//   }
// };
try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'your_jwt_secret');
    req.userId = decodedToken.userId; // Set the userId in the request object
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

const router = express.Router();

// Public routes
router.post("/api/login", loginUser);
router.post("/api/register", registerUser);
router.post("/api/reset-password", resetPassword);
router.post("/api/refresh-token", refreshTokenController);
router.post("/api/get-user-data", getUserDataByToken); // This might need auth depending on use case

// Protected routes
router.get("/api/user-profile", authenticateUser, getUserProfile);
router.put("/api/user-profile", authenticateUser, upload.single('profile'), updateUserProfile);

export default router;

