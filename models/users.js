const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const emailRegex =
  /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*@[A-Za-z0-9]+(\.[A-Za-z0-9]+)*\.(com|co|uk|in|org|net|io|co\.uk|co\.in)$/;



const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, "Please enter a valid email address"]
    },

    password: {
      type: String,
      required: true,

    }
  },
  { timestamps: true }
);

// hash password
 usersSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


module.exports = mongoose.model("User", usersSchema);
