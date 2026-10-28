/**
 * THE SOCIETY - SQLite Embedded Database Engine
 * Powered by native node:sqlite (Node.js 22+)
 * Stored at: Backend/data/society.db
 */

const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");

const DB_DIR = path.resolve(__dirname, "..", "data");
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, "society.db");
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode & foreign keys for high performance and durability
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

// Initialize Schema Tables
function initSchema() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            college TEXT DEFAULT 'Engineering College of Technology',
            branch TEXT DEFAULT 'CSE',
            gradYear TEXT DEFAULT '2027',
            bio TEXT DEFAULT '',
            skills TEXT DEFAULT '[]',
            interests TEXT DEFAULT '[]',
            github TEXT DEFAULT '',
            linkedin TEXT DEFAULT '',
            isMentorAvailable INTEGER DEFAULT 0,
            mentorBio TEXT DEFAULT '',
            mentorTopics TEXT DEFAULT '[]',
            reputation INTEGER DEFAULT 20,
            badges TEXT DEFAULT '["New Member"]',
            createdAt TEXT,
            updatedAt TEXT
        );

        CREATE TABLE IF NOT EXISTS opportunities (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            type TEXT NOT NULL,
            location TEXT DEFAULT 'Remote / Hybrid',
            stipend TEXT DEFAULT 'Disclosed upon application',
            postedBy TEXT NOT NULL,
            postedById TEXT NOT NULL,
            postedByRole TEXT DEFAULT '',
            deadline TEXT DEFAULT 'Open until filled',
            link TEXT DEFAULT '#',
            description TEXT NOT NULL,
            referralAvailable INTEGER DEFAULT 0,
            createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            domain TEXT NOT NULL,
            hackathon TEXT DEFAULT 'College Project',
            status TEXT DEFAULT 'Looking for Teammates',
            description TEXT NOT NULL,
            skillsNeeded TEXT DEFAULT '[]',
            leaderName TEXT NOT NULL,
            leaderId TEXT NOT NULL,
            leaderRole TEXT DEFAULT '',
            members TEXT DEFAULT '[]',
            createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS questions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            tags TEXT DEFAULT '[]',
            authorName TEXT NOT NULL,
            authorRole TEXT DEFAULT '',
            authorId TEXT NOT NULL,
            upvotes INTEGER DEFAULT 0,
            views INTEGER DEFAULT 1,
            createdAt TEXT
        );

        CREATE TABLE IF NOT EXISTS answers (
            id TEXT PRIMARY KEY,
            questionId TEXT NOT NULL,
            authorName TEXT NOT NULL,
            authorRole TEXT DEFAULT '',
            authorId TEXT NOT NULL,
            content TEXT NOT NULL,
            upvotes INTEGER DEFAULT 0,
            isAccepted INTEGER DEFAULT 0,
            createdAt TEXT,
            FOREIGN KEY (questionId) REFERENCES questions (id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS mentorships (
            id TEXT PRIMARY KEY,
            menteeId TEXT NOT NULL,
            menteeName TEXT NOT NULL,
            menteeEmail TEXT DEFAULT '',
            menteeRole TEXT DEFAULT '',
            mentorId TEXT NOT NULL,
            mentorName TEXT NOT NULL,
            mentorEmail TEXT DEFAULT '',
            mentorRole TEXT DEFAULT '',
            topic TEXT NOT NULL,
            message TEXT NOT NULL,
            preferredTime TEXT DEFAULT 'Flexible',
            status TEXT DEFAULT 'pending',
            notes TEXT DEFAULT '',
            createdAt TEXT,
            updatedAt TEXT
        );
    `);
}

initSchema();

// JSON Array Helper to convert SQLite TEXT <-> JS Arrays
function safeJsonParse(str, fallback = []) {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch {
        return fallback;
    }
}

// Map user row from SQLite into clean JS object
function formatUserRow(row) {
    if (!row) return null;
    return {
        ...row,
        isMentorAvailable: Boolean(row.isMentorAvailable),
        skills: safeJsonParse(row.skills, []),
        interests: safeJsonParse(row.interests, []),
        mentorTopics: safeJsonParse(row.mentorTopics, []),
        badges: safeJsonParse(row.badges, ["New Member"])
    };
}

// Map project row
function formatProjectRow(row) {
    if (!row) return null;
    return {
        ...row,
        skillsNeeded: safeJsonParse(row.skillsNeeded, []),
        members: safeJsonParse(row.members, [])
    };
}

// Map opportunity row
function formatOpportunityRow(row) {
    if (!row) return null;
    return {
        ...row,
        referralAvailable: Boolean(row.referralAvailable)
    };
}

// Seed Initial Data if database is freshly created
async function seedSqliteData() {
    const userCount = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
    if (userCount > 0) return;

    console.log("Seeding initial data into SQLite embedded database...");
    const defaultPasswordHash = await bcrypt.hash("Society@123", 10);
    const now = new Date().toISOString();

    const insertUser = db.prepare(`
        INSERT INTO users (
            id, name, email, password, role, college, branch, gradYear,
            bio, skills, interests, github, linkedin, isMentorAvailable,
            mentorBio, mentorTopics, reputation, badges, createdAt
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?
        )
    `);

    insertUser.run(
        "user-1",
        "Rahul Sharma",
        "rahul.sharma@college.edu",
        defaultPasswordHash,
        "senior",
        "Engineering College of Technology",
        "CSE",
        "2027",
        "Final year CSE undergrad. Interned at Google Cloud. Passionate about Distributed Systems, DSA, and mentoring juniors for placement season.",
        JSON.stringify(["C++", "DSA", "Distributed Systems", "Go", "Docker"]),
        JSON.stringify(["System Design", "Cloud Infrastructure", "Competitive Programming"]),
        "https://github.com",
        "https://linkedin.com",
        1,
        "Available for DSA interview prep, resume reviews, and off-campus placement guidance.",
        JSON.stringify(["DSA & LeetCode", "Off-Campus Placement", "Resume Review"]),
        185,
        JSON.stringify(["Top Mentor", "Placement Guide", "Verified Senior"]),
        now
    );

    insertUser.run(
        "user-2",
        "Ananya Mehta",
        "ananya.mehta@alumni.edu",
        defaultPasswordHash,
        "alumni",
        "Engineering College of Technology",
        "ECE",
        "2025",
        "Software Engineer at Microsoft. Previously SIH finalist and open-source contributor. Happy to refer deserving college students.",
        JSON.stringify(["Python", "PyTorch", "FastAPI", "Azure", "Machine Learning"]),
        JSON.stringify(["Generative AI", "Edge Computing", "Career Mentorship"]),
        "https://github.com",
        "https://linkedin.com",
        1,
        "Mentoring students interested in transitioning from core branches (ECE/EE) into High-Scale Software Engineering.",
        JSON.stringify(["Non-CS to Tech Transition", "Referral Prep", "Industry System Design"]),
        340,
        JSON.stringify(["Distinguished Alumni", "Top Mentor", "Referral Partner"]),
        now
    );

    insertUser.run(
        "user-3",
        "Arjun Verma",
        "arjun.verma@college.edu",
        defaultPasswordHash,
        "senior",
        "Engineering College of Technology",
        "IT",
        "2027",
        "Lead of College Developer Club. Fullstack developer with MERN & DevOps experience. Built multiple hackathon-winning products.",
        JSON.stringify(["React", "Node.js", "PostgreSQL", "AWS", "Next.js"]),
        JSON.stringify(["Hackathons", "Product Development", "Open Source"]),
        "https://github.com",
        "https://linkedin.com",
        1,
        "Ready to guide hackathon teams and project architecture.",
        JSON.stringify(["Hackathons Strategy", "Fullstack Architecture", "Web Dev"]),
        145,
        JSON.stringify(["Hackathon Pro", "Core Contributor"]),
        now
    );

    insertUser.run(
        "user-4",
        "Priya Kapoor",
        "priya.kapoor@alumni.edu",
        defaultPasswordHash,
        "alumni",
        "Engineering College of Technology",
        "CSE",
        "2024",
        "DevOps / SRE Engineer at Uber. Organizing weekly college mock interviews and career webinars.",
        JSON.stringify(["Kubernetes", "Linux", "Terraform", "Go", "AWS"]),
        JSON.stringify(["Site Reliability", "Cloud Native", "Public Speaking"]),
        "https://github.com",
        "https://linkedin.com",
        1,
        "Offering mock technical interviews and SRE/DevOps roadmap coaching.",
        JSON.stringify(["DevOps / Cloud Roadmap", "Mock Interviews"]),
        290,
        JSON.stringify(["Distinguished Alumni", "Community Champion"]),
        now
    );

    // Seed Opportunities
    const insertOpp = db.prepare(`
        INSERT INTO opportunities (
            id, title, company, type, location, stipend, postedBy, postedById,
            postedByRole, deadline, link, description, referralAvailable, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOpp.run(
        "opp-1",
        "Software Engineering Intern - Summer 2027",
        "Microsoft",
        "Internship",
        "Bengaluru / Hyderabad (Hybrid)",
        "₹1,25,000 / month",
        "Ananya Mehta",
        "user-2",
        "Alumni @ Microsoft",
        "2027-02-15",
        "https://careers.microsoft.com",
        "Open for 2nd and 3rd year B.Tech students. Focus on Data Structures, Algorithms, and Core Computer Science fundamentals.",
        1,
        now
    );

    insertOpp.run(
        "opp-2",
        "Backend Development Referral Opening",
        "CRED",
        "Referral",
        "Bengaluru (On-site)",
        "Competitive CTC + ESOPs",
        "Priya Kapoor",
        "user-4",
        "Alumni",
        "2027-01-30",
        "#",
        "Direct referral for 2026/2027 graduates. Must have strong fundamentals in Java/Go or Node.js and basic distributed database knowledge.",
        1,
        now
    );

    // Seed Projects
    const insertProj = db.prepare(`
        INSERT INTO projects (
            id, title, domain, hackathon, status, description, skillsNeeded,
            leaderName, leaderId, leaderRole, members, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProj.run(
        "proj-1",
        "Smart Campus Autonomous Attendance & Nav AI",
        "AI / Computer Vision",
        "Smart India Hackathon (SIH)",
        "Looking for Teammates",
        "Building an edge-device facial recognition and classroom navigation system for college students and faculty.",
        JSON.stringify(["Python", "OpenCV", "FastAPI", "React Frontend"]),
        "Arjun Verma",
        "user-3",
        "senior",
        JSON.stringify(["Arjun Verma (Lead / Backend)", "Rohan Das (Student)"]),
        now
    );

    // Seed Questions & Answers
    const insertQ = db.prepare(`
        INSERT INTO questions (
            id, title, category, tags, authorName, authorRole, authorId, upvotes, views, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertQ.run(
        "q-1",
        "How should a 2nd year student prepare for off-campus Tier-1 internships?",
        "Placements & Internships",
        JSON.stringify(["DSA", "Resume", "Off-Campus", "Internship"]),
        "Karan Patel",
        "Student",
        "student-temp",
        24,
        182,
        now
    );

    const insertAns = db.prepare(`
        INSERT INTO answers (
            id, questionId, authorName, authorRole, authorId, content, upvotes, isAccepted, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertAns.run(
        "ans-1",
        "q-1",
        "Rahul Sharma",
        "Senior",
        "user-1",
        "1. Focus heavily on Striver's SDE Sheet and LeetCode Mediums (Arrays, DP, Graphs).\n2. Build 2 deep projects rather than 5 generic to-do apps.\n3. Keep your LinkedIn active and start connecting with alumni 4 months before drive season.",
        18,
        1,
        now
    );

    console.log("SQLite database successfully seeded with initial college community records.");
}

seedSqliteData().catch(console.error);

// High-Level Data Service Layer (Same clean interface for all API routes)
const sqliteService = {
    // Users
    getUsers: () => {
        const rows = db.prepare("SELECT * FROM users ORDER BY createdAt DESC").all();
        return rows.map(formatUserRow);
    },

    getUserById: (id) => {
        const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
        return formatUserRow(row);
    },

    getUserByEmail: (email) => {
        if (!email) return null;
        const row = db.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?)").get(email);
        return formatUserRow(row);
    },

    createUser: (userData) => {
        const id = userData.id || `user-${Date.now()}`;
        const now = new Date().toISOString();

        const insert = db.prepare(`
            INSERT INTO users (
                id, name, email, password, role, college, branch, gradYear,
                bio, skills, interests, github, linkedin, isMentorAvailable,
                mentorBio, mentorTopics, reputation, badges, createdAt
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            )
        `);

        insert.run(
            id,
            userData.name,
            userData.email.toLowerCase(),
            userData.password,
            userData.role,
            userData.college || "Engineering College of Technology",
            userData.branch || "CSE",
            userData.gradYear || "2027",
            userData.bio || "",
            JSON.stringify(userData.skills || []),
            JSON.stringify(userData.interests || []),
            userData.github || "",
            userData.linkedin || "",
            userData.isMentorAvailable ? 1 : 0,
            userData.mentorBio || "",
            JSON.stringify(userData.mentorTopics || []),
            userData.reputation || 20,
            JSON.stringify(userData.badges || ["New Member"]),
            now
        );

        return sqliteService.getUserById(id);
    },

    updateUser: (id, updates) => {
        const current = sqliteService.getUserById(id);
        if (!current) return null;

        const merged = { ...current, ...updates, updatedAt: new Date().toISOString() };

        const stmt = db.prepare(`
            UPDATE users SET
                name = ?, college = ?, branch = ?, gradYear = ?,
                bio = ?, skills = ?, interests = ?, github = ?, linkedin = ?,
                isMentorAvailable = ?, mentorBio = ?, mentorTopics = ?,
                reputation = ?, badges = ?, updatedAt = ?
            WHERE id = ?
        `);

        stmt.run(
            merged.name,
            merged.college,
            merged.branch,
            merged.gradYear,
            merged.bio,
            JSON.stringify(merged.skills),
            JSON.stringify(merged.interests),
            merged.github,
            merged.linkedin,
            merged.isMentorAvailable ? 1 : 0,
            merged.mentorBio,
            JSON.stringify(merged.mentorTopics),
            merged.reputation,
            JSON.stringify(merged.badges),
            merged.updatedAt,
            id
        );

        return sqliteService.getUserById(id);
    },

    addReputation: (userId, points, badgeToAdd = null) => {
        const user = sqliteService.getUserById(userId);
        if (!user) return null;

        const newRep = (user.reputation || 0) + points;
        const badges = [...(user.badges || [])];
        if (badgeToAdd && !badges.includes(badgeToAdd)) {
            badges.push(badgeToAdd);
        }

        db.prepare("UPDATE users SET reputation = ?, badges = ? WHERE id = ?").run(
            newRep,
            JSON.stringify(badges),
            userId
        );

        return sqliteService.getUserById(userId);
    },

    // Mentorships
    getMentorships: () => {
        return db.prepare("SELECT * FROM mentorships ORDER BY createdAt DESC").all();
    },

    createMentorship: (data) => {
        const id = `ment-${Date.now()}`;
        const now = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO mentorships (
                id, menteeId, menteeName, menteeEmail, menteeRole,
                mentorId, mentorName, mentorEmail, mentorRole,
                topic, message, preferredTime, status, notes, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            data.menteeId,
            data.menteeName,
            data.menteeEmail || "",
            data.menteeRole || "",
            data.mentorId,
            data.mentorName,
            data.mentorEmail || "",
            data.mentorRole || "",
            data.topic,
            data.message,
            data.preferredTime || "Flexible",
            "pending",
            "",
            now
        );

        return db.prepare("SELECT * FROM mentorships WHERE id = ?").get(id);
    },

    updateMentorshipStatus: (id, status, notes = "") => {
        const now = new Date().toISOString();
        db.prepare("UPDATE mentorships SET status = ?, notes = ?, updatedAt = ? WHERE id = ?").run(
            status,
            notes,
            now,
            id
        );
        return db.prepare("SELECT * FROM mentorships WHERE id = ?").get(id);
    },

    // Opportunities
    getOpportunities: () => {
        const rows = db.prepare("SELECT * FROM opportunities ORDER BY createdAt DESC").all();
        return rows.map(formatOpportunityRow);
    },

    createOpportunity: (data) => {
        const id = `opp-${Date.now()}`;
        const now = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO opportunities (
                id, title, company, type, location, stipend,
                postedBy, postedById, postedByRole, deadline,
                link, description, referralAvailable, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            data.title,
            data.company,
            data.type,
            data.location || "Remote / Hybrid",
            data.stipend || "Disclosed upon application",
            data.postedBy,
            data.postedById,
            data.postedByRole || "",
            data.deadline || "Open until filled",
            data.link || "#",
            data.description,
            data.referralAvailable ? 1 : 0,
            now
        );

        return formatOpportunityRow(db.prepare("SELECT * FROM opportunities WHERE id = ?").get(id));
    },

    // Projects
    getProjects: () => {
        const rows = db.prepare("SELECT * FROM projects ORDER BY createdAt DESC").all();
        return rows.map(formatProjectRow);
    },

    createProject: (data) => {
        const id = `proj-${Date.now()}`;
        const now = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO projects (
                id, title, domain, hackathon, status, description,
                skillsNeeded, leaderName, leaderId, leaderRole, members, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            data.title,
            data.domain,
            data.hackathon || "College Project",
            data.status || "Looking for Teammates",
            data.description,
            JSON.stringify(data.skillsNeeded || []),
            data.leaderName,
            data.leaderId,
            data.leaderRole || "",
            JSON.stringify(data.members || [data.leaderName]),
            now
        );

        return formatProjectRow(db.prepare("SELECT * FROM projects WHERE id = ?").get(id));
    },

    joinProject: (projectId, memberName) => {
        const proj = sqliteService.getProjects().find(p => p.id === projectId);
        if (!proj) return null;

        if (!proj.members.includes(memberName)) {
            proj.members.push(memberName);
            db.prepare("UPDATE projects SET members = ? WHERE id = ?").run(
                JSON.stringify(proj.members),
                projectId
            );
        }

        return proj;
    },

    // Questions & Answers
    getQuestions: () => {
        const questions = db.prepare("SELECT * FROM questions ORDER BY createdAt DESC").all();
        return questions.map(q => {
            const answers = db.prepare("SELECT * FROM answers WHERE questionId = ? ORDER BY isAccepted DESC, upvotes DESC, createdAt ASC").all(q.id);
            return {
                ...q,
                tags: safeJsonParse(q.tags, []),
                answers: answers.map(a => ({
                    ...a,
                    isAccepted: Boolean(a.isAccepted)
                }))
            };
        });
    },

    getQuestionById: (id) => {
        const q = db.prepare("SELECT * FROM questions WHERE id = ?").get(id);
        if (!q) return null;

        const answers = db.prepare("SELECT * FROM answers WHERE questionId = ? ORDER BY isAccepted DESC, upvotes DESC, createdAt ASC").all(id);
        return {
            ...q,
            tags: safeJsonParse(q.tags, []),
            answers: answers.map(a => ({
                ...a,
                isAccepted: Boolean(a.isAccepted)
            }))
        };
    },

    createQuestion: (data) => {
        const id = `q-${Date.now()}`;
        const now = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO questions (
                id, title, category, tags, authorName, authorRole, authorId, upvotes, views, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            data.title,
            data.category,
            JSON.stringify(data.tags || []),
            data.authorName,
            data.authorRole || "",
            data.authorId,
            0,
            1,
            now
        );

        return sqliteService.getQuestionById(id);
    },

    addAnswer: (questionId, answerData) => {
        const id = `ans-${Date.now()}`;
        const now = new Date().toISOString();

        const stmt = db.prepare(`
            INSERT INTO answers (
                id, questionId, authorName, authorRole, authorId, content, upvotes, isAccepted, createdAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            id,
            questionId,
            answerData.authorName,
            answerData.authorRole || "",
            answerData.authorId,
            answerData.content,
            0,
            0,
            now
        );

        return db.prepare("SELECT * FROM answers WHERE id = ?").get(id);
    },

    upvoteQuestion: (questionId) => {
        db.prepare("UPDATE questions SET upvotes = upvotes + 1 WHERE id = ?").run(questionId);
        const q = db.prepare("SELECT upvotes FROM questions WHERE id = ?").get(questionId);
        return q ? q.upvotes : null;
    },

    upvoteAnswer: (questionId, answerId) => {
        db.prepare("UPDATE answers SET upvotes = upvotes + 1 WHERE id = ?").run(answerId);
        const a = db.prepare("SELECT upvotes FROM answers WHERE id = ?").get(answerId);
        return a ? a.upvotes : null;
    },

    acceptAnswer: (questionId, answerId) => {
        db.prepare("UPDATE answers SET isAccepted = 0 WHERE questionId = ?").run(questionId);
        db.prepare("UPDATE answers SET isAccepted = 1 WHERE id = ?").run(answerId);
        return true;
    }
};

module.exports = sqliteService;
