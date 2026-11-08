const mongoose = require("mongoose");

const studyHistorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  studyText: {
    type: String,
    required: true,
  },

  task: {
    type: String,
    required: true,
    enum: ["summarize", "explain", "quiz"],
  },

  result: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const StudyHistory = mongoose.model("StudyHistory", studyHistorySchema);

module.exports = StudyHistory;
