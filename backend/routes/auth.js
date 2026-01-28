const User = require("../db/user");
const express = require("express");
const { registerNewUser, verifyOTP, resendOTP, loginUser, updateExistingUser, forgotPassword, resetPassword } = require("../handlers/auth-handler");
const authMiddleware = require("../middleware/auth-middleware");
const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        let model = req.body;
        console.log("Registration attempt for email:", model.email_id);
        let existingUser = await User.findOne({ email_id: model.email_id });

        if (existingUser && existingUser.is_verified)
            return res.status(409).json({ message: "User already exists" });

        let result;
        if (existingUser) {
            result = await updateExistingUser(model, existingUser);
        } else {
            result = await registerNewUser(model);
        }

        return res.status(result.status || 200).json({ message: result.message || "User registered. OTP sent to email." });

    } catch (err) {
        console.error("Register Route error:", err);

        if (err.code === 11000) {
            if (err.keyPattern?.phone_number)
                return res.status(409).json({ message: "Phone number already registered" });

            if (err.keyPattern?.email_id)
                return res.status(409).json({ message: "Email already registered" });

            throw new Error("User already exists.");
        }

        console.error("Register Route Error - Detailed:", {
            message: err.message,
            stack: err.stack,
            code: err.code
        });
        return res.status(500).json({ message: "Registration failed: " + err.message });
    }
});

router.post("/verify-otp", async (req, res) => {
    try {
        const model = req.body;
        if (!model.email_id || !model.otp)
            return res.status(400).json({ message: "Email and OTP are required" });

        const result = await verifyOTP(model);
        return res.status(result.status).json({ message: result.message });
    } catch (err) {
        console.error("Verify OTP route error:", err);
        return res.status(500).json({ message: "Something went wrong while verifying your OTP. Please try again." });
    }
});

router.post("/resend-otp", async (req, res) => {
    try {
        const model = req.body;
        if (!model.email_id)
            return res.status(400).json({ message: "Email is required" });

        const result = await resendOTP(model);
        return res.status(result.status).json({ message: result.message });
    } catch (err) {
        console.error("Resend OTP route error:", err);
        return res.status(500).json({ message: "Something went wrong while resending your OTP. Please try again." });
    }
});

router.post("/login", async (req, res) => {
    try {
        const model = req.body;
        if (!model.email_id || !model.password)
            return res.status(400).json({ message: "Email and password are required" });

        const result = await loginUser(model);
        if (result.token) {
            res.cookie(process.env.COOKIE_NAME, result.token, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: model.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000
            });
        }
        return res.status(result.status).json({ message: result.message });
    } catch (err) {
        console.error("Login route error:", err);
        return res.status(500).json({ message: "Something went wrong while logging you in. Please try again." });
    }
});

router.post("/forgot-password", async (req, res) => {
    try {
        const model = req.body;
        if (!model.email_id)
            return res.status(400).json({ message: "Email is required" });

        const result = await forgotPassword(model);
        return res.status(result.status).json({ message: result.message });
    } catch (err) {
        console.error("Password-Forget route error:", err);
        return res.status(500).json({ message: "Something went wrong while confirming your password." });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const model = req.body;
        if (!model.email_id || !model.password)
            return res.status(400).json({ message: "Email and password are required" });

        const result = await resetPassword(model);
        return res.status(result.status).json({ message: result.message });
    } catch (err) {
        console.error("Password-Reset route error:", err);
        return res.status(500).json({ message: "Something went wrong while resetting your password.  Please try again." });
    }
});

router.post("/logout", async (req, res) => {
    try {
        res.clearCookie(process.env.COOKIE_NAME, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
        });

        return res.status(200).json({ message: "Logged out successfully" });

    } catch (err) {
        console.error("Logout route failed:", err);
        return res.status(500).json({ message: "Logout failed" });
    }
});

router.get("/me", authMiddleware, async (req, res) => {
    try {
        const sanitizeUser = (user) => ({
            first_name: user.first_name,
            last_name: user.last_name,
            email_id: user.email_id,
        });

        return res.status(200).json({ authenticated: true, user: sanitizeUser(req.user) });

    } catch (err) {
        console.error("/me route error:", err);
        return res.status(500).json({ authenticated: false, message: "Failed to fetch user" });
    }
});

module.exports = router;
