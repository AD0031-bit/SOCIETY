const express = require("express");
const db = require("../services/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ==================== GET ALL USERS / SEARCH ====================
router.get("/", (req, res) => {
    try {
        const { search = "", role = "", branch = "" } = req.query;
        let users = db.getUsers();

        // Safe projection (exclude passwords)
        users = users.map(({ password, ...u }) => u);

        if (role) {
            users = users.filter(u => u.role && u.role.toLowerCase() === role.toLowerCase());
        }

        if (branch) {
            users = users.filter(u => u.branch && u.branch.toLowerCase() === branch.toLowerCase());
        }

        if (search) {
            const query = search.toLowerCase();
            users = users.filter(u => {
                const nameMatch = u.name && u.name.toLowerCase().includes(query);
                const roleMatch = u.role && u.role.toLowerCase().includes(query);
                const branchMatch = u.branch && u.branch.toLowerCase().includes(query);
                const skillsMatch = Array.isArray(u.skills) && u.skills.some(s => s.toLowerCase().includes(query));
                const bioMatch = u.bio && u.bio.toLowerCase().includes(query);
                return nameMatch || roleMatch || branchMatch || skillsMatch || bioMatch;
            });
        }

        res.json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error("Fetch users error:", error);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

// ==================== LEADERBOARD ====================
router.get("/leaderboard", (req, res) => {
    try {
        let users = db.getUsers()
            .map(({ password, ...u }) => u)
            .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))
            .slice(0, 10);

        res.json({ leaderboard: users });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
});

// ==================== GET USER BY ID ====================
router.get("/:id", (req, res) => {
    try {
        const user = db.getUserById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const { password, ...userSafe } = user;
        res.json({ user: userSafe });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch user" });
    }
});

// ==================== UPDATE USER PROFILE ====================
router.put("/profile", authenticateToken, (req, res) => {
    try {
        const {
            name,
            college,
            branch,
            gradYear,
            bio,
            skills,
            interests,
            github,
            linkedin,
            isMentorAvailable,
            mentorBio,
            mentorTopics
        } = req.body;

        const updates = {};
        if (name !== undefined) updates.name = name.trim();
        if (college !== undefined) updates.college = college.trim();
        if (branch !== undefined) updates.branch = branch.trim();
        if (gradYear !== undefined) updates.gradYear = gradYear.trim();
        if (bio !== undefined) updates.bio = bio.trim();
        if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : skills.split(",").map(s => s.trim()).filter(Boolean);
        if (interests !== undefined) updates.interests = Array.isArray(interests) ? interests : interests.split(",").map(s => s.trim()).filter(Boolean);
        if (github !== undefined) updates.github = github.trim();
        if (linkedin !== undefined) updates.linkedin = linkedin.trim();
        if (isMentorAvailable !== undefined) updates.isMentorAvailable = !!isMentorAvailable;
        if (mentorBio !== undefined) updates.mentorBio = mentorBio.trim();
        if (mentorTopics !== undefined) updates.mentorTopics = Array.isArray(mentorTopics) ? mentorTopics : mentorTopics.split(",").map(s => s.trim()).filter(Boolean);

        const updatedUser = db.updateUser(req.user.id, updates);
        const { password, ...userSafe } = updatedUser;

        res.json({
            message: "Profile updated successfully",
            user: userSafe
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

module.exports = router;
