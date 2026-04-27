import User from "../models/user.model.js";

export const generateUsername = (name) => {
  return (
    name.toLowerCase().replace(/\s+/g, "") +
    Math.floor(1000 + Math.random() * 9000)
  );
};

export const generateUniqueUsername = async (name) => {
  let username;
  let exists = true;

  while (exists) {
    username = generateUsername(name);

    const user = await User.findOne({ username });

    if (!user) {
      exists = false;
    }
  }

  return username;
};