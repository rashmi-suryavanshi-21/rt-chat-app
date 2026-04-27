import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

const generateUsername = (name) => {
  return (
    name.toLowerCase().replace(/\s+/g, "") +
    Math.floor(1000 + Math.random() * 9000)
  );
};

const generateUniqueUsername = async (name) => {
  let username;
  let isTaken = true;

  while (isTaken) {
    username = generateUsername(name);

    const user = await User.findOne({ username });
    if (!user) {
      isTaken = false; // mil gaya unique
    }
  }

  return username;
};


export const signup = async (req, res) => {
  let { fullName, username, email, password } = req.body; // ✅ let instead of const

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // 🔥 username handling
    if (!username || username.trim() === "") {
      username = await generateUniqueUsername(fullName);
    } else {
      username = username.toLowerCase().trim();

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
    }

    // 🔴 check email
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

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

// export const updateProfile = async (req, res) => {
//   try {
//     const { profilePic } = req.body;
//     const userId = req.user._id;

//     if (!profilePic) {
//       return res.status(400).json({ message: "Profile pic is required" });
//     }

//     const uploadResponse = await cloudinary.uploader.upload(profilePic);
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { profilePic: uploadResponse.secure_url },
//       { new: true }
//     );

//     res.status(200).json(updatedUser);
//   } catch (error) {
//     console.log("error in update profile:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio } = req.body; // ✅ added bio
    const userId = req.user._id;

    let updatedFields = {};

    // ✅ EXISTING LOGIC (UNCHANGED)
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updatedFields.profilePic = uploadResponse.secure_url;
    }

    // ✅ NEW BIO LOGIC (SAFE ADDITION)
    if (bio !== undefined) {
      updatedFields.bio = bio;
    }

    // ❌ only throw error if NOTHING provided
    if (!profilePic && bio === undefined) {
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
