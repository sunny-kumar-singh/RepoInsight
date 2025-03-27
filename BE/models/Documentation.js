const mongoose = require("mongoose");

const DocumentationSchema = new mongoose.Schema({
  repoUrl: {
    type: String,
    required: true,
    unique: true,
  },
 
  docs: {
    type: mongoose.Schema.Types.Mixed, // Allows flexibility (String or JSON object)
    required: true,
  },
  files: {
    type: Map,
    of: String,
  }, // Add this line to store files
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Documentation = mongoose.model("Documentation", DocumentationSchema);
module.exports = Documentation;
