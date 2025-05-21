import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fsPromises from "fs/promises";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to generate random string
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
  destination: async (req, file, cb) => {
    const userId = req.userId;
    if (!userId) {
      return cb(new Error('User ID is not defined'));
    }
    const dir = path.join(__dirname, '..', '..', 'public', 'storage', 'profiles', userId);
    try {
      await fsPromises.mkdir(dir, { recursive: true });
      cb(null, dir);
    } catch (error) {
      console.error("Error creating directory:", error);
      cb(error);
    }
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
    cb('Error: Images Only!');
  }
}

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5000000 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb);
  },
}).single('profile');

// Middleware to authenticate user using JWT
const authenticateUser = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = jwt.verify(token, 'your_jwt_secret');
    req.userId = decodedToken.userId; // Set the userId in the request object
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed', error: error.message });
  }
};

export default function setupAuthRoutes(app, { UserMain, RoleManagment, API_BASE_URL }) {

  // Helper function to get profile image URL
  const getProfileImageUrl = (user) => {
    if (user.profile && user.profile.trim() !== "") {
      // Construct the URL based on the stored path relative to public/storage
      // Assuming user.profile stores something like 'profiles/userId/filename.ext'
      return `${API_BASE_URL}/storage/${user.profile}`;
    }
    return user.face_photo || "/IMG/default-profile.png";
  };

  // Login Endpoint
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password, rememberMe } = req.body;

      // Assuming UserMain is connected to the correct DB
      if (UserMain.db.readyState !== 1) {
         // Check the actual connection state
         console.error("Database connection state:", UserMain.db.readyState);
        return res.status(500).json({ message: "Database not connected" });
      }

      const user = await UserMain.findOne({
        $or: [{ email: username }, { name: username }, { emp_id: username }],
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      const isPasswordValid = await bcrypt.compare(
        password.trim(),
        user.password.replace("$2y$", "$2b$") // Handle old hash format if necessary
      );

      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // If using old bcrypt format, update to new format
      if (user.password.startsWith("$2y$")) {
        const newHashedPassword = await bcrypt.hash(password.trim(), 10);
        user.password = newHashedPassword;
        await user.save();
      }

      const accessToken = jwt.sign(
        { userId: user._id, email: user.email, name: user.name },
        "your_jwt_secret", // Use a strong, secret key
        { expiresIn: "1h" } // Access token expires in 1 hour
      );

      const refreshToken = jwt.sign(
        { userId: user._id },
        "your_refresh_token_secret", // Use a different strong, secret key
        { expiresIn: "30d" } // Refresh token expires in 30 days
      );

      res.status(200).json({
        message: "Login successful",
        accessToken,
        refreshToken,
        user: {
          emp_id: user.emp_id,
          eng_name: user.eng_name,
          kh_name: user.kh_name,
          job_title: user.job_title,
          dept_name: user.dept_name,
          sect_name: user.sect_name,
          name: user.name,
          email: user.email,
          roles: user.roles, // Assuming roles are stored directly on the user model
          sub_roles: user.sub_roles, // Assuming sub_roles are stored directly on the user model
          profile: getProfileImageUrl(user), // Use helper function to get the correct URL
          face_photo: user.face_photo // Include face_photo
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to log in", error: error.message });
    }
  });

  // Registration Endpoint
  app.post("/api/register", async (req, res) => {
    try {
      const { emp_id, eng_name, kh_name, password, confirmPassword } = req.body;

      if (!emp_id || !eng_name || !password || !confirmPassword) {
        return res.status(400).json({
          message: "Employee ID, name, and password are required",
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          message: "Passwords do not match",
        });
      }

      const existingUser = await UserMain.findOne({ emp_id });

      if (existingUser) {
        return res.status(400).json({
          message: "Employee ID already registered",
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = new UserMain({
        emp_id,
        eng_name,
        name: eng_name,
        kh_name: kh_name || "",
        password: hashedPassword,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await newUser.save();

      res.status(201).json({
        message: "User registered successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to register user",
        error: error.message,
      });
    }
  });

  // POST /api/reset-password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { emp_id, newPassword } = req.body;

      if (!emp_id || !newPassword) {
        return res.status(400).json({
          message: "Employee ID and new password are required",
        });
      }

      const user = await UserMain.findOne({ emp_id });

      if (!user) {
        return res.status(404).json({
          message: "Employee ID not found",
        });
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      user.password = hashedPassword;
      user.updated_at = new Date();

      await user.save();

      res.status(200).json({
        message: "Password reset successfully",
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to reset password",
        error: error.message,
      });
    }
  });

  // GET /api/user-profile
  app.get("/api/user-profile", authenticateUser, async (req, res) => {
    try {
      const userId = req.userId; // Get userId from authenticated middleware
      const user = await UserMain.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Determine profile image:
      // Use the custom uploaded image if available; otherwise use face_photo; else fallback.
      let profileImage = "";
      if (user.profile && user.profile.trim() !== "") {
        // Assuming user.profile stores the path relative to public/storage
        profileImage = `${API_BASE_URL}/storage/${user.profile}`;
      } else if (user.face_photo && user.face_photo.trim() !== "") {
        profileImage = user.face_photo;
      } else {
        profileImage = "/IMG/default-profile.png";
      }

      res.status(200).json({
        emp_id: user.emp_id,
        name: user.name,
        dept_name: user.dept_name,
        sect_name: user.sect_name,
        working_status: user.working_status,
        phone_number: user.phone_number,
        eng_name: user.eng_name,
        kh_name: user.kh_name,
        job_title: user.job_title,
        email: user.email,
        profile: profileImage, // URL for display
        face_photo: user.face_photo,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch user profile",
        error: error.message,
      });
    }
  });

  // PUT /api/user-profile
  app.put("/api/user-profile", authenticateUser, upload, async (req, res) => {
    try {
      const userId = req.userId; // Get userId from authenticated middleware

      // Update additional fields along with existing ones.
      const updatedProfile = {
        emp_id: req.body.emp_id,
        name: req.body.name,
        dept_name: req.body.dept_name,
        sect_name: req.body.sect_name,
        phone_number: req.body.phone_number,
        eng_name: req.body.eng_name,
        kh_name: req.body.kh_name,
        job_title: req.body.job_title,
        email: req.body.email,
      };

      // If a new image was uploaded, update the profile field.
      if (req.file) {
        // Store the path relative to the public/storage directory
        updatedProfile.profile = `profiles/${userId}/${req.file.filename}`;
      }

      // Update the user document in the main collection.
      const user = await UserMain.findByIdAndUpdate(userId, updatedProfile, {
        new: true,
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // --- Update the phone_number in role_managment collection ---
      // For every document in role_managment that has a user with the same emp_id,
      // update that user's phone_number field.
      await RoleManagment.updateMany(
        { "users.emp_id": user.emp_id },
        { $set: { "users.$[elem].phone_number": user.phone_number } },
        { arrayFilters: [{ "elem.emp_id": user.emp_id }] }
      );

      res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({
        message: "Failed to update user profile",
        error: error.message,
      });
    }
  });

  // GET /api/get-user-data (Fetch user data after login/refresh)
  app.post("/api/get-user-data", async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }

      const decoded = jwt.verify(token, "your_jwt_secret");
      const user = await UserMain.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        emp_id: user.emp_id,
        name: user.name,
        dept_name: user.dept_name,
        sect_name: user.sect_name,
        profile: getProfileImageUrl(user), // Use helper function
        face_photo: user.face_photo,
        roles: user.roles,
        sub_roles: user.sub_roles,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
    }
  });

  // POST /api/refresh-token (Refresh access token)
  app.post("/api/refresh-token", async (req, res) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token is required" });
      }

      jwt.verify(refreshToken, "your_refresh_token_secret", (err, decoded) => {
        if (err) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign(
          { userId: decoded.userId },
          "your_jwt_secret",
          { expiresIn: "1h" }
        );

        res.status(200).json({ accessToken });
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh token", error: error.message });
    }
  });

}