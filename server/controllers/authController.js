const User = require("../models/User");
const OTP = require("../models/OTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendOtpEmail } = require("../utils/email.js");

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || "eventra_production_jwt_secret_key_2026", { expiresIn: "7d" });
}
// Register user
exports.registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
      isVerified: false,
    });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpRecord = await OTP.create({ email, otp, action: "account_verification" });
    try {
      await sendOtpEmail(email, otp, "account_verification");
    } catch (error) {
      await Promise.all([
        OTP.deleteOne({ _id: otpRecord._id }),
        User.deleteOne({ _id: user._id }),
      ]);
      throw error;
    }

    return res.status(201).json({
      message:
        "User registered successfully. Please check your email for the OTP to verify your account.",
      email: user.email,
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

// Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!user.isVerified && user.role === "user") {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await OTP.deleteMany({ email, action: "account_verification" });
      await OTP.create({ email, otp, action: "account_verification" });
      await sendOtpEmail(email, otp, "account_verification");
      return res.status(400).json({
        error: "Account not verified. Please check your email for the OTP to verify your account.",
        code: "ACCOUNT_NOT_VERIFIED"
      });
    }

    res.json({
      message: "Login successful",
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    })
};  

//verify OTP
exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body; 
  const otpRecord = await OTP.findOne({ email, otp, action: "account_verification" });
  
  if (!otpRecord) {
    return res.status(400).json({ error: "Invalid OTP" });

  }

  const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  await OTP.deleteMany({ email, action: "account_verification" });
  res.json(
    { 
        message: "Account verified successfully",
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
    });
};