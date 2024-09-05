const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobileNo: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Admin", "Faculty", "Student"],
    required: true,
  },
  createdDate: {
    type: Date,
    required: true,
  },
  availability: {
    type: Boolean,
    default: true,
  },
});

const user = mongoose.model("User", UserSchema);

module.exports = user;
