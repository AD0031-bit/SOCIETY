const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const db = require("./services/db");

// Mongoose Models
const User = require("./models/User");
const Mentorship = require("./models/Mentorship");
const Opportunity = require("./models/Opportunity");
const Project = require("./models/Project");
const Question = require("./models/Question");

async function migrate() {
    console.log("=== THE SOCIETY: MIGRATING DATA TO MONGODB ===");
    console.log("Connecting to:", process.env.MONGO_URI.replace(/:([^:@]+)@/, ":****@"));

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connection established successfully!");

        // 1. Sync Users
        const users = db.getUsers();
        console.log(`\nImporting ${users.length} users...`);
        for (const u of users) {
            await User.findOneAndUpdate(
                { email: u.email.toLowerCase() },
                {
                    name: u.name,
                    email: u.email.toLowerCase(),
                    password: u.password,
                    role: u.role,
                    college: u.college || "Engineering College of Technology",
                    branch: u.branch || "CSE",
                    gradYear: u.gradYear || "2027",
                    bio: u.bio || "",
                    skills: u.skills || [],
                    interests: u.interests || [],
                    github: u.github || "",
                    linkedin: u.linkedin || "",
                    reputation: u.reputation || 20,
                    badges: u.badges || ["New Member"],
                    isMentorAvailable: !!u.isMentorAvailable,
                    mentorBio: u.mentorBio || "",
                    mentorTopics: u.mentorTopics || []
                },
                { upsert: true, new: true }
            );
        }
        console.log("✓ Users successfully synced to MongoDB.");

        // 2. Sync Opportunities
        const opps = db.getOpportunities();
        console.log(`\nImporting ${opps.length} opportunities...`);
        for (const o of opps) {
            await Opportunity.findOneAndUpdate(
                { title: o.title, company: o.company },
                o,
                { upsert: true }
            );
        }
        console.log("✓ Opportunities successfully synced to MongoDB.");

        // 3. Sync Projects
        const projs = db.getProjects();
        console.log(`\nImporting ${projs.length} projects...`);
        for (const p of projs) {
            await Project.findOneAndUpdate(
                { title: p.title, leaderName: p.leaderName },
                p,
                { upsert: true }
            );
        }
        console.log("✓ Projects successfully synced to MongoDB.");

        // 4. Sync Q&A
        const questions = db.getQuestions();
        console.log(`\nImporting ${questions.length} questions...`);
        for (const q of questions) {
            await Question.findOneAndUpdate(
                { title: q.title },
                q,
                { upsert: true }
            );
        }
        console.log("✓ Q&A questions & answers successfully synced to MongoDB.");

        console.log("\n=== ALL DATA SUCCESSFULLY IMPORTED INTO MONGODB! ===");
        process.exit(0);
    } catch (err) {
        console.error("\nMigration failed:", err.message);
        console.error("Please verify your MONGO_URI and network connection.");
        process.exit(1);
    }
}

migrate();
