const mongoose = require("mongoose");

const mentorshipSchema = new mongoose.Schema(
    {
        menteeId: { type: String, required: true },
        menteeName: { type: String, required: true },
        menteeEmail: { type: String },
        menteeRole: { type: String },
        mentorId: { type: String, required: true },
        mentorName: { type: String, required: true },
        mentorEmail: { type: String },
        mentorRole: { type: String },
        topic: { type: String, required: true },
        message: { type: String, required: true },
        preferredTime: { type: String, default: "Flexible" },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined", "completed"],
            default: "pending"
        },
        notes: { type: String, default: "" }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Mentorship", mentorshipSchema);
