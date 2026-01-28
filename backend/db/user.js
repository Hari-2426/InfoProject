const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const userSchema = new mongoose.Schema({
        _id: { type: String, default: uuidv4 },
        first_name: { type: String, required: true },
        last_name:  { type: String, required: true },
        phone_number: { 
            type: String, 
            required: true, 
            unique:true 
        },
        email_id: {
            type: String, 
            required: true, 
            unique: true, 
            index: true
        },
        password: { type: String, required: true },
        last_password_change: { type: Date, default: Date.now },
        profile_picture: { type: String },
        otp_hash: { type: String, default: null },
        otp_expires_at: { type: Date, default: null },
        otp_resend_timer: { type: Date, default: null },
        otp_attempts: { type:Number, default:0 },
        otp_blocked_time: { type:Date, default:null },
        password_is_verified: { type: Boolean, default: true },
        is_verified: { type: Boolean, default: false }
    },
    { timestamps: true, _id: false }
);
const User = mongoose.model("User",userSchema);
module.exports = User;