const bcrypt = require("bcrypt");

const passwordHash = async (password) => {
  const saltRounds = 10;
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    throw new error("Error Hashing Password!");
  }
};

module.exports = passwordHash;
