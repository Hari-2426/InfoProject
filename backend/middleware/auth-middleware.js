const jwt = require("jsonwebtoken");
const User = require("../db/user");

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.[process.env.COOKIE_NAME];
    let decoded;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    try{
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    }catch(err){
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired, please login again" });
      }
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (decoded.iat * 1000 < req.user.last_password_change.getTime()) {
      return res.status(401).json({ message: "Token invalid after password reset" });
    }
    
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

module.exports = protect;

