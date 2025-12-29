const mongoose = require("mongoose");


const taskSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project", 
      required: true
    },

    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team", 
      required: true
    },

    owners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
        required: true
      }
    ],

    tags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tag" 
      }
    ],

    timeToComplete: {
      type: Number, 
      required: true,
      min: 1
    },

    status: {
      type: String,
      enum: ["To Do", "In Progress", "Completed", "Blocked"],
      default: "To Do"
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium"
    }
  },
  {
    timestamps: true // auto handles createdAt & updatedAt
  }
);

module.exports = mongoose.model("Task", taskSchema);
