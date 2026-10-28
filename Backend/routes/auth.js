const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../services/db");
const { authenticateToken, JWT_SECRET } = require("../middleware/auth");

const router = express.Router();

// ==================== REGISTER ====================
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, role, college, branch, gradYear } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Please fill all required fields"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = db.getUserByEmail(normalizedEmail);

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = db.createUser({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role,
            college: college || "Engineering College of Technology",
            branch: branch || "CSE",
            gradYear: gradYear || "2027",
            skills: [],
            interests: [],
            bio: ""
        });

        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        // Omit password from response
        const { password: _, ...userSafe } = newUser;

        res.status(201).json({
            message: "Account created successfully",
            token,
            user: userSafe
        });
    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({
            message: "Server error during registration"
        });
    }
});

// ==================== LOGIN ====================
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = db.getUserByEmail(normalizedEmail);

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        const { password: _, ...userSafe } = user;

        res.json({
            message: "Login successful",
            token,
            user: userSafe
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Server error during login"
        });
    }
});

// ==================== GET CURRENT USER ====================
router.get("/me", authenticateToken, (req, res) => {
    const { password, ...userSafe } = req.user;
    res.json({
        user: userSafe
    });
});

module.exports = router;
