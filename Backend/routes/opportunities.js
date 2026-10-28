const express = require("express");
const db = require("../services/db");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ==================== GET ALL OPPORTUNITIES ====================
router.get("/", (req, res) => {
    try {
        const { type = "", search = "" } = req.query;
        let list = db.getOpportunities();

        if (type) {
            list = list.filter(o => o.type.toLowerCase() === type.toLowerCase());
        }

        if (search) {
            const query = search.toLowerCase();
            list = list.filter(o => {
                const titleMatch = o.title && o.title.toLowerCase().includes(query);
                const companyMatch = o.company && o.company.toLowerCase().includes(query);
                const descMatch = o.description && o.description.toLowerCase().includes(query);
                const locMatch = o.location && o.location.toLowerCase().includes(query);
                return titleMatch || companyMatch || descMatch || locMatch;
            });
        }

        res.json({
            count: list.length,
            opportunities: list
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch opportunities" });
    }
});

// ==================== POST OPPORTUNITY ====================
router.post("/", authenticateToken, (req, res) => {
    try {
        const {
            title,
            company,
            type,
            location,
            stipend,
            deadline,
            link,
            description,
            referralAvailable
        } = req.body;

        if (!title || !company || !type || !description) {
            return res.status(400).json({
                message: "Please fill required fields: title, company, type, description"
            });
        }

        const newOpp = db.createOpportunity({
            title: title.trim(),
            company: company.trim(),
            type,
            location: location || "Remote / Hybrid",
            stipend: stipend || "Disclosed upon application",
            postedBy: req.user.name,
            postedById: req.user.id,
            postedByRole: `${req.user.role.toUpperCase()} @ ${req.user.college}`,
            deadline: deadline || "Open until filled",
            link: link || "#",
            description: description.trim(),
            referralAvailable: !!referralAvailable
        });

        // Reward +20 reputation for sharing verified opportunities
        db.addReputation(req.user.id, 20, "Opportunity Provider");

        res.status(201).json({
            message: "Opportunity posted successfully! (+20 reputation earned)",
            opportunity: newOpp
        });
    } catch (error) {
        console.error("Post opportunity error:", error);
        res.status(500).json({ message: "Failed to post opportunity" });
    }
});

module.exports = router;
