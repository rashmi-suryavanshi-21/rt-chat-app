import User from "../models/user.model.js";

export const searchUsers = async (req, res) => {
  try {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // khud ko exclude karo
        {
          $or: [
            { fullName: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      ],
    }).select("-password");

    res.status(200).json(users);
  } catch (error) {
    console.log("Search error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};