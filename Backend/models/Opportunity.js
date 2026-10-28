const mongoose = require("mongoose");

const opportunitySchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        company: { type: String, required: true },
        type: {
            type: String,
            enum: ["Internship", "Referral", "Full-time", "Research"],
            required: true
        },
        location: { type: String, default: "Remote / Hybrid" },
        stipend: { type: String, default: "Disclosed upon application" },
        postedBy: { type: String, required: true },
        postedById: { type: String, required: true },
        postedByRole: { type: String },
        deadline: { type: String, default: "Open until filled" },
        link: { type: String, default: "#" },
        description: { type: String, required: true },
        referralAvailable: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Opportunity", opportunitySchema);
