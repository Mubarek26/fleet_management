const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const validator = require("validator");
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },

  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },

  email: {
      type: String,
       unique: true,
       required: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email address']
        
  },

  password: {
    type: String,
    required: true,
    select:false
  },

  role: {
    type: String,
    enum: [
      "SHIPPER",
      "VENDOR",
      "DRIVER",
      "COMPANY_ADMIN",
      "PRIVATE_TRANSPORTER",
      "BROKER",
      "SUPER_ADMIN"
    ],
    required: true
  },

  status: {
    type: String,
    enum: ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"],
    default: "PENDING"
  },
active: {
    type: Boolean,
    default: true
  },
  verificationLevel: {
    type: Number,
    default: 0
  },

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    default: null
  },

  isAvailable: {
    type: Boolean,
    default: false
    },
  passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date

}, { timestamps: true });




userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next(); // Proceed to the next middleware
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now()-1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    
    // console.log('🔍 JWT issued at:', JWTTimestamp);
    // console.log('🔍 Password changed at:', changedTimestamp);
    // console.log('🔍 Changed after?', JWTTimestamp < changedTimestamp);
    return JWTTimestamp < changedTimestamp; // Return true if password was changed after the token was issued
  }
  return false; // If no passwordChangedAt, return false
};


userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex'); // Generate a random token
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex'); // Hash the token before saving it
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Set expiration time for the token (10 minutes)
  // console.log({ resetToken }, this.resetPasswordToken);
  return resetToken;
};


module.exports = mongoose.model("User", userSchema);