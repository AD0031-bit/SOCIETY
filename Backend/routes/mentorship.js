const express = require("express");
const db = require("../services/db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ==================== GET ALL AVAILABLE MENTORS ====================
router.get("/mentors", (req, res) => {
    try {
        const { topic = "", role = "" } = req.query;
        let mentors = db.getUsers()
            .filter(u => u.isMentorAvailable || u.role === "senior" || u.role === "alumni")
            .map(({ password, ...u }) => u);

        if (role) {
            mentors = mentors.filter(m => m.role.toLowerCase() === role.toLowerCase());
        }

        if (topic) {
            const query = topic.toLowerCase();
            mentors = mentors.filter(m => {
                const topicMatch = Array.isArray(m.mentorTopics) && m.mentorTopics.some(t => t.toLowerCase().includes(query));
                const skillMatch = Array.isArray(m.skills) && m.skills.some(s => s.toLowerCase().includes(query));
                const bioMatch = m.mentorBio && m.mentorBio.toLowerCase().includes(query);
                return topicMatch || skillMatch || bioMatch;
            });
        }

        res.json({
            count: mentors.length,
            mentors
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch mentors" });
    }
});

// ==================== SEND MENTORSHIP REQUEST ====================
router.post("/request", authenticateToken, (req, res) => {
    try {
        const { mentorId, topic, message, preferredTime } = req.body;

        if (!mentorId || !topic || !message) {
            return res.status(400).json({ message: "Please provide mentorId, topic, and message" });
        }

        const mentor = db.getUserById(mentorId);
        if (!mentor) {
            return res.status(404).json({ message: "Mentor not found" });
        }

        if (mentorId === req.user.id) {
            return res.status(400).json({ message: "You cannot request mentorship from yourself" });
        }

        const mentorship = db.createMentorship({
            menteeId: req.user.id,
            menteeName: req.user.name,
            menteeEmail: req.user.email,
            menteeRole: req.user.role,
            mentorId: mentor.id,
            mentorName: mentor.name,
            mentorEmail: mentor.email,
            mentorRole: mentor.role,
            topic: topic.trim(),
            message: message.trim(),
            preferredTime: preferredTime || "Flexible"
        });

        res.status(201).json({
            message: "Mentorship request sent successfully!",
            mentorship
        });
    } catch (error) {
        console.error("Mentorship request error:", error);
        res.status(500).json({ message: "Failed to submit mentorship request" });
    }
});

// ==================== GET USER'S MENTORSHIPS ====================
router.get("/my-requests", authenticateToken, (req, res) => {
    try {
        const all = db.getMentorships();
        const asMentee = all.filter(m => m.menteeId === req.user.id);
        const asMentor = all.filter(m => m.mentorId === req.user.id);

        res.json({
            asMentee,
            asMentor
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch mentorships" });
    }
});

// ==================== UPDATE MENTORSHIP STATUS ====================
router.put("/:id/status", authenticateToken, (req, res) => {
    try {
        const { status, notes } = req.body;
        const validStatuses = ["accepted", "declined", "completed"];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const list = db.getMentorships();
        const request = list.find(m => m.id === req.params.id);

        if (!request) {
            return res.status(404).json({ message: "Mentorship request not found" });
        }

        // Only the mentor or mentee can update
        if (request.mentorId !== req.user.id && request.menteeId !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this request" });
        }

        const updated = db.updateMentorshipStatus(req.params.id, status, notes);

        // If completed, award reputation points (+25) and badge to the mentor
        if (status === "completed") {
            db.addReputation(request.mentorId, 25, "Top Mentor");
        }

        res.json({
            message: `Mentorship marked as ${status}`,
            mentorship: updated
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update status" });
    }
});

module.exports = router;
