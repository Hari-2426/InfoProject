const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const acceptedTasksSchema = new mongoose.Schema(
    {
        user_id: { type: String, ref: "User", required: true },
        task_id: { type: String, ref: "Task", required: true },
        status: {
        type: String,
        enum: ["pending", "accepted", "completed"],
        default: "pending",
        },
    },
    { timestamps: true }
);

const AcceptedTasks = mongoose.model("AcceptedTasks", acceptedTasksSchema);
module.exports = AcceptedTasks;