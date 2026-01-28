const User = require("../db/user")
const bcrypt = require("bcryptjs")
const { generateAndSendOTP,welcomeMsg } = require("../utils/otp")
const jwt = require("jsonwebtoken");

async function updateExistingUser(model,user){
    let hashPassword;
    try{
        const salt = await bcrypt.genSalt(10);
        hashPassword = await bcrypt.hash(model.password,salt);
    }
    catch(err){
        console.error("Password hashing failed:", err);
        return { status: 500, message: "Something went wrong while securing your password"};
    }

    try{
        user.first_name=model.first_name;
        user.last_name=model.last_name;
        user.phone_number=model.phone_number;
        user.email_id=model.email_id;
        user.password=hashPassword;

        await user.save();
        try{
            const result = await resendOTP(user);
            if (result.status !== 200) {
                return result;
            }
        }catch(err){
            console.error("Problem Sending OTP:", err);
            return { status: 500, message: "Failed to send OTP" };
        }
        return { status: 200, message: "User updated successfully" };
    }catch(err){
        console.error("Database save failed:", err);
        if (err && err.code === 11000) {
            throw err; 
        }
        throw err;
    }
}
async function registerNewUser(model){
    let hashPassword;
    try{
        const salt = await bcrypt.genSalt(10);
        hashPassword = await bcrypt.hash(model.password,salt);
    }
    catch(err){
        console.error("Password hashing failed:", err);
        return { status: 500, message: "Something went wrong while securing your password"};
    }

    try{
        let user = new User({
            first_name:model.first_name,
            last_name:model.last_name,
            phone_number:model.phone_number,
            email_id:model.email_id,
            password:hashPassword,
        });

        await user.save();
        try{
            await generateAndSendOTP(user,false);
        }catch(err){
            console.error("Problem Sending OTP:", err);
            return { status: 500, message: "Failed to send OTP" };
        }
        return { status: 200, message: "User registered successfully" };
    }catch(err){
        console.error("Database save failed:", err);
        if (err && err.code === 11000) {
            throw err; 
        }
        throw err;
    }
}


async function verifyOTP(model){
    try{
        const email = model.email_id;
        const user = await User.findOne({ email_id:email });
        if (!user)
            return { status: 404, message: "User not found." };

        
        if (user.otp_blocked_time && Date.now() < user.otp_blocked_time)
            return { status: 429, message: "Too many failed attempts. Try again later." };

        if (!user.otp_hash || Date.now() > user.otp_expires_at)
            return { status: 400, message: "OTP expired. Please resend OTP." };


        const otp = model.otp;
        const valid = await bcrypt.compare(otp, user.otp_hash);
        if (!valid){
            user.otp_attempts = user.otp_attempts+ 1;
            if (user.otp_attempts >= 6){
                user.otp_blocked_time = Date.now() + 10 * 60 * 1000; 
                await user.save();
                return { status: 429, message: "Too many wrong attempts. Try again in 10 minutes." };
            }

            await user.save();
            return { status: 400, message: `Invalid OTP. Attempts left: ${6 - user.otp_attempts}`  };
        }

        user.is_verified=true;
        user.otp_hash=null;
        user.otp_expires_at=null;
        user.last_password_change=new Date();
        user.otp_attempts = 0;
        user.otp_blocked_time = null;
        user.password_is_verified=true;
        await user.save();

        try{
            if(model.first_time)
                await welcomeMsg(user.email_id, `${user.first_name} ${user.last_name}`);
        }catch(err){
            console.error("Welcome message failed:", err);
        }

        return { status: 200, message: "Email verified successfully" };
    }catch(err){
        console.error("OTP verification failed:", err);
        return { status: 500, message: "Something went wrong while verifying your OTP." };
    }
}

async function resendOTP(model){
    try{
        const email = model.email_id;
        const user = await User.findOne({ email_id:email });
        if (!user)
            return { status: 404, message: "User not found." };

        const expiresAt = new Date(user.otp_expires_at).getTime();
        const now = Date.now();
        const cooldown = 4 * 60 * 1000; 
        if (now < expiresAt - cooldown)
            return { status: 429, message: "Please wait before requesting another OTP"};

        try{
            await generateAndSendOTP(user,false);
        }catch(err){
            console.error("Problem Sending OTP:", err);
            return { status: 500, message: "Failed to send OTP" };
        }
        return { status: 200, message: "OTP resent successfully" };
    }catch(err){
        console.error("Resend OTP failed:", err);
        return { status: 500, message: "Something went wrong while resending your OTP." };
    }
}

async function loginUser(model){
    try{
        const email = model.email_id;
        const user = await User.findOne({ email_id:email });
        if (!user)
            return { status: 404, message: "User not found." };

        if (!user.is_verified)
            return { status: 400, message: "User not verified." };

        const valid = await bcrypt.compare(model.password,user.password);

        if(!valid)
            return { status: 400, message: "Invalid Password." };

        const expiresIn = model.rememberMe ? "30d" : "2h";
        const userId = user._id;
        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });

        return { status: 200, message: "Login successful", token };
    }catch(err){
        console.error("Login failed:", err);
        return { status: 500, message: "Something went wrong while logging in. Please try again later." };
    }
}

async function forgotPassword(model){
    try{
        const email = model.email_id;
        const user = await User.findOne({ email_id:email });
        if (!user)
            return { status: 404, message: "User not found." };

        if (!user.is_verified)
            return { status: 400, message: "User is not verified. Password cannot be changed." };

        try{
            await generateAndSendOTP(user,true);
        }catch(err){
            console.error("Problem Sending OTP:", err);
        }
        return { status: 200, message: "OTP sent successfully." };
    }catch(err){
        console.error("Login failed:", err);
        return { status: 500, message: "Something went wrong while logging in. Please try again later." };
    }
}

async function resetPassword(model){
    try{
        const email = model.email_id;
        const user = await User.findOne({ email_id:email });
        if (!user)
            return { status: 404, message: "User not found." };

        if (!user.is_verified || !user.password_is_verified)
            return { status: 400, message: "User is not verified. Password cannot be changed." };

        let hashPassword;
        try{
            const salt = await bcrypt.genSalt(10);
            hashPassword = await bcrypt.hash(model.password,salt);
        }
        catch(err){
            console.error("Password hashing failed:", err);
            return { status: 500,message: "Something went wrong while securing your password"};
        }

        user.password = hashPassword;
        user.last_password_change=new Date();
        user.otp_hash = null;
        user.otp_expires_at = null;
        await user.save();
        return { status: 200, message: "Password reset successful." };
    }catch(err){
        console.error("Login failed:", err);
        return { status: 500, message: "Something went wrong while logging in. Please try again later." };
    }
}

module.exports = {
    registerNewUser,
    verifyOTP,
    resendOTP,
    loginUser,
    updateExistingUser,
    forgotPassword, 
    resetPassword 
};
