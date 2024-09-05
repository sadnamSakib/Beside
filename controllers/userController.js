const User = require("../models/userModel");
const authController = require("./authController");
const passwordHash = require("../utils/passwordHash");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

//route     POST /api/v1/user/register
const registerUser = catchAsync(async (req, res, next) => {
  const { userName, email, mobileNo, password, role } = req.body;

  const userExist = await User.findOne({ email });

  if (userExist) {
    return next(new AppError("User Already Exists!", 400));
  }
  let hashedPassword;
  try {
    hashedPassword = await passwordHash(password);
    console.log(hashedPassword);
  } catch (error) {
    return next(AppError("Error hashing password", 400));
  }

  const user = await User.create({
    userName,
    email,
    password: hashedPassword,
    mobileNo,
    role,
    createdDate: new Date(),
  });

  if (user) {
    authController.createSendToken(user, 200, res);
  } else {
    return next(new AppError("Token Generation Failed!", 400));
  }
});

module.exports = { registerUser };
