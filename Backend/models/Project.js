const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        domain: { type: String, required: true },
        hackathon: { type: String, default: "College Project" },
        status: {
            type: String,
            default: "Looking for Teammates"
        },
        description: { type: String, required: true },
        skillsNeeded: { type: [String], default: [] },
        leaderName: { type: String, required: true },
        leaderId: { type: String, required: true },
        leaderRole: { type: String },
        members: { type: [String], default: [] }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
