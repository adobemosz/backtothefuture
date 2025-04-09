const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper function to get token from model, create cookie, and send response
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    
    // Cookie options
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode)
        .cookie('token', token, options)
        .json({
            success: true,
            token
        });
};

// ✅ Register User
// @route  POST /api/v1/auth/register
// @access Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, telephoneNumber, role = 'user' } = req.body;

        if (!name || !email || !password || !telephoneNumber) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            telephoneNumber,
            role
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ✅ Login User
// @route  POST /api/v1/auth/login
// @access Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Please provide an email and password" });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    sendTokenResponse(user, 200, res);
};

// ✅ Get Current Logged-In User
// @route  GET /api/v1/auth/me
// @access Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// ✅ Logout User & Clear Cookie
// @route  POST /api/v1/auth/logout  (Changed from GET to POST)
// @access Private
exports.logout = (req, res) => {
    try {
        res.clearCookie('token');  // Clear the token from cookies
        res.status(200).json({ success: true, data: null, message: 'User logged out successfully' });
    } catch (error) {
        console.error('Logout Error:', error);
        res.status(500).json({ success: false, data: null, error: 'Server Error' });
    }
};
