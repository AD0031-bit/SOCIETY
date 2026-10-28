const express = require("express");
const db = require("../services/db");
const { authenticateToken, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// ==================== GET ALL QUESTIONS ====================
router.get("/questions", (req, res) => {
    try {
        const { tag = "", category = "", search = "" } = req.query;
        let list = db.getQuestions();

        if (category) {
            list = list.filter(q => q.category && q.category.toLowerCase().includes(category.toLowerCase()));
        }

        if (tag) {
            const query = tag.toLowerCase();
            list = list.filter(q => Array.isArray(q.tags) && q.tags.some(t => t.toLowerCase() === query));
        }

        if (search) {
            const query = search.toLowerCase();
            list = list.filter(q => {
                const titleMatch = q.title && q.title.toLowerCase().includes(query);
                const tagMatch = Array.isArray(q.tags) && q.tags.some(t => t.toLowerCase().includes(query));
                const catMatch = q.category && q.category.toLowerCase().includes(query);
                return titleMatch || tagMatch || catMatch;
            });
        }

        res.json({
            count: list.length,
            questions: list
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch questions" });
    }
});

// ==================== GET QUESTION BY ID ====================
router.get("/questions/:id", (req, res) => {
    try {
        const question = db.getQuestionById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }
        res.json({ question });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch question" });
    }
});

// ==================== CREATE QUESTION ====================
router.post("/questions", authenticateToken, (req, res) => {
    try {
        const { title, category, tags } = req.body;

        if (!title || !category) {
            return res.status(400).json({ message: "Please provide question title and category" });
        }

        const tagsArray = Array.isArray(tags)
            ? tags
            : (tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : ["General"]);

        const question = db.createQuestion({
            title: title.trim(),
            category: category.trim(),
            tags: tagsArray,
            authorName: req.user.name,
            authorRole: req.user.role,
            authorId: req.user.id
        });

        // Award +5 reputation for asking thoughtful community questions
        db.addReputation(req.user.id, 5);

        res.status(201).json({
            message: "Question published successfully!",
            question
        });
    } catch (error) {
        console.error("Create question error:", error);
        res.status(500).json({ message: "Failed to post question" });
    }
});

// ==================== POST ANSWER ====================
router.post("/questions/:id/answers", authenticateToken, (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Answer content cannot be empty" });
        }

        const answer = db.addAnswer(req.params.id, {
            content: content.trim(),
            authorName: req.user.name,
            authorRole: req.user.role,
            authorId: req.user.id
        });

        if (!answer) {
            return res.status(404).json({ message: "Question not found" });
        }

        // Award +10 reputation for contributing an answer
        db.addReputation(req.user.id, 10, "Knowledge Sharer");

        res.status(201).json({
            message: "Answer posted successfully! (+10 reputation earned)",
            answer
        });
    } catch (error) {
        console.error("Post answer error:", error);
        res.status(500).json({ message: "Failed to post answer" });
    }
});

// ==================== UPVOTE QUESTION ====================
router.post("/questions/:id/upvote", (req, res) => {
    try {
        const upvotes = db.upvoteQuestion(req.params.id);
        if (upvotes === null) {
            return res.status(404).json({ message: "Question not found" });
        }
        res.json({ upvotes });
    } catch (error) {
        res.status(500).json({ message: "Failed to upvote" });
    }
});

// ==================== UPVOTE ANSWER ====================
router.post("/questions/:id/answers/:answerId/upvote", (req, res) => {
    try {
        const upvotes = db.upvoteAnswer(req.params.id, req.params.answerId);
        if (upvotes === null) {
            return res.status(404).json({ message: "Answer not found" });
        }
        res.json({ upvotes });
    } catch (error) {
        res.status(500).json({ message: "Failed to upvote answer" });
    }
});

// ==================== ACCEPT ANSWER ====================
router.post("/questions/:id/answers/:answerId/accept", authenticateToken, (req, res) => {
    try {
        const question = db.getQuestionById(req.params.id);
        if (!question) {
            return res.status(404).json({ message: "Question not found" });
        }

        if (question.authorId !== req.user.id) {
            return res.status(403).json({ message: "Only the question author can accept an answer" });
        }

        db.acceptAnswer(req.params.id, req.params.answerId);

        // Find author of the answer to award bonus reputation (+15)
        const answer = question.answers.find(a => a.id === req.params.answerId);
        if (answer && answer.authorId) {
            db.addReputation(answer.authorId, 15, "Top Answerer");
        }

        res.json({ message: "Answer accepted as best answer!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to accept answer" });
    }
});

module.exports = router;
