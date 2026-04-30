import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { generateUniqueUsername } from "../lib/username.js";

export const suggestUsernames = async (req, res) => {
  try {
    const { fullName } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: "fullName required" });
    }

    const generateUsername = (name) => {
      return (
        name.toLowerCase().replace(/\s+/g, "") +
        Math.floor(1000 + Math.random() * 9000)
      );
    };

    const suggestions = new Set();

    while (suggestions.size < 5) {
      const username = generateUsername(fullName);

      const exists = await User.findOne({ username });

      if (!exists) {
        suggestions.add(username);
      }
    }

    res.status(200).json({
      suggestions: Array.from(suggestions),
    });

  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signup = async (req, res) => {
  let { fullName, email, password } = req.body; // ✅ let instead of const

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    
    // 🔴 check email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    const username = await generateUniqueUsername(fullName);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      username, // ✅ only once
      email,
      password: hashedPassword,
    });

    generateToken(newUser._id, res);
    await newUser.save();

    res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      username: newUser.username,
      profilePic: newUser.profilePic,
      bio: newUser.bio,
    });

  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, username, password } = req.body;

  try {
    // 🔥 FIX: single user variable
    let user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      bio: user.bio, 
    });

  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName, username } = req.body; // 🔥 ADD THESE
    const userId = req.user._id;

    let updatedFields = {};

    // ✅ profile pic
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updatedFields.profilePic = uploadResponse.secure_url;
    }

    // ✅ bio
    if (bio !== undefined) {
      updatedFields.bio = bio;
    }

    // 🔥 ADD THESE
    if (fullName !== undefined) {
      updatedFields.fullName = fullName;
    }

    if (username !== undefined) {
      updatedFields.username = username;
    }

    // ❌ only throw error if NOTHING provided
    if (
      !profilePic &&
      bio === undefined &&
      fullName === undefined &&
      username === undefined
    ) {
      return res.status(400).json({ message: "No data provided to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatedFields,
      { new: true }
    );

    res.status(200).json(updatedUser);

  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

