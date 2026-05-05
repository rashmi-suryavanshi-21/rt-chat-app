import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,  
      lowercase: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
    },
    isBot: {
    type: Boolean,
    default: false
}
  },
  { timestamps: true }
);

// 🔥 TEXT INDEX FOR SEARCH (IMPORTANT)
userSchema.index({
  fullName: "text",
  username: "text",
  email: "text",
});;

const User = mongoose.model("User", userSchema);

export default User;