const jwt = require("jsonwebtoken");
const db = require("../services/db");

const JWT_SECRET = process.env.JWT_SECRET || "society_secret_key_2026";

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = db.getUserById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

// Optional auth middleware (attaches user if token present, but doesn't block)
function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = db.getUserById(decoded.id);
            if (user) {
                req.user = user;
            }
        } catch (err) {
            // Ignore token error for optional auth
        }
    }
    next();
}

module.exports = {
    authenticateToken,
    optionalAuth,
    JWT_SECRET
};
