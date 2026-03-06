const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const User = require("../database/models/user.model");
const AppError = require("../utils/appError");
const promisify = require("util").promisify;
const crypto = require("crypto");
const { send } = require("process");
const sendEmail = require("../utils/email");
const validator = require("validator");
const path = require("path");
const singToken = async (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = await singToken(user._id);
  // remove password from output
  user.password = undefined;
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: process.env.NODE_ENV === "production"|| process.env.NODE_ENV === "development_render" ? true : false,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production"|| process.env.NODE_ENV === "development_render" ? "none" : "lax",
    path: "/"
  };
  res.cookie("jwt", token, cookieOptions);
  console.log(`JWT cookie set: ${token}`);
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
    const photoFilename = req.file ? req.file.filename : req.body.photo;
      const normalizedRole = (req.body.role || "SHIPPER").toUpperCase();
  const newUser = await User.create({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    photo: photoFilename || "default.jpg", // Default photo if not provided
    phoneNumber: req.body.phoneNumber, // Add phone number field
    // passwordChangedAt: req.body.passwordChangedAt || Date.now(),
    role: normalizedRole, // Default role if not provided
  });
  return createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, phoneNumber, identifier, password } = req.body;

  // Accept either email or phone number (identifier acts as a combined field)
  const loginField = (email || phoneNumber || identifier || "").toString().trim();

  if (!loginField || !password) {
    return next(new AppError("Please provide email or phone number and password!", 400));
  }

  let query;
  if (validator.isEmail(loginField)) {
    query = { email: loginField.toLowerCase() };
  } else if (/^\d+$/.test(loginField)) {
    query = { phoneNumber: loginField };
  } else {
    return next(new AppError("Please provide a valid email or phone number!", 400));
  }

  const user = await User.findOne(query).select("+password +active");

  if (!user || !user.active) {
    return next(new AppError("This account is deactivated. Please contact support.", 403));
  }

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect credentials", 401));
  }

  return createSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: false, // true if HTTPS
    sameSite: "lax", // careful: none requires secure:true in browsers
    path: "/",   // must match original cookie path
  });
  res.send('Cookie cleared!');
});

exports.protect = catchAsync(async (req, res, next) => {
  // Check if token is provided in Authorization header or cookies
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    console.log('Cookies:', req.cookies);
    console.log('Authorization header:', req.headers.authorization);
    return next(
      new AppError("you are not logged in! please login to get access", 401)
    );
    
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  if (!decoded) {
    return next(new AppError("Invalid token! Please login again.", 401));
  }
  // check the user still exists
  const freshUser = await User.findById(decoded.id).select("+active");
    console.log('Cookies:', req.cookies);
    console.log('Authorization header:', req.headers.authorization);
  if (!freshUser) {
    console.log('Token used for auth:', token);
    return next(
      new AppError(
        "The user belonging to this token does no longer exist.",
        401
      )
    );
  }
    console.log('Token used for auth:', token);
    console.log('Decoded JWT:', decoded);
  // Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    console.log('Decoded JWT:', decoded);
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    
    );
  }
  // check if the current user is active
  if (!freshUser.active) {
    console.log('Fresh user:', freshUser);
    return next(
      new AppError(
        "Your account is deactivated or deleted. Please contact support.",
        403
      )
    );
  }
  req.user = freshUser; // Attach the user to the request object

  next();
});


exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'superadmin') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permision to access this!", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get user based on posted emaiil
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with this email"));
  }
  //generate the random reset token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //send it to user's email
 const resetURL = `${process.env.FRONTEND_URL}/resetPassword/${resetToken}`;
  const message =
    `Forgot your password? Please use the link below to set a new password and confirm it` +
    `Confirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 minutes)",
      message,
    });
    return res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    console.error("Error sending password reset email:", err);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
  });
  // 2. if the token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }
  // 3. Update changedPasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  // 4. log the user in, send JWT
  const token = await singToken(user._id);
  // 5. Send response
  res.status(200).json({
    status: "success",
    token,
  });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  console.log(req.user._id);
  // 1. Get user from collection
  const user = await User.findById(req.user._id).select("+password");
  // 2. Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }
  // 3. If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  await user.save();
  // 4. Log user in, send JWT
  const token = await singToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});
