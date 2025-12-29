const mongoose = require("mongoose");

const forgotPasswordVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, index: true },
    otp: String,
    expiresAt: Date,
  },
  { timestamps: true }
);

forgotPasswordVerificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
  "ForgotPasswordVerification",
  forgotPasswordVerificationSchema
);
