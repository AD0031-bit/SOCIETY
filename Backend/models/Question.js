const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
    {
        authorName: { type: String, required: true },
        authorRole: { type: String },
        authorId: { type: String, required: true },
        content: { type: String, required: true },
        upvotes: { type: Number, default: 0 },
        isAccepted: { type: Boolean, default: false }
    },
    { timestamps: true }
);

const questionSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        category: { type: String, required: true },
        tags: { type: [String], default: [] },
        authorName: { type: String, required: true },
        authorRole: { type: String },
        authorId: { type: String, required: true },
        upvotes: { type: Number, default: 0 },
        views: { type: Number, default: 1 },
        answers: [answerSchema]
    },
    { timestamps: true }
);

module.exports = mongoose.model("Question", questionSchema);
