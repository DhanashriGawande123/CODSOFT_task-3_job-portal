 
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const aiChatRoutes = require("./routes/aiChatRoutes");

const app = express();

// Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Home
app.get("/", (req, res) => {
  res.send("Job Portal API is running");
});

// Existing routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/jobs", require("./routes/jobs"));
app.use("/api/applications", require("./routes/applications"));

// AI Chatbot
app.use("/api/ai", aiChatRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    message: "Something went wrong on the server"
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


//cd server
//npx nodemon index.js