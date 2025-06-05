const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // You'll need to install this: npm install helmet
const repoRoutes = require("./routes/repoRoutes");

const app = express();

app.use(cors());
// Body parser middleware

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Error helper functions
const createError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Home route
app.get("/", (req, res) => {
  res.json({ message: "App is running" });
});

// Routes
app.use("/api", repoRoutes);

// 404 handler
app.use((req, res, next) => {
  next(createError("Route not found", 404));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
  });

  // Default error
  let errorResponse = {
    message: err.message || "Internal Server Error",
    status: err.status || 500,
    error: process.env.NODE_ENV === "development" ? err.stack : undefined,
  };

  // Handle specific error types
  if (err.name === "ValidationError") {
    errorResponse.status = 400;
    errorResponse.message = "Validation Error";
    errorResponse.details = err.errors;
  } else if (err.name === "CastError") {
    errorResponse.status = 400;
    errorResponse.message = "Invalid ID format";
  } else if (err.code === 11000) {
    errorResponse.status = 409;
    errorResponse.message = "Duplicate field value";
  }

  res.status(errorResponse.status).json({ error: errorResponse });
});

// Start server only if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for potential testing
module.exports = app;
