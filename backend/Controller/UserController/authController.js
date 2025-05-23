import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import {
  UserMain, 
  RoleManagment, 
} from "../../Config/mongodb.js"; 
import { API_BASE_URL } from "../../../config.js"; 

// Helper function to get profile image URL
const getProfileImageUrl = (user) => {
  if (user.profile && user.profile.trim() !== "") {
    // Assuming user.profile stores the path relative to public/storage
    // e.g., 'profiles/userId/filename.ext'
    return `${API_BASE_URL}/storage/${user.profile}`;
  }
  return user.face_photo || "/IMG/default-profile.png"; // Fallback
};

export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (UserMain.db.readyState !== 1) {
      console.error("Database connection state (loginUser):", UserMain.db.readyState);
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
      user.password.replace("$2y$", "$2b$") // Handle old PHP hash format if necessary
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // If using old bcrypt format, update to new format upon successful login
    if (user.password.startsWith("$2y$")) {
      const newHashedPassword = await bcrypt.hash(password.trim(), 10);
      user.password = newHashedPassword;
      await user.save();
    }

    const accessToken = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "your_jwt_secret", // Use environment variable
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret", // Use environment variable
      { expiresIn: "30d" }
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
        roles: user.roles,
        sub_roles: user.sub_roles,
        profile: getProfileImageUrl(user),
        face_photo: user.face_photo,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Failed to log in", error: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const { emp_id, eng_name, kh_name, password, confirmPassword } = req.body;

    if (!emp_id || !eng_name || !password || !confirmPassword) {
      return res.status(400).json({ message: "Employee ID, name, and password are required" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await UserMain.findOne({ emp_id });
    if (existingUser) {
      return res.status(400).json({ message: "Employee ID already registered" });
    }

    const saltRounds = 12; // Or 10, consistent with login update
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new UserMain({
      emp_id,
      eng_name,
      name: eng_name, // Assuming name should be eng_name by default
      kh_name: kh_name || "",
      password: hashedPassword,
      created_at: new Date(),
      updated_at: new Date(),
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Failed to register user", error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { emp_id, newPassword } = req.body;

    if (!emp_id || !newPassword) {
      return res.status(400).json({ message: "Employee ID and new password are required" });
    }

    const user = await UserMain.findOne({ emp_id });
    if (!user) {
      return res.status(404).json({ message: "Employee ID not found" });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    user.updated_at = new Date();
    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // From authenticateUser middleware
    const user = await UserMain.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
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
      profile: getProfileImageUrl(user),
      face_photo: user.face_photo,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Failed to fetch user profile", error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId; // From authenticateUser middleware
    const updatedProfileData = {
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

    if (req.file) {
      updatedProfileData.profile = `profiles/${userId}/${req.file.filename}`;
    }

    const user = await UserMain.findByIdAndUpdate(userId, updatedProfileData, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await RoleManagment.updateMany(
      { "users.emp_id": user.emp_id },
      { $set: { "users.$[elem].phone_number": user.phone_number } },
      { arrayFilters: [{ "elem.emp_id": user.emp_id }] }
    );

    res.status(200).json({ message: "Profile updated successfully", user: { ...user.toObject(), profile: getProfileImageUrl(user) } });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update user profile", error: error.message });
  }
};

export const getUserDataByToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    const user = await UserMain.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      emp_id: user.emp_id,
      name: user.name,
      dept_name: user.dept_name,
      sect_name: user.sect_name,
      profile: getProfileImageUrl(user),
      face_photo: user.face_photo,
      roles: user.roles,
      sub_roles: user.sub_roles,
    });
  } catch (error) {
    console.error('Error fetching user data by token:', error);
    res.status(500).json({ message: 'Failed to fetch user data', error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || "your_refresh_token_secret", (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid refresh token" });
      }
      const accessToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET || "your_jwt_secret",
        { expiresIn: "1h" }
      );
      res.status(200).json({ accessToken });
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Failed to refresh token", error: error.message });
  }
};