const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

// Import all routes
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const mentorshipRoutes = require("./routes/mentorship");
const opportunitiesRoutes = require("./routes/opportunities");
const projectsRoutes = require("./routes/projects");
const qaRoutes = require("./routes/qa");

// Initialize local database seed if needed
require("./services/db");

const app = express();

app.use(cors());
app.use(express.json());

// Serve Frontend static files
const frontendPath = path.resolve(__dirname, "..", "Frontend");
app.use(express.static(frontendPath));

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/mentorship", mentorshipRoutes);
app.use("/api/opportunities", opportunitiesRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/qa", qaRoutes);

// Database Status
console.log("-> Embedded SQLite Database active: Backend/data/society.db");

if (process.env.USE_MONGO === "true" && process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 3000 })
        .then(() => {
            console.log("MongoDB Atlas connected in parallel.");
        })
        .catch((error) => {
            console.log("Notice: MongoDB connection skipped:", error.message);
        });
}

app.get("/api", (req, res) => {
    res.json({
        name: "THE SOCIETY API",
        tagline: "Connect. Collaborate. Contribute.",
        status: "Online",
        endpoints: [
            "/api/auth",
            "/api/users",
            "/api/mentorship",
            "/api/opportunities",
            "/api/projects",
            "/api/qa"
        ]
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(` THE SOCIETY backend running on http://localhost:${PORT}`);
    console.log(`===============================================`);
});
