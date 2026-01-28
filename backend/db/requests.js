const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
    {
        task_id: {
        type: String,
        ref: "Task",
        required: true,
        },
        requester_id: {
        type: String,
        ref: "User",
        required: true,
        },
        status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
        },
    },
    { timestamps: true }
);

const Requests = mongoose.model("Requests", requestSchema);
module.exports = Requests;