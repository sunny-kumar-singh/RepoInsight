const mongoose = require("mongoose");

const db = mongoose
  .connect("mongodb://127.0.0.1:27017/GitRepo", {
    serverSelectionTimeoutMS: 50000, // Increase timeout to 50 seconds
    socketTimeoutMS: 45000, // Increase socket timeout to 45 seconds
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

module.exports = db;
