const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const notificationSchema = new mongoose.Schema(
  {
        _id: { type: String, default: uuidv4 },
        user_id: {
        type: String,
        ref: "User",
        required: true,
        index: true
        },
        message: { type: String, required: true },
        read: { type: Boolean, default: false },
    },
    { timestamps: true, _id: false }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;