const mongoose = require("mongoose");

const signupVerificationSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, index: true },
    passwordHash: String,
    otp: String,
    expiresAt: Date,
  },
  { timestamps: true }
);

signupVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("SignupVerification", signupVerificationSchema);
