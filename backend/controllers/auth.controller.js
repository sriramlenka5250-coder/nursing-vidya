const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendVerificationEmail = require('../services/sendMail');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        
        const user = await User.create({ 
            name, 
            email, 
            password,
            verificationToken 
        });

        if (user) {
            const verificationUrl = `${process.env.BACKEND_URL || 'https://api.nursingvidya.shop'}/api/auth/verify/${verificationToken}`;
            await sendVerificationEmail(user.email, verificationUrl);

            res.status(201).json({
                message: 'Registration successful! Please check your email to verify your account.',
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select("+password");

        if (user && (await user.matchPassword(password))) {
            if (!user.isVerified && user.role !== 'admin') {
                return res.status(403).json({ message: 'Please verify your email before logging in.' });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Admin login/setup (TEMPORARY: easy way to create admin)
// @route   POST /api/auth/admin-setup
// @access  Public (Protected by secret)
const adminSetup = async (req, res) => {
    const { name, email, password, adminSecret } = req.body;

    if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(401).json({ message: 'Invalid Admin Secret' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ name, email, password, role: 'admin' });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile (email/password)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    const { email, password, currentPassword } = req.body;

    try {
        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        // Update email if provided
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }

        // Update password if provided
        if (password) {
            user.password = password;
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser._id),
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify user email
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({ verificationToken: req.params.token });

        if (!user) {
            const frontendUrl = 'https://www.nursingvidya.shop';
            return res.redirect(`${frontendUrl}/login?error=invalid_token`);
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        const frontendUrl = 'https://www.nursingvidya.shop';
        res.redirect(`${frontendUrl}/login?verified=true`);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    signup,
    login,
    adminSetup,
    updateProfile,
    verifyEmail
};
