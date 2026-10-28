const express = require("express");
const db = require("../services/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ==================== GET ALL PROJECTS ====================
router.get("/", (req, res) => {
    try {
        const { domain = "", status = "", search = "" } = req.query;
        let list = db.getProjects();

        if (domain) {
            list = list.filter(p => p.domain.toLowerCase().includes(domain.toLowerCase()));
        }

        if (status) {
            list = list.filter(p => p.status.toLowerCase() === status.toLowerCase());
        }

        if (search) {
            const query = search.toLowerCase();
            list = list.filter(p => {
                const titleMatch = p.title && p.title.toLowerCase().includes(query);
                const descMatch = p.description && p.description.toLowerCase().includes(query);
                const hackathonMatch = p.hackathon && p.hackathon.toLowerCase().includes(query);
                const skillsMatch = Array.isArray(p.skillsNeeded) && p.skillsNeeded.some(s => s.toLowerCase().includes(query));
                return titleMatch || descMatch || hackathonMatch || skillsMatch;
            });
        }

        res.json({
            count: list.length,
            projects: list
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch projects" });
    }
});

// ==================== CREATE PROJECT / HACKATHON TEAM ====================
router.post("/", authenticateToken, (req, res) => {
    try {
        const { title, domain, hackathon, description, skillsNeeded } = req.body;

        if (!title || !domain || !description) {
            return res.status(400).json({ message: "Please provide title, domain, and description" });
        }

        const skillsArray = Array.isArray(skillsNeeded)
            ? skillsNeeded
            : (skillsNeeded ? skillsNeeded.split(",").map(s => s.trim()).filter(Boolean) : []);

        const project = db.createProject({
            title: title.trim(),
            domain: domain.trim(),
            hackathon: hackathon ? hackathon.trim() : "Independent College Project",
            status: "Looking for Teammates",
            description: description.trim(),
            skillsNeeded: skillsArray,
            leaderName: req.user.name,
            leaderId: req.user.id,
            leaderRole: req.user.role
        });

        // Award +15 reputation for initiating collaboration
        db.addReputation(req.user.id, 15, "Hackathon Builder");

        res.status(201).json({
            message: "Project team created successfully! (+15 reputation earned)",
            project
        });
    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({ message: "Failed to create project" });
    }
});

// ==================== JOIN PROJECT TEAM ====================
router.post("/:id/join", authenticateToken, (req, res) => {
    try {
        const { note } = req.body;
        const project = db.joinProject(req.params.id, `${req.user.name} (${req.user.role})`);

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }

        res.json({
            message: `Successfully joined ${project.title}!`,
            project
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to join project" });
    }
});

module.exports = router;
