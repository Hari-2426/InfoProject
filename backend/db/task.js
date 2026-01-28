const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const taskSchema = new mongoose.Schema(
    {
        _id: { type: String, default: uuidv4 },
        user_id: {
            type: String,
            ref: "User",
            required: true,
            index: true,
        },
        title: { type: String, required: true },
        description: { type: String },
        location: { type: String, required: true },
        start_time: { type: Date, required: true },
        end_time: { type: Date },
        status: {
            type: String,
            enum: ["pending", "active", "completed", "cancelled"],
            default: "pending",
        },
        budget: { type: Number },
        category: { type: String, required: true },
        picture: { type: String },
        picture_public_id: { type: String },
    },
    { timestamps: true, _id: false }
);

const Task = mongoose.model("Task", taskSchema);
module.exports = Task;