const catchAsync = require("../utils/catchAsync");
const jwt = require("jsonwebtoken");
const User = require("../database/models/user.model");
const AppError = require("../utils/appError");
const promisify = require("util").promisify;
const crypto = require("crypto");
const { send } = require("process");
const validator = require("validator");
const path = require("path");
const { uploadMulterFile } = require("../utils/cloudinaryUpload");
const sendEmail = require("../utils/email");
const { sendSMS } = require("../services/afromessage.service");

const signToken = async (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = async (user, statusCode, res) => {
  const token = await signToken(user._id);
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
const sendVerificationLink = async (user) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1) Reset count if it's a new day
  if (!user.lastVerificationRequest || user.lastVerificationRequest < today) {
    user.verificationRequestCount = 0;
  }

  // 2) Check if limit reached
  if (user.verificationRequestCount >= 5) {
    throw new AppError("Maximum verification attempts (5) reached for today. Please try again tomorrow.", 429);
  }

  // Generate verification token
  const verificationToken = user.createEmailVerificationToken();
  
  // 3) Update count and timestamp
  user.verificationRequestCount += 1;
  user.lastVerificationRequest = now;
  
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #0f172a; padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; }
        .button { background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; margin: 30px 0; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
        .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -1px; }
        .logo span { color: #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Cargo<span>Dash</span></div>
        </div>
        <div class="content">
          <h2 style="color: #0f172a; margin-top: 0;">Verify Your Email Address</h2>
          <p>Hello ${user.fullName.split(' ')[0]},</p>
          <p>Thank you for using CargoDash. To keep your account secure, please verify your email address by clicking the button below:</p>
          <div style="text-align: center;">
            <a href="${verifyURL}" class="button">Verify My Email</a>
          </div>
          <p style="font-size: 14px; color: #64748b;">This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">If you're having trouble clicking the button, copy and paste the link below into your browser:</p>
          <p style="font-size: 12px; color: #3b82f6; word-break: break-all;">${verifyURL}</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CargoDash Logistics. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: "📧 Verify your CargoDash Email",
      html,
    });
  } catch (err) {
    console.error("Error sending verification email:", err);
  }

  // Send verification SMS
  const smsMessage = `CargoDash: Verify your account here: ${verifyURL}`;
  try {
    await sendSMS({
      to: user.phoneNumber,
      message: smsMessage,
    });
  } catch (err) {
    console.error("Error sending verification SMS:", err);
  }
};

exports.signup = catchAsync(async (req, res, next) => {
  const normalizedRole = (req.body.role || "SHIPPER").toUpperCase();
  const newUser = await User.create({
    fullName: req.body.fullName,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    phoneNumber: req.body.phoneNumber,
    role: normalizedRole,
  });

  await sendVerificationLink(newUser);

  res.status(201).json({
    status: "success",
    message: "User created. Verification link sent via email and SMS!",
    data: {
      user: newUser,
    },
  });
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Verification token is invalid or has expired", 400));
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Email verified successfully!",
  });
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

  const user = await User.findOne(query).select("+password +active +status +emailVerified +verificationRequestCount +lastVerificationRequest");
  console.log(`User found: ${user?.email}, Active: ${user?.active}, Status: ${user?.status}`);

  if (!user || !user.active || user.status === 'SUSPENDED') {
    let message = "This account is deactivated. Please contact support.";
    if (user?.status === 'SUSPENDED') {
      message = "Your account has been suspended. Please contact support.";
    }
    return next(new AppError(message, 403));
  }

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect credentials", 401));
  }

  if (!user.emailVerified) {
    await sendVerificationLink(user);
    return next(new AppError("Your email is not verified. A new verification link has been sent to your email and phone number.", 401));
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
  if (!freshUser.active || freshUser.status === 'SUSPENDED') {
    console.log('Fresh user:', freshUser);
    let message = "Your account is deactivated or deleted. Please contact support.";
    if (freshUser.status === 'SUSPENDED') {
      message = "Your account has been suspended. Please contact support.";
    }
    return next(new AppError(message, 403));
  }
  req.user = freshUser; // Attach the user to the request object

  next();
});


exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
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
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background-color: #0f172a; padding: 40px 20px; text-align: center; border-radius: 16px 16px 0 0; }
        .content { padding: 40px 30px; line-height: 1.6; color: #334155; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; }
        .button { background-color: #2563eb; color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; margin: 30px 0; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2); }
        .footer { text-align: center; padding: 20px; color: #94a3b8; font-size: 12px; }
        .logo { color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -1px; }
        .logo span { color: #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Cargo<span>Dash</span></div>
        </div>
        <div class="content">
          <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your CargoDash account. Click the button below to set a new password. This link is valid for <strong>10 minutes</strong>.</p>
          <div style="text-align: center;">
            <a href="${resetURL}" class="button">Reset My Password</a>
          </div>
          <p style="font-size: 14px; color: #64748b;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
          <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">If you're having trouble clicking the button, copy and paste the link below into your browser:</p>
          <p style="font-size: 12px; color: #3b82f6; word-break: break-all;">${resetURL}</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CargoDash Logistics. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const message = `Forgot your password? Reset it here: ${resetURL}. Valid for 10 minutes.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "🔒 Password Reset Instructions - CargoDash",
      message,
      html,
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
  return createSendToken(user, 200, res);
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
  return createSendToken(user, 200, res);
});
