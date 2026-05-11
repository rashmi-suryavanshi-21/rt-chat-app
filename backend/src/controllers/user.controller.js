import User from "../models/user.model.js";

export const searchUsers = async (req, res) => {
  try {

    const query = req.query.query;

    if (!query) {
      return res.status(400).json({
        message: "Search query required",
      });
    }

    const users = await User.find({
      $and: [
        {
          _id: { $ne: req.user._id },
        },

        {
          $or: [
            {
              fullName: {
                $regex: query,
                $options: "i",
              },
            },

            {
              email: {
                $regex: query,
                $options: "i",
              },
            },

            {
              username: {
                $regex: query,
                $options: "i",
              },
            },
          ],
        },
      ],
    }).select("-password");
console.log(users);
    res.status(200).json(users);

  } catch (error) {

    console.log(
      "Search error:",
      error.message
    );

    res.status(500).json({
      message: "Server error",
    });

  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req.params.username.toLowerCase().trim(),
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const { fullName, username, bio } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullName, username, bio },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed" });
  }
};