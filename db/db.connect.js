const mongoose = require("mongoose")

require("dotenv").config()

const mongoUri = process.env.MONGODB

const initDatabse = async () => {
try {
    await mongoose.connect(mongoUri);  
    console.log("connected successfully");
  } catch (error) {
    console.error("connection failed", error.message);
  }
}

module.exports = { initDatabse };