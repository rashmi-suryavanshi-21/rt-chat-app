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
},
 // 🔥 NEW FIELDS (ADD HERE ONLY)
    isOnline: {
      type: Boolean,
      default: false,
    },


    lastSeen: {
      type: Date,
      default:null
    },

    totalOnlineTime: {
      type: Number,
      default: 0,
    },

sessionStart: {
      type: Date,
    },
    totalOnlineTimeToday: {
  type: Number,
  default: 0,
},
 lastActiveDate: {
    type: String,
    default: null,
  },

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