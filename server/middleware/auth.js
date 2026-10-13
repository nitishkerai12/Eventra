const jwt = require("jsonwebtoken");
const User = require("../models/User.js");

// User authentication middleware
const protect = async (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization && authorization.startsWith("Bearer ")
        ? authorization.slice(7)
        : null;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
            if (!req.user) {
                return res.status(401).json({ error: "Not authorized, user not found" });
            }   
            next();

        } catch (error) {
            return res.status(401).json({ error: "Not authorized, token failed" });
        }
    } else {
        return res.status(401).json({ error: "Not authorized, no token" });
    }
    
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } 
    else {
        return res.status(403).json({ message: "Forbidden,admin access required" });
    }
};

module.exports = { protect, admin };